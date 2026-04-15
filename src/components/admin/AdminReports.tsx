import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, AlertTriangle, CheckCircle2, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Report } from '@/hooks/useReports';

interface Props {
  reports: Report[];
  openReports: Report[];
  updateReport: (id: string, updates: { status?: string; admin_notes?: string; priority?: string }) => Promise<void>;
}

export default function AdminReports({ reports, openReports, updateReport }: Props) {
  const [filter, setFilter] = useState<'all' | 'open' | 'investigating' | 'resolved'>('open');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const displayed = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  const statusIcon = (s: string) => {
    switch (s) {
      case 'open': return <Clock className="h-3 w-3 text-warning" />;
      case 'investigating': return <Eye className="h-3 w-3 text-primary" />;
      case 'resolved': return <CheckCircle2 className="h-3 w-3 text-success" />;
      case 'dismissed': return <AlertTriangle className="h-3 w-3 text-muted-foreground" />;
      default: return null;
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="rounded-xl bg-card shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold font-display text-card-foreground flex items-center gap-2">
            <Flag className="h-4 w-4 text-destructive" /> Content Reports
            {openReports.length > 0 && (
              <span className="bg-destructive/10 text-destructive text-[10px] px-2 py-0.5 rounded-full">{openReports.length} open</span>
            )}
          </h2>
          <div className="flex gap-1">
            {(['open', 'investigating', 'resolved', 'all'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded-full transition-colors capitalize ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {displayed.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No {filter} reports.</p>
        ) : (
          <div className="space-y-3">
            {displayed.map(r => (
              <div key={r.id} className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcon(r.status)}
                      <span className="text-xs font-medium text-card-foreground capitalize">{r.reason}</span>
                      <Badge variant={priorityColor(r.priority)} className="text-[10px]">{r.priority}</Badge>
                      <Badge variant="outline" className="text-[10px]">{r.content_type}</Badge>
                    </div>
                    {r.description && <p className="text-xs text-muted-foreground mb-1">{r.description}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      Reported by: @{r.reporter?.username || 'unknown'}
                      {r.reported_user && <> · Against: @{r.reported_user.username}</>}
                      {' · '}{new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {r.status === 'open' || r.status === 'investigating' ? (
                  <div className="flex items-center gap-2 mt-3">
                    {r.status === 'open' && (
                      <Button size="sm" variant="outline" className="text-xs text-primary" onClick={() => updateReport(r.id, { status: 'investigating' })}>
                        Investigate
                      </Button>
                    )}
                    <Input
                      value={notes[r.id] || ''}
                      onChange={e => setNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="Admin notes..."
                      className="h-8 text-xs flex-1"
                    />
                    <Button size="sm" variant="outline" className="text-xs text-success" onClick={() => updateReport(r.id, { status: 'resolved', admin_notes: notes[r.id] || 'Resolved' })}>
                      Resolve
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs text-muted-foreground" onClick={() => updateReport(r.id, { status: 'dismissed', admin_notes: notes[r.id] || 'Dismissed' })}>
                      Dismiss
                    </Button>
                  </div>
                ) : (
                  r.admin_notes && <p className="text-[10px] text-muted-foreground mt-2 italic">Notes: {r.admin_notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
