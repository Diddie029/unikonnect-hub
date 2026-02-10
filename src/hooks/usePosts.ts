import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PostWithDetails {
  id: string;
  user_id: string;
  content: string;
  hashtags: string[] | null;
  visibility: string;
  created_at: string;
  // Joined data
  profile: {
    username: string;
    name: string;
    avatar_url: string | null;
    university: string | null;
    is_verified?: boolean;
  } | null;
  media: { id: string; media_url: string; media_type: string }[];
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  comments: CommentWithProfile[];
}

export interface CommentWithProfile {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: { name: string; username: string; avatar_url: string | null } | null;
}

export function usePosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!postsData) { setLoading(false); return; }

    const postIds = postsData.map(p => p.id);
    const userIds = [...new Set(postsData.map(p => p.user_id))];

    // Fetch related data in parallel
    const [profilesRes, mediaRes, likesRes, commentsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, username, name, avatar_url, university, is_verified').in('user_id', userIds),
      supabase.from('post_media').select('*').in('post_id', postIds),
      supabase.from('likes').select('*').in('post_id', postIds),
      supabase.from('comments').select('*').in('post_id', postIds).order('created_at', { ascending: true }),
    ]);

    const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
    const mediaByPost = new Map<string, typeof mediaRes.data>();
    (mediaRes.data || []).forEach(m => {
      const arr = mediaByPost.get(m.post_id) || [];
      arr.push(m);
      mediaByPost.set(m.post_id, arr);
    });

    const likesByPost = new Map<string, typeof likesRes.data>();
    (likesRes.data || []).forEach(l => {
      const arr = likesByPost.get(l.post_id) || [];
      arr.push(l);
      likesByPost.set(l.post_id, arr);
    });

    const commentsByPost = new Map<string, typeof commentsRes.data>();
    const commentUserIds = new Set<string>();
    (commentsRes.data || []).forEach(c => {
      const arr = commentsByPost.get(c.post_id) || [];
      arr.push(c);
      commentsByPost.set(c.post_id, arr);
      commentUserIds.add(c.user_id);
    });

    // Fetch comment user profiles
    let commentProfileMap = new Map<string, any>();
    if (commentUserIds.size > 0) {
      const { data: commentProfiles } = await supabase
        .from('profiles')
        .select('user_id, name, username, avatar_url')
        .in('user_id', [...commentUserIds]);
      if (commentProfiles) {
        commentProfileMap = new Map(commentProfiles.map(p => [p.user_id, p]));
      }
    }

    const enriched: PostWithDetails[] = postsData.map(post => {
      const postLikes = likesByPost.get(post.id) || [];
      const postComments = (commentsByPost.get(post.id) || []).map(c => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        profile: commentProfileMap.get(c.user_id) || null,
      }));

      return {
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        hashtags: post.hashtags,
        visibility: post.visibility,
        created_at: post.created_at,
        profile: profileMap.get(post.user_id) || null,
        media: (mediaByPost.get(post.id) || []).map(m => ({
          id: m.id,
          media_url: m.media_url,
          media_type: m.media_type,
        })),
        likes_count: postLikes.length,
        comments_count: postComments.length,
        is_liked: user ? postLikes.some(l => l.user_id === user.id) : false,
        comments: postComments,
      };
    });

    setPosts(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPosts();

    // Real-time subscription
    const channel = supabase
      .channel('posts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => fetchPosts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const createPost = useCallback(async (content: string, hashtags: string[], visibility: string, mediaFiles: File[]) => {
    if (!user) return;

    const { data: post, error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, content, hashtags, visibility: visibility as any })
      .select()
      .single();

    if (error || !post) return;

    // Upload media
    for (const file of mediaFiles) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${post.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(path, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(path);
        const mediaType = file.type.startsWith('video') ? 'video' : 'image';
        await supabase.from('post_media').insert({
          post_id: post.id,
          media_url: publicUrl,
          media_type: mediaType,
        });
      }
    }

    await fetchPosts();
  }, [user, fetchPosts]);

  const likePost = useCallback(async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.is_liked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
    }
  }, [user, posts]);

  const commentOnPost = useCallback(async (postId: string, content: string) => {
    if (!user) return;
    await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content });
  }, [user]);

  const deletePost = useCallback(async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
  }, []);

  return { posts, loading, createPost, likePost, commentOnPost, deletePost, refetch: fetchPosts };
}
