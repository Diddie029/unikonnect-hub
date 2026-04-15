import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_content_id: string | null;
  content_type: string;
  reason: string;
  description: string | null;
  status: string;
  priority: string;
  resolved_by: string | null;
  resolved_at: string | null;
  admin_notes: string | null;
  created_at: string;
  reporter?: { name: string; username: string };
  reported_user?: { name: string; username: string };
}

export function useReports() {
  const { user, isAdmin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    if (!user || !isAdmin) { setLoading(false); return; }
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data && data.length > 0) {
      const userIds = [...new Set([
        ...data.map(r => r.reporter_id),
        ...data.filter(r => r.reported_user_id).map(r => r.reported_user_id!),
      ])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, username')
        .in('user_id', userIds);
      const map = new Map((profiles || []).map(p => [p.user_id, p]));
      setReports(data.map(r => ({
        ...r,
        reporter: map.get(r.reporter_id),
        reported_user: r.reported_user_id ? map.get(r.reported_user_id) : undefined,
      })));
    } else {
      setReports([]);
    }
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const updateReport = useCallback(async (id: string, updates: { status?: string; admin_notes?: string; priority?: string }) => {
    if (!user) return;
    await supabase.from('reports').update({
      ...updates,
      ...(updates.status === 'resolved' ? { resolved_by: user.id, resolved_at: new Date().toISOString() } : {}),
    }).eq('id', id);
    await supabase.from('audit_logs').insert({
      action: 'update_report',
      admin_id: user.id,
      target_id: id,
      target_type: 'report',
      details: updates,
    });
    fetchReports();
  }, [user, fetchReports]);

  return {
    reports,
    openReports: reports.filter(r => r.status === 'open'),
    loading,
    updateReport,
    refetch: fetchReports,
  };
}
