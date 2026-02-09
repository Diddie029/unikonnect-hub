import { useState } from 'react';
import { motion } from 'framer-motion';
import { useConfessions } from '@/hooks/useConfessions';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Flame, Send, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ConfessionWall() {
  const { confessions, pendingConfessions, loading, submitConfession, approveConfession, rejectConfession } = useConfessions();
  const { isAdmin } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPending, setShowPending] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    await submitConfession(content.trim());
    setContent('');
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Submit */}
      <div className="rounded-xl bg-card shadow-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold font-display text-card-foreground">Anonymous Confession Wall</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Share anonymously. Your identity is hidden. Confessions appear after admin approval.
        </p>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Share your confession anonymously..."
          className="resize-none mb-2"
          rows={3}
        />
        <Button size="sm" className="gap-1.5" onClick={handleSubmit} disabled={!content.trim() || submitting}>
          <Send className="h-3.5 w-3.5" />
          {submitting ? 'Submitting...' : 'Submit Anonymously'}
        </Button>
      </div>

      {/* Admin: Pending queue */}
      {isAdmin && pendingConfessions.length > 0 && (
        <div className="rounded-xl bg-card shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              ⏳ Pending Approval
              <span className="bg-accent/10 text-accent text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {pendingConfessions.length}
              </span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowPending(!showPending)}>
              {showPending ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {showPending && (
            <div className="space-y-3">
              {pendingConfessions.map(c => (
                <div key={c.id} className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm text-card-foreground mb-2">{c.content}</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-1 text-xs text-success border-success/30" onClick={() => approveConfession(c.id)}>
                      <CheckCircle2 className="h-3 w-3" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive border-destructive/30" onClick={() => rejectConfession(c.id)}>
                      <XCircle className="h-3 w-3" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approved confessions */}
      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-8">Loading confessions...</p>
      ) : confessions.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No confessions yet. Be the first!</p>
      ) : (
        confessions.map((confession, i) => (
          <motion.div
            key={confession.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-card shadow-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔥</span>
              <span className="text-[11px] text-muted-foreground font-medium">
                Anonymous · {formatTimeAgo(confession.created_at)}
              </span>
            </div>
            <p className="text-sm text-card-foreground leading-relaxed">{confession.content}</p>
          </motion.div>
        ))
      )}
    </div>
  );
}
