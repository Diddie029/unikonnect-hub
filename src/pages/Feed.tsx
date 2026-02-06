import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_POSTS, type Post } from '@/data/mockData';
import PostCard from '@/components/feed/PostCard';
import CreatePostDialog from '@/components/feed/CreatePostDialog';
import { TrendingUp, Users, BookOpen } from 'lucide-react';

const TRENDING_TOPICS = [
  { tag: '#DataStructures', count: 128 },
  { tag: '#CapstoneSeason', count: 95 },
  { tag: '#LabLife', count: 74 },
  { tag: '#MathIsMagic', count: 62 },
  { tag: '#HackathonWeekend', count: 51 },
];

export default function Feed() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);

  const handleCreatePost = (content: string, image?: string) => {
    if (!currentUser) return;
    const newPost: Post = {
      id: String(Date.now()),
      userId: currentUser.id,
      userName: currentUser.name,
      userUsername: currentUser.username,
      userUniversity: currentUser.university,
      content,
      image,
      likes: [],
      comments: [],
      createdAt: new Date(),
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const handleLike = (postId: string) => {
    if (!currentUser) return;
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const liked = p.likes.includes(currentUser.id);
        return {
          ...p,
          likes: liked ? p.likes.filter(id => id !== currentUser.id) : [...p.likes, currentUser.id],
        };
      })
    );
  };

  const handleComment = (postId: string, content: string) => {
    if (!currentUser) return;
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: String(Date.now()),
              userId: currentUser.id,
              userName: currentUser.name,
              content,
              createdAt: new Date(),
            },
          ],
        };
      })
    );
  };

  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          <CreatePostDialog onPost={handleCreatePost} />

          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <PostCard
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block space-y-4">
          {/* Trending */}
          <div className="rounded-xl bg-card shadow-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold font-display text-card-foreground">Trending</h3>
            </div>
            <div className="space-y-2.5">
              {TRENDING_TOPICS.map(topic => (
                <div key={topic.tag} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary hover:underline cursor-pointer">
                    {topic.tag}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{topic.count} posts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="rounded-xl bg-card shadow-card p-4">
            <h3 className="text-sm font-semibold font-display text-card-foreground mb-3">
              Community
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">1,247</p>
                  <p className="text-[11px] text-muted-foreground">Active Students</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <BookOpen className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">42</p>
                  <p className="text-[11px] text-muted-foreground">Discussion Rooms</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}