import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/hooks/useNotifications';

export function useFollows() {
  const { user } = useAuth();
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollows = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const [followingRes, followersRes] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', user.id),
      supabase.from('follows').select('follower_id').eq('following_id', user.id),
    ]);

    setFollowing((followingRes.data || []).map(f => f.following_id));
    setFollowers((followersRes.data || []).map(f => f.follower_id));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFollows();

    const channel = supabase
      .channel('follows-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, () => fetchFollows())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchFollows]);

  const followUser = useCallback(async (userId: string) => {
    if (!user || userId === user.id) return;
    await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
    // Notify the followed user
    const { data: myProfile } = await supabase.from('profiles').select('name').eq('user_id', user.id).single();
    createNotification({
      userId,
      type: 'follow',
      title: `${myProfile?.name || 'Someone'} started following you`,
      message: 'Check out their profile!',
    });
  }, [user]);

  const unfollowUser = useCallback(async (userId: string) => {
    if (!user) return;
    await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
  }, [user]);

  const isFollowing = useCallback((userId: string) => following.includes(userId), [following]);
  const isFollower = useCallback((userId: string) => followers.includes(userId), [followers]);

  return {
    following,
    followers,
    loading,
    followUser,
    unfollowUser,
    isFollowing,
    isFollower,
    followingCount: following.length,
    followersCount: followers.length,
    refetch: fetchFollows,
  };
}
