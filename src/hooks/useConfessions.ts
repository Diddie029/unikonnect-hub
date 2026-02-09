import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Confession {
  id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
}

export function useConfessions() {
  const { user, isAdmin } = useAuth();
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [pendingConfessions, setPendingConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfessions = useCallback(async () => {
    // Approved confessions visible to all
    const { data: approved } = await supabase
      .from('confessions')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    setConfessions((approved || []) as Confession[]);

    // Admin sees pending
    if (isAdmin) {
      const { data: pending } = await supabase
        .from('confessions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      setPendingConfessions((pending || []) as Confession[]);
    }

    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchConfessions();

    const channel = supabase
      .channel('confessions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'confessions' }, () => fetchConfessions())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchConfessions]);

  const submitConfession = useCallback(async (content: string) => {
    if (!user) return;
    await supabase.from('confessions').insert({ user_id: user.id, content });
  }, [user]);

  const approveConfession = useCallback(async (id: string) => {
    await supabase.from('confessions').update({ status: 'approved' }).eq('id', id);
    await supabase.from('audit_logs').insert({
      action: 'approve_confession',
      admin_id: user?.id,
      target_id: id,
      target_type: 'confession',
    });
  }, [user]);

  const rejectConfession = useCallback(async (id: string) => {
    await supabase.from('confessions').update({ status: 'rejected' }).eq('id', id);
    await supabase.from('audit_logs').insert({
      action: 'reject_confession',
      admin_id: user?.id,
      target_id: id,
      target_type: 'confession',
    });
  }, [user]);

  return { confessions, pendingConfessions, loading, submitConfession, approveConfession, rejectConfession };
}
