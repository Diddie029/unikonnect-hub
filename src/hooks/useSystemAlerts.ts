import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: string;
  is_resolved: boolean;
  created_at: string;
}

export function useSystemAlerts() {
  const { user, isAdmin } = useAuth();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return; }
    const { data } = await supabase
      .from('system_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setAlerts((data || []) as SystemAlert[]);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const createAlert = useCallback(async (title: string, message: string, severity: string) => {
    await supabase.from('system_alerts').insert({ title, message, severity });
    fetchAlerts();
  }, [fetchAlerts]);

  const resolveAlert = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('system_alerts').update({
      is_resolved: true,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    }).eq('id', id);
    fetchAlerts();
  }, [user, fetchAlerts]);

  return { alerts, activeAlerts: alerts.filter(a => !a.is_resolved), loading, createAlert, resolveAlert, refetch: fetchAlerts };
}
