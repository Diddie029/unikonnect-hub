import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/data/mockData';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileText,
  Activity,
  Shield,
  Ban,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ACTIVITY_DATA = [
  { day: 'Mon', posts: 24, comments: 45 },
  { day: 'Tue', posts: 31, comments: 52 },
  { day: 'Wed', posts: 18, comments: 39 },
  { day: 'Thu', posts: 42, comments: 67 },
  { day: 'Fri', posts: 37, comments: 58 },
  { day: 'Sat', posts: 15, comments: 28 },
  { day: 'Sun', posts: 12, comments: 22 },
];

const ADMIN_LOGS = [
  { action: 'User report reviewed', target: 'Post #4521', time: '2 hours ago' },
  { action: 'Content moderated', target: 'Discussion: CS101', time: '5 hours ago' },
  { action: 'New user approved', target: '@jane_phys', time: '1 day ago' },
  { action: 'Post removed', target: 'Spam content', time: '2 days ago' },
];

export default function AdminDashboard() {
  const { users, isAdmin, suspendUser, unsuspendUser } = useAuth();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold font-display text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-1">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }

  const studentUsers = users.filter(u => u.role === 'student');
  const onlineUsers = users.filter(u => u.isOnline).length;
  const suspendedUsers = users.filter(u => u.isSuspended).length;

  const stats = [
    { label: 'Total Users', value: studentUsers.length, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Online Now', value: onlineUsers, icon: Activity, color: 'bg-success/10 text-success' },
    { label: 'Posts Today', value: 37, icon: FileText, color: 'bg-accent/10 text-accent' },
    { label: 'Suspended', value: suspendedUsers, icon: Ban, color: 'bg-destructive/10 text-destructive' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor and manage the UniConnect platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-card shadow-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-4.5 w-4.5" />
              </div>
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            </div>
            <p className="text-2xl font-bold font-display text-card-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-xl bg-card shadow-card p-5"
        >
          <h2 className="text-sm font-semibold font-display text-card-foreground mb-4">
            Weekly Activity
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ACTIVITY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 90%)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(225 10% 48%)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(225 10% 48%)' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(0 0% 100%)',
                  border: '1px solid hsl(225 15% 90%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="posts" fill="hsl(235 72% 55%)" radius={[4, 4, 0, 0]} name="Posts" />
              <Bar dataKey="comments" fill="hsl(25 95% 53%)" radius={[4, 4, 0, 0]} name="Comments" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Admin Logs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl bg-card shadow-card p-5"
        >
          <h2 className="text-sm font-semibold font-display text-card-foreground mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {ADMIN_LOGS.map((log, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="text-xs font-medium text-card-foreground">{log.action}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {log.target} · {log.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* User Management */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl bg-card shadow-card overflow-hidden"
      >
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-semibold font-display text-card-foreground">
            User Management
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage student accounts and moderation
          </p>
        </div>

        <div className="divide-y divide-border">
          {studentUsers.map(user => (
            <div
              key={user.id}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                      user.isOnline ? 'bg-online' : 'bg-muted-foreground/30'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-card-foreground">{user.name}</span>
                    {user.isSuspended && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        Suspended
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    @{user.username} · {user.university} · {user.course}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user.isSuspended ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs text-success border-success/30 hover:bg-success/10"
                    onClick={() => unsuspendUser(user.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Reinstate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => suspendUser(user.id)}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Suspend
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}