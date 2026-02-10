import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/hooks/usePosts';
import PostCard from '@/components/feed/PostCard';
import CreatePostDialog from '@/components/feed/CreatePostDialog';
import ConfessionWall from '@/components/feed/ConfessionWall';
import StoriesBar from '@/components/feed/StoriesBar';
import { TrendingUp, Users, Flame } from 'lucide-react';

export default function Feed() {
  const { profile } = useAuth();
  const { posts, loading, createPost, likePost, commentOnPost, deletePost } = usePosts();
  const [activeTab, setActiveTab] = useState<'feed' | 'confessions'>('feed');

  // Extract trending hashtags from posts
  const hashtagCounts = new Map<string, number>();
  posts.forEach(p => {
    (p.hashtags || []).forEach(tag => {
      hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
    });
  });
  const trendingHashtags = [...hashtagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('feed')}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'feed'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              📰 Feed
            </button>
            <button
              onClick={() => setActiveTab('confessions')}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'confessions'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              🔥 Confessions
            </button>
          </div>

          {activeTab === 'feed' ? (
            <>
              <StoriesBar />
              <CreatePostDialog onPost={createPost} />

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No posts yet. Be the first to share!</p>
                </div>
              ) : (
                posts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <PostCard
                      post={post}
                      onLike={likePost}
                      onComment={commentOnPost}
                      onDelete={deletePost}
                    />
                  </motion.div>
                ))
              )}
            </>
          ) : (
            <ConfessionWall />
          )}
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
              {trendingHashtags.length > 0 ? trendingHashtags.map(([tag, count]) => (
                <div key={tag} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary hover:underline cursor-pointer">
                    #{tag}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{count} posts</span>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground">No trending topics yet</p>
              )}
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
                  <p className="text-sm font-semibold text-card-foreground">{posts.length}</p>
                  <p className="text-[11px] text-muted-foreground">Total Posts</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <Flame className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    {posts.reduce((acc, p) => acc + p.likes_count, 0)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Total Likes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
