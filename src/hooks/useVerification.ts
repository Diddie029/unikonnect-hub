import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VerificationRequest {
  id: string;
  user_id: string;
  reason: string;
  status: string;
  payment_reference: string | null;
  amount_kshs: number;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  profile?: {
    name: string;
    username: string;
    avatar_url: string | null;
  };
}

export function useVerification() {
  const { user, isAdmin } = useAuth();
  const [myRequest, setMyRequest] = useState<VerificationRequest | null>(null);
  const [allRequests, setAllRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // Fetch own request
    const { data: own } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setMyRequest(own);

    // If admin, fetch all pending
    if (isAdmin) {
      const { data: all } = await supabase
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (all && all.length > 0) {
        const userIds = [...new Set(all.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, username, avatar_url')
          .in('user_id', userIds);
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        setAllRequests(all.map(r => ({ ...r, profile: profileMap.get(r.user_id) })));
      } else {
        setAllRequests([]);
      }
    }

    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('verification-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_requests' }, () => fetchRequests())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchRequests]);

  const applyForVerification = useCallback(async (reason: string, paymentReference: string) => {
    if (!user) return;
    await supabase.from('verification_requests').insert({
      user_id: user.id,
      reason,
      payment_reference: paymentReference,
    });
  }, [user]);

  const approveVerification = useCallback(async (requestId: string, userId: string) => {
    if (!user) return;
    await supabase.from('verification_requests').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    }).eq('id', requestId);

    // Set user as verified
    await supabase.from('profiles').update({ is_verified: true }).eq('user_id', userId);

    await supabase.from('audit_logs').insert({
      action: 'approve_verification',
      admin_id: user.id,
      target_id: userId,
      target_type: 'user',
      details: { request_id: requestId },
    });
  }, [user]);

  const rejectVerification = useCallback(async (requestId: string, userId: string, notes: string) => {
    if (!user) return;
    await supabase.from('verification_requests').update({
      status: 'rejected',
      admin_notes: notes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    }).eq('id', requestId);

    await supabase.from('audit_logs').insert({
      action: 'reject_verification',
      admin_id: user.id,
      target_id: userId,
      target_type: 'user',
      details: { request_id: requestId, notes },
    });
  }, [user]);

  return {
    myRequest,
    allRequests,
    pendingRequests: allRequests.filter(r => r.status === 'pending'),
    loading,
    applyForVerification,
    approveVerification,
    rejectVerification,
    refetch: fetchRequests,
  };
}
