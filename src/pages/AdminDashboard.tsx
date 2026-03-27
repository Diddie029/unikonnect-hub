import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useConfessions } from '@/hooks/useConfessions';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useVerification } from '@/hooks/useVerification';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import VerificationBadge from '@/components/profile/VerificationBadge';
import {
  Users,
  FileText,
  Activity,
  Shield,
  Ban,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Bot,
  Flame,
  Megaphone,
  ClipboardList,
  BadgeCheck,
  Search,
  ShieldX,
  Database,
  Wifi,
  Server,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AdminDashboard() {
  const { profiles, isAdmin, isAIEnabled, toggleAI, suspendUser, unsuspendUser, user } = useAuth();
  const { pendingConfessions, approveConfession, rejectConfession } = useConfessions();
  const { logs } = useAuditLogs();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'moderation' | 'verification' | 'logs' | 'broadcast'>('overview');
  const { pendingRequests, allRequests, approveVerification, rejectVerification, unverifyUser } = useVerification();
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [userSearch, setUserSearch] = useState('');
  const [verificationTab, setVerificationTab] = useState<'pending' | 'all'>('pending');

  // Stats for graphs
  const [messageCount, setMessageCount] = useState(0);
  const [confessionCount, setConfessionCount] = useState(0);
  const [storyCount, setStoryCount] = useState(0);

  useEffect(() => {
    Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
      supabase.from('confessions').select('id', { count: 'exact', head: true }),
      supabase.from('stories').select('id', { count: 'exact', head: true }),
    ]).then(([posts, msgs, confs, stories]) => {
      setPostCount(posts.count || 0);
      setMessageCount(msgs.count || 0);
      setConfessionCount(confs.count || 0);
      setStoryCount(stories.count || 0);
    });
  }, []);

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

  const studentProfiles = profiles.filter(p => p.user_id !== user?.id);
  const onlineCount = profiles.filter(p => p.is_online).length;
  const suspendedCount = profiles.filter(p => p.is_suspended).length;
  const verifiedCount = profiles.filter(p => p.is_verified).length;

  const filteredStudents = studentProfiles.filter(p =>
    p.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    (p.course || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (p.university || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const stats = [
    { label: 'Total Users', value: studentProfiles.length, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Online Now', value: onlineCount, icon: Activity, color: 'bg-success/10 text-success' },
    { label: 'Total Posts', value: postCount, icon: FileText, color: 'bg-accent/10 text-accent' },
    { label: 'Suspended', value: suspendedCount, icon: Ban, color: 'bg-destructive/10 text-destructive' },
  ];

  // Chart data
  const contentData = [
    { name: 'Posts', count: postCount },
    { name: 'Messages', count: messageCount },
    { name: 'Confessions', count: confessionCount },
    { name: 'Stories', count: storyCount },
  ];

  const userStatusData = [
    { name: 'Active', value: studentProfiles.length - suspendedCount },
    { name: 'Suspended', value: suspendedCount },
    { name: 'Verified', value: verifiedCount },
  ];

  const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--accent))'];

  const tabs: { id: typeof activeTab; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'moderation', label: 'Moderation', icon: Flame, badge: pendingConfessions.length },
    { id: 'verification', label: 'Verification', icon: BadgeCheck, badge: pendingRequests.length },
    { id: 'logs', label: 'Audit Logs', icon: ClipboardList },
    { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
  ];

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || !user) return;
    setBroadcasting(true);
    const notifications = profiles.map(p => ({
      user_id: p.user_id,
      title: 'Admin Broadcast',
      message: broadcastMessage.trim(),
      type: 'broadcast',
    }));
    await supabase.from('notifications').insert(notifications);
    await supabase.from('audit_logs').insert({
      action: 'broadcast_message',
      admin_id: user.id,
      details: { message: broadcastMessage.trim(), recipients: profiles.length },
    });
    setBroadcastMessage('');
    setBroadcasting(false);
  };

  const displayedRequests = verificationTab === 'pending' ? pendingRequests : allRequests;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor and manage UniConnect</p>
      </div>

      {/* AI Control */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card shadow-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold font-display text-card-foreground">UniBot AI</h3>
              <p className="text-xs text-muted-foreground">
                {isAIEnabled ? 'Active for all users' : 'Disabled for students'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="ai-toggle" className="text-xs text-muted-foreground">{isAIEnabled ? 'Enabled' : 'Disabled'}</Label>
            <Switch id="ai-toggle" checked={isAIEnabled} onCheckedChange={toggleAI} />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl bg-card shadow-card p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color} mb-2`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold font-display text-card-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.badge ? (
              <span className="bg-accent text-accent-foreground text-[10px] px-1.5 rounded-full">{tab.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* System Health */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-card shadow-card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Server className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Server Status</p>
                <p className="text-sm font-semibold text-success">Operational</p>
              </div>
            </div>
            <div className="rounded-xl bg-card shadow-card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Database className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Database</p>
                <p className="text-sm font-semibold text-success">Connected</p>
              </div>
            </div>
            <div className="rounded-xl bg-card shadow-card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Wifi className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Realtime</p>
                <p className="text-sm font-semibold text-success">Active</p>
              </div>
            </div>
          </div>

          {/* Content Distribution Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-card shadow-card p-5">
              <h3 className="text-sm font-semibold font-display text-card-foreground mb-4">Content Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={contentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl bg-card shadow-card p-5">
              <h3 className="text-sm font-semibold font-display text-card-foreground mb-4">User Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={userStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {userStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card overflow-hidden">
          <div className="p-5 border-b border-border space-y-3">
            <h2 className="text-sm font-semibold font-display text-card-foreground">User Management</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search by name, username, course, university..."
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>
          <div className="divide-y divide-border">
            {filteredStudents.map(profile => (
              <div key={profile.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      {profile.avatar_url ? <AvatarImage src={profile.avatar_url} /> : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{getInitials(profile.name)}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${profile.is_online ? 'bg-online' : 'bg-muted-foreground/30'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-card-foreground">{profile.name}</span>
                      <VerificationBadge isVerified={profile.is_verified} />
                      {profile.is_suspended && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Suspended</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground">@{profile.username} · {profile.university} · {profile.course}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {profile.is_verified && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs text-orange-600 border-orange-300 hover:bg-orange-50" onClick={() => unverifyUser(profile.user_id)}>
                      <ShieldX className="h-3.5 w-3.5" /> Unverify
                    </Button>
                  )}
                  {profile.is_suspended ? (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs text-success border-success/30 hover:bg-success/10" onClick={() => unsuspendUser(profile.user_id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Reinstate
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => suspendUser(profile.user_id)}>
                      <Ban className="h-3.5 w-3.5" /> Suspend
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredStudents.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                {userSearch ? 'No users matching your search' : 'No users yet'}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'moderation' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="rounded-xl bg-card shadow-card p-5">
            <h2 className="text-sm font-semibold font-display text-card-foreground mb-3">
              Confession Moderation Queue
              {pendingConfessions.length > 0 && (
                <span className="ml-2 bg-accent/10 text-accent text-[10px] font-semibold px-2 py-0.5 rounded-full">{pendingConfessions.length} pending</span>
              )}
            </h2>
            {pendingConfessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No pending confessions to review.</p>
            ) : (
              <div className="space-y-3">
                {pendingConfessions.map(c => (
                  <div key={c.id} className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm text-card-foreground mb-2">{c.content}</p>
                    <p className="text-[10px] text-muted-foreground mb-2">Submitted {new Date(c.created_at).toLocaleString()}</p>
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
        </motion.div>
      )}

      {activeTab === 'verification' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="rounded-xl bg-card shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold font-display text-card-foreground flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-primary" /> Verification Requests
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setVerificationTab('pending')}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${verificationTab === 'pending' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  Pending ({pendingRequests.length})
                </button>
                <button
                  onClick={() => setVerificationTab('all')}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${verificationTab === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  All ({allRequests.length})
                </button>
              </div>
            </div>
            {displayedRequests.length === 0 ? (
              <p className="text-xs text-muted-foreground">No {verificationTab} verification requests.</p>
            ) : (
              <div className="space-y-4">
                {displayedRequests.map(req => (
                  <div key={req.id} className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-9 w-9">
                        {req.profile?.avatar_url ? <AvatarImage src={req.profile.avatar_url} /> : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">{req.profile ? getInitials(req.profile.name) : '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-card-foreground">{req.profile?.name || 'Unknown'}</span>
                        <p className="text-[11px] text-muted-foreground">@{req.profile?.username || '?'} · KSH {req.amount_kshs.toLocaleString()}</p>
                      </div>
                      <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {req.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-card-foreground mb-1"><span className="font-medium">Reason:</span> {req.reason}</p>
                    <p className="text-[10px] text-muted-foreground mb-3">Payment ref: {req.payment_reference || 'N/A'} · {new Date(req.created_at).toLocaleString()}</p>
                    {req.admin_notes && (
                      <p className="text-[10px] text-muted-foreground mb-2 italic">Admin notes: {req.admin_notes}</p>
                    )}
                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="gap-1 text-xs text-success border-success/30" onClick={() => approveVerification(req.id, req.user_id)}>
                          <CheckCircle2 className="h-3 w-3" /> Approve
                        </Button>
                        <Input
                          value={rejectNotes[req.id] || ''}
                          onChange={e => setRejectNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                          placeholder="Rejection reason..."
                          className="h-8 text-xs flex-1"
                        />
                        <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive border-destructive/30" onClick={() => rejectVerification(req.id, req.user_id, rejectNotes[req.id] || 'Not approved')}>
                          <XCircle className="h-3 w-3" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'logs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card p-5">
          <h2 className="text-sm font-semibold font-display text-card-foreground mb-4">Audit Logs</h2>
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No audit logs yet. Actions will appear here.</p>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="flex gap-3 items-start">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-card-foreground">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {log.target_type && `${log.target_type} · `}
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'broadcast' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card p-5">
          <h2 className="text-sm font-semibold font-display text-card-foreground mb-3 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-accent" /> Broadcast Message
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Send a notification to all {profiles.length} users on the platform.
          </p>
          <Textarea
            value={broadcastMessage}
            onChange={e => setBroadcastMessage(e.target.value)}
            placeholder="Type your broadcast message..."
            className="resize-none mb-3"
            rows={3}
          />
          <Button onClick={handleBroadcast} disabled={!broadcastMessage.trim() || broadcasting} className="gap-1.5">
            <Megaphone className="h-3.5 w-3.5" />
            {broadcasting ? 'Sending...' : 'Send Broadcast'}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
