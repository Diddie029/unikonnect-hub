import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload) => {
        const newNotif = payload.new as Notification;
        if (newNotif.user_id === user?.id) {
          setNotifications(prev => [newNotif, ...prev].slice(0, 50));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications, user]);

  const markAsRead = useCallback(async (notifId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead, refetch: fetchNotifications };
}

// Helper to create a notification for another user
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
}) {
  await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    related_id: params.relatedId || null,
  });
}
