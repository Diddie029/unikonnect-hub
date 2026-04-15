import { motion } from 'framer-motion';
import { Server, Database, Wifi, Shield, AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from 'recharts';

interface Props {
  contentData: { name: string; count: number }[];
  userStatusData: { name: string; value: number }[];
  activeAlertCount: number;
  openReportCount: number;
  totalUsers: number;
  onlineCount: number;
  growthData: { name: string; users: number; posts: number }[];
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--accent))', 'hsl(var(--success))'];

export default function AdminOverview({
  contentData, userStatusData, activeAlertCount, openReportCount, totalUsers, onlineCount, growthData,
}: Props) {
  const healthItems = [
    { label: 'Server Status', status: 'Operational', icon: Server, ok: true },
    { label: 'Database', status: 'Connected', icon: Database, ok: true },
    { label: 'Realtime', status: 'Active', icon: Wifi, ok: true },
    { label: 'Security', status: activeAlertCount > 0 ? `${activeAlertCount} alerts` : 'No threats', icon: Shield, ok: activeAlertCount === 0 },
  ];

  const quickStats = [
    { label: 'Active Alerts', value: activeAlertCount, color: activeAlertCount > 0 ? 'text-destructive' : 'text-success' },
    { label: 'Open Reports', value: openReportCount, color: openReportCount > 0 ? 'text-warning' : 'text-success' },
    { label: 'Uptime', value: '99.9%', color: 'text-success' },
    { label: 'Avg Response', value: '45ms', color: 'text-primary' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* System Health Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {healthItems.map(item => (
          <div key={item.label} className="rounded-xl bg-card shadow-card p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.ok ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <item.icon className={`h-5 w-5 ${item.ok ? 'text-success' : 'text-destructive'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-sm font-semibold ${item.ok ? 'text-success' : 'text-destructive'}`}>{item.status}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map(s => (
          <div key={s.label} className="rounded-xl bg-card shadow-card p-4 text-center">
            <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-card shadow-card p-5">
          <h3 className="text-sm font-semibold font-display text-card-foreground mb-4">Content Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={contentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-card shadow-card p-5">
          <h3 className="text-sm font-semibold font-display text-card-foreground mb-4">User Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={userStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}>
                {userStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Growth Trends */}
      <div className="rounded-xl bg-card shadow-card p-5">
        <h3 className="text-sm font-semibold font-display text-card-foreground mb-4">Platform Growth Trends</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
            <Area type="monotone" dataKey="posts" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
