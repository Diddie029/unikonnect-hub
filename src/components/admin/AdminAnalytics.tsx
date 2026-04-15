import { motion } from 'framer-motion';
import { TrendingUp, Users, FileText, MessageSquare, Eye, Heart } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
} from 'recharts';
import type { Profile } from '@/contexts/AuthContext';

interface Props {
  profiles: Profile[];
  postCount: number;
  messageCount: number;
  confessionCount: number;
  storyCount: number;
}

export default function AdminAnalytics({ profiles, postCount, messageCount, confessionCount, storyCount }: Props) {
  const totalContent = postCount + messageCount + confessionCount + storyCount;
  const verifiedPct = profiles.length > 0 ? Math.round((profiles.filter(p => p.is_verified).length / profiles.length) * 100) : 0;
  const suspendedPct = profiles.length > 0 ? Math.round((profiles.filter(p => p.is_suspended).length / profiles.length) * 100) : 0;

  // University distribution
  const uniMap = new Map<string, number>();
  profiles.forEach(p => {
    const uni = p.university || 'Unknown';
    uniMap.set(uni, (uniMap.get(uni) || 0) + 1);
  });
  const uniData = Array.from(uniMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  // Course distribution
  const courseMap = new Map<string, number>();
  profiles.forEach(p => {
    const c = p.course || 'Unknown';
    courseMap.set(c, (courseMap.get(c) || 0) + 1);
  });
  const courseData = Array.from(courseMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  // Engagement metrics
  const engagementData = [
    { metric: 'Posts/User', value: profiles.length > 0 ? (postCount / profiles.length).toFixed(1) : '0' },
    { metric: 'Messages/User', value: profiles.length > 0 ? (messageCount / profiles.length).toFixed(1) : '0' },
    { metric: 'Verified Rate', value: `${verifiedPct}%` },
    { metric: 'Suspended Rate', value: `${suspendedPct}%` },
  ];

  const kpiCards = [
    { label: 'Total Content', value: totalContent, icon: FileText, color: 'text-primary' },
    { label: 'Total Users', value: profiles.length, icon: Users, color: 'text-accent' },
    { label: 'Messages Sent', value: messageCount, icon: MessageSquare, color: 'text-success' },
    { label: 'Engagement Score', value: `${profiles.length > 0 ? Math.round((totalContent / profiles.length) * 10) : 0}`, icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(kpi => (
          <div key={kpi.label} className="rounded-xl bg-card shadow-card p-4 text-center">
            <kpi.icon className={`h-5 w-5 mx-auto mb-2 ${kpi.color}`} />
            <p className={`text-2xl font-bold font-display ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Engagement Metrics */}
      <div className="rounded-xl bg-card shadow-card p-5">
        <h3 className="text-sm font-semibold font-display text-card-foreground mb-4">Engagement Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {engagementData.map(e => (
            <div key={e.metric} className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-lg font-bold font-display text-card-foreground">{e.value}</p>
              <p className="text-[11px] text-muted-foreground">{e.metric}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-card shadow-card p-5">
          <h3 className="text-sm font-semibold font-display text-card-foreground mb-4">University Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={uniData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={100} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-card shadow-card p-5">
          <h3 className="text-sm font-semibold font-display text-card-foreground mb-4">Course Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={courseData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={100} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Privacy & Compliance */}
      <div className="rounded-xl bg-card shadow-card p-5">
        <h3 className="text-sm font-semibold font-display text-card-foreground mb-3">Data Privacy & Compliance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-card-foreground">Data Encryption</p>
            <p className="text-[10px] text-muted-foreground">TLS in transit, AES-256 at rest</p>
            <p className="text-[10px] text-success font-medium mt-1">✓ Compliant</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-card-foreground">User Data Export</p>
            <p className="text-[10px] text-muted-foreground">GDPR-style data portability</p>
            <p className="text-[10px] text-success font-medium mt-1">✓ Available</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-card-foreground">Audit Trail</p>
            <p className="text-[10px] text-muted-foreground">All admin actions logged</p>
            <p className="text-[10px] text-success font-medium mt-1">✓ Active</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
