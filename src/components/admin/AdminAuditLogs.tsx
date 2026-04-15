import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { AuditLog } from '@/hooks/useAuditLogs';
import type { Profile } from '@/contexts/AuthContext';

interface Props {
  logs: AuditLog[];
  profiles: Profile[];
}

const actionColors: Record<string, string> = {
  suspend_user: 'destructive',
  unsuspend_user: 'default',
  approve_verification: 'default',
  reject_verification: 'destructive',
  unverify_user: 'secondary',
  broadcast_message: 'outline',
  update_report: 'secondary',
};

export default function AdminAuditLogs({ logs, profiles }: Props) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const profileMap = new Map(profiles.map(p => [p.user_id, p]));
  const uniqueActions = [...new Set(logs.map(l => l.action))];

  const filtered = logs.filter(l => {
    const matchesSearch = search === '' ||
      l.action.includes(search.toLowerCase()) ||
      (l.target_id && l.target_id.includes(search));
    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card p-5">
      <h2 className="text-sm font-semibold font-display text-card-foreground mb-4 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-primary" /> Audit Logs ({logs.length})
      </h2>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="pl-9 h-9 text-xs" />
        </div>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground"
        >
          <option value="all">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">No matching audit logs.</p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map(log => {
            const admin = log.admin_id ? profileMap.get(log.admin_id) : null;
            const target = log.target_id ? profileMap.get(log.target_id) : null;
            return (
              <div key={log.id} className="flex gap-3 items-start rounded-lg bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={(actionColors[log.action] as any) || 'outline'} className="text-[10px]">
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                    {admin && <span className="text-[10px] text-muted-foreground">by @{admin.username}</span>}
                    {target && <span className="text-[10px] text-muted-foreground">→ @{target.username}</span>}
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                      {JSON.stringify(log.details).slice(0, 120)}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
