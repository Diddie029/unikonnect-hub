import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFollows } from '@/hooks/useFollows';
import { usePosts, type PostWithDetails } from '@/hooks/usePosts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import VerificationBadge from '@/components/profile/VerificationBadge';
import PostCard from '@/components/feed/PostCard';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  UserPlus,
  UserMinus,
} from 'lucide-react';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

interface UserProfileData {
  user_id: string;
  username: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  university: string | null;
  course: string | null;
  year_of_study: number | null;
  is_verified: boolean;
  created_at: string;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { isFollowing, followUser, unfollowUser } = useFollows();
  const { posts, likePost, commentOnPost, deletePost } = usePosts();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      const [profileRes, followersRes, followingRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('follows').select('id').eq('following_id', userId),
        supabase.from('follows').select('id').eq('follower_id', userId),
      ]);
      if (profileRes.data) {
        setProfile(profileRes.data as UserProfileData);
      }
      setFollowerCount(followersRes.data?.length || 0);
      setFollowingCount(followingRes.data?.length || 0);
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const userPosts = posts.filter(p => p.user_id === profile.user_id);
  const isOwnProfile = user?.id === profile.user_id;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card shadow-card overflow-hidden"
      >
        <div className="h-32 gradient-primary relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-8 h-24 w-24 rounded-full bg-primary-foreground/20 blur-2xl" />
          </div>
        </div>

        <div className="relative px-6 pb-6">
          <div className="relative -mt-10 w-fit">
            <Avatar className="h-20 w-20 border-4 border-card">
              {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.name} /> : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold font-display">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex items-start justify-between mt-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-card-foreground">{profile.name}</h1>
                <VerificationBadge isVerified={profile.is_verified} />
              </div>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>

            {!isOwnProfile && userId && (
              isFollowing(userId) ? (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => unfollowUser(userId)}>
                  <UserMinus className="h-3.5 w-3.5" /> Unfollow
                </Button>
              ) : (
                <Button size="sm" className="gap-1.5" onClick={() => followUser(userId)}>
                  <UserPlus className="h-3.5 w-3.5" /> Follow
                </Button>
              )
            )}
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="text-sm">
              <span className="font-semibold text-card-foreground">{followerCount}</span>{' '}
              <span className="text-muted-foreground">followers</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-card-foreground">{followingCount}</span>{' '}
              <span className="text-muted-foreground">following</span>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-3 text-sm text-card-foreground/80 leading-relaxed">{profile.bio}</p>
          )}
        </div>
      </motion.div>

      {/* Academic Info */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl bg-card shadow-card p-6">
        <h2 className="text-sm font-semibold font-display text-card-foreground mb-4">Academic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">University</p>
              <p className="text-sm font-medium text-card-foreground">{profile.university || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Course</p>
              <p className="text-sm font-medium text-card-foreground">{profile.course || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Year</p>
              <p className="text-sm font-medium text-card-foreground">{profile.year_of_study ? `Year ${profile.year_of_study}` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* User's Posts */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-sm font-semibold font-display text-card-foreground mb-3">
          Posts ({userPosts.length})
        </h2>
        {userPosts.length === 0 ? (
          <div className="rounded-xl bg-card shadow-card p-8 text-center">
            <p className="text-xs text-muted-foreground">No posts yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={likePost}
                onComment={commentOnPost}
                onDelete={deletePost}
              />
            ))}
          </div>
        )}
      </motion.div>

      <div className="rounded-xl bg-card shadow-card p-6">
        <p className="text-xs text-muted-foreground">
          Member since{' '}
          <span className="font-medium text-card-foreground">
            {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </p>
      </div>
    </div>
  );
}
