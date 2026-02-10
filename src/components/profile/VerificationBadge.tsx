import { BadgeCheck } from 'lucide-react';

interface VerificationBadgeProps {
  isVerified?: boolean;
  className?: string;
}

export default function VerificationBadge({ isVerified, className = '' }: VerificationBadgeProps) {
  if (!isVerified) return null;
  return (
    <BadgeCheck className={`h-4 w-4 text-primary fill-primary/20 ${className}`} />
  );
}
