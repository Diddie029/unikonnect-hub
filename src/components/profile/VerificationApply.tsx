import { useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useVerification } from '@/hooks/useVerification';

export default function VerificationApply() {
  const { myRequest, applyForVerification } = useVerification();
  const [reason, setReason] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (myRequest) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card shadow-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <BadgeCheck className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold font-display text-card-foreground">Verification Status</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={myRequest.status === 'approved' ? 'default' : myRequest.status === 'rejected' ? 'destructive' : 'secondary'}>
            {myRequest.status === 'approved' ? '✅ Verified' : myRequest.status === 'rejected' ? '❌ Rejected' : '⏳ Pending Review'}
          </Badge>
        </div>
        {myRequest.status === 'rejected' && myRequest.admin_notes && (
          <p className="text-xs text-muted-foreground mt-2">Admin note: {myRequest.admin_notes}</p>
        )}
        {myRequest.status === 'pending' && (
          <p className="text-xs text-muted-foreground mt-2">Your application is being reviewed by the admin team.</p>
        )}
      </motion.div>
    );
  }

  const handleSubmit = async () => {
    if (!reason.trim() || !paymentRef.trim()) return;
    setSubmitting(true);
    await applyForVerification(reason.trim(), paymentRef.trim());
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card shadow-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <BadgeCheck className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold font-display text-card-foreground">Get Verified</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Apply for a verified badge. Fee: <span className="font-semibold text-card-foreground">KSH 7,500</span>. Pay via M-Pesa and provide the reference.
      </p>

      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium">Why should you be verified?</Label>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Describe your campus influence, achievements, or role..."
            className="mt-1 resize-none text-sm"
            rows={3}
          />
        </div>
        <div>
          <Label className="text-xs font-medium">M-Pesa Payment Reference</Label>
          <Input
            value={paymentRef}
            onChange={e => setPaymentRef(e.target.value)}
            placeholder="e.g. RJ12ABC456"
            className="mt-1"
          />
        </div>
        <Button className="w-full gap-1.5" onClick={handleSubmit} disabled={!reason.trim() || !paymentRef.trim() || submitting}>
          <Send className="h-3.5 w-3.5" />
          {submitting ? 'Submitting...' : 'Submit Application (KSH 7,500)'}
        </Button>
      </div>
    </motion.div>
  );
}
