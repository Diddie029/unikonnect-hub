import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Bell, Plus, CheckCircle2, Eye, Lock, Globe, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { SystemAlert } from '@/hooks/useSystemAlerts';
import type { Profile } from '@/contexts/AuthContext';

interface Props {
  alerts: SystemAlert[];
  activeAlerts: SystemAlert[];
  createAlert: (title: string, message: string, severity: string) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  profiles: Profile[];
  recentLogins: { user: string; time: string; suspicious: boolean }[];
}

export default function AdminSecurity({ alerts, activeAlerts, createAlert, resolveAlert, profiles, recentLogins }: Props) {
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newSeverity, setNewSeverity] = useState('info');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newMessage.trim()) return;
    setCreating(true);
    await createAlert(newTitle, newMessage, newSeverity);
    setNewTitle('');
    setNewMessage('');
    setNewSeverity('info');
    setCreating(false);
  };

  // Detect suspicious patterns
  const suspiciousAccounts = profiles.filter(p => {
    const created = new Date(p.created_at);
    const hourAgo = new Date(Date.now() - 3600000);
    return created > hourAgo && !p.university;
  });

  const severityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Active Alerts */}
      <div className="rounded-xl bg-card shadow-card p-5">
        <h2 className="text-sm font-semibold font-display text-card-foreground mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" /> Active Alerts ({activeAlerts.length})
        </h2>
        {activeAlerts.length === 0 ? (
          <div className="flex items-center gap-2 text-success text-xs">
            <CheckCircle2 className="h-4 w-4" /> No active alerts. System is healthy.
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map(a => (
              <div key={a.id} className="rounded-lg bg-muted/50 p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={severityColor(a.severity)} className="text-[10px]">{a.severity}</Badge>
                    <span className="text-sm font-medium text-card-foreground">{a.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                <Button size="sm" variant="outline" className="text-xs text-success shrink-0" onClick={() => resolveAlert(a.id)}>
                  Resolve
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Threat Detection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-card shadow-card p-5">
          <h3 className="text-sm font-semibold font-display text-card-foreground mb-3 flex items-center gap-2">
            <UserX className="h-4 w-4 text-destructive" /> Suspicious Accounts
          </h3>
          {suspiciousAccounts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No suspicious accounts detected.</p>
          ) : (
            <div className="space-y-2">
              {suspiciousAccounts.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
                  <div>
                    <p className="text-xs font-medium text-card-foreground">@{p.username}</p>
                    <p className="text-[10px] text-muted-foreground">No university — created {new Date(p.created_at).toLocaleString()}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Review</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-card shadow-card p-5">
          <h3 className="text-sm font-semibold font-display text-card-foreground mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Security Controls
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="text-xs font-medium text-card-foreground">Row Level Security</p>
                <p className="text-[10px] text-muted-foreground">All tables protected</p>
              </div>
              <Badge className="text-[10px] bg-success/10 text-success border-0">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="text-xs font-medium text-card-foreground">Email Verification</p>
                <p className="text-[10px] text-muted-foreground">Users must verify email</p>
              </div>
              <Badge className="text-[10px] bg-success/10 text-success border-0">Required</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="text-xs font-medium text-card-foreground">JWT Authentication</p>
                <p className="text-[10px] text-muted-foreground">Token-based session management</p>
              </div>
              <Badge className="text-[10px] bg-success/10 text-success border-0">Active</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="text-xs font-medium text-card-foreground">RBAC System</p>
                <p className="text-[10px] text-muted-foreground">Admin / Moderator / Student</p>
              </div>
              <Badge className="text-[10px] bg-success/10 text-success border-0">Configured</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Create Alert */}
      <div className="rounded-xl bg-card shadow-card p-5">
        <h3 className="text-sm font-semibold font-display text-card-foreground mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create System Alert
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Alert title..." className="h-9 text-xs" />
          <select
            value={newSeverity}
            onChange={e => setNewSeverity(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground"
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <Button onClick={handleCreate} disabled={creating || !newTitle.trim() || !newMessage.trim()} className="h-9 text-xs">
            Create Alert
          </Button>
        </div>
        <Textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Alert message..." className="resize-none text-xs" rows={2} />
      </div>

      {/* Alert History */}
      <div className="rounded-xl bg-card shadow-card p-5">
        <h3 className="text-sm font-semibold font-display text-card-foreground mb-3">Alert History</h3>
        {alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No alerts recorded.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.map(a => (
              <div key={a.id} className="flex items-center gap-3 text-xs">
                <div className={`h-2 w-2 rounded-full shrink-0 ${a.is_resolved ? 'bg-muted-foreground/30' : a.severity === 'critical' ? 'bg-destructive' : a.severity === 'warning' ? 'bg-warning' : 'bg-primary'}`} />
                <span className={`font-medium ${a.is_resolved ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>{a.title}</span>
                <Badge variant={severityColor(a.severity)} className="text-[10px]">{a.severity}</Badge>
                {a.is_resolved && <Badge variant="outline" className="text-[10px] text-success">Resolved</Badge>}
                <span className="text-muted-foreground ml-auto text-[10px]">{new Date(a.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
