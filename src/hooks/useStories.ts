import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StoryWithDetails {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string;
  created_at: string;
  expires_at: string;
  profile: {
    name: string;
    username: string;
    avatar_url: string | null;
    is_verified?: boolean;
  } | null;
  likes_count: number;
  is_liked: boolean;
}

export function useStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    const { data: storiesData } = await supabase
      .from('stories')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!storiesData) { setLoading(false); return; }

    const userIds = [...new Set(storiesData.map(s => s.user_id))];
    const storyIds = storiesData.map(s => s.id);

    const [profilesRes, likesRes] = await Promise.all([
      userIds.length > 0 ? supabase.from('profiles').select('user_id, name, username, avatar_url, is_verified').in('user_id', userIds) : { data: [] },
      storyIds.length > 0 ? supabase.from('story_likes').select('*').in('story_id', storyIds) : { data: [] },
    ]);

    const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
    const likesByStory = new Map<string, any[]>();
    (likesRes.data || []).forEach(l => {
      const arr = likesByStory.get(l.story_id) || [];
      arr.push(l);
      likesByStory.set(l.story_id, arr);
    });

    const enriched: StoryWithDetails[] = storiesData.map(s => {
      const storyLikes = likesByStory.get(s.id) || [];
      return {
        id: s.id,
        user_id: s.user_id,
        content: s.content,
        media_url: s.media_url,
        media_type: s.media_type || 'image',
        created_at: s.created_at,
        expires_at: s.expires_at,
        profile: profileMap.get(s.user_id) || null,
        likes_count: storyLikes.length,
        is_liked: user ? storyLikes.some(l => l.user_id === user.id) : false,
      };
    });

    setStories(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStories();

    const channel = supabase
      .channel('stories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => fetchStories())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_likes' }, () => fetchStories())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStories]);

  const createStory = useCallback(async (content: string | null, mediaFile: File | null) => {
    if (!user) return;

    let media_url: string | null = null;
    let media_type = 'image';

    if (mediaFile) {
      const ext = mediaFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('post-media').upload(path, mediaFile);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(path);
        media_url = publicUrl;
        media_type = mediaFile.type.startsWith('video') ? 'video' : 'image';
      }
    }

    await supabase.from('stories').insert({
      user_id: user.id,
      content,
      media_url,
      media_type,
    });
  }, [user]);

  const likeStory = useCallback(async (storyId: string) => {
    if (!user) return;
    const story = stories.find(s => s.id === storyId);
    if (!story) return;

    if (story.is_liked) {
      await supabase.from('story_likes').delete().eq('story_id', storyId).eq('user_id', user.id);
    } else {
      await supabase.from('story_likes').insert({ story_id: storyId, user_id: user.id });
    }
  }, [user, stories]);

  const deleteStory = useCallback(async (storyId: string) => {
    await supabase.from('stories').delete().eq('id', storyId);
  }, []);

  // Group stories by user
  const storiesByUser = stories.reduce((acc, story) => {
    const key = story.user_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(story);
    return acc;
  }, {} as Record<string, StoryWithDetails[]>);

  return { stories, storiesByUser, loading, createStory, likeStory, deleteStory, refetch: fetchStories };
}
