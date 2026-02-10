import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useFollows } from '@/hooks/useFollows';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import VerificationBadge from '@/components/profile/VerificationBadge';
import VerificationApply from '@/components/profile/VerificationApply';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Mail,
  Edit3,
  Save,
  X,
  Camera,
  UserPlus,
  UserMinus,
  Users,
} from 'lucide-react';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Profile() {
  const { user, profile, profiles, updateProfile, refreshProfile } = useAuth();
  const { followingCount, followersCount, isFollowing, followUser, unfollowUser } = useFollows();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || '',
    bio: profile?.bio || '',
    university: profile?.university || '',
    course: profile?.course || '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!profile || !user) return null;

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File must be under 5MB', variant: 'destructive' });
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: 'Error', description: 'Only JPG, PNG, WebP allowed', variant: 'destructive' });
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarFile(file);
  };

  const handleSave = async () => {
    setSaving(true);
    let avatar_url = profile.avatar_url;

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
        avatar_url = publicUrl;
      }
    }

    await updateProfile({
      name: form.name,
      bio: form.bio,
      university: form.university,
      course: form.course,
      avatar_url,
    } as any);

    await refreshProfile();
    setEditing(false);
    setAvatarPreview(null);
    setAvatarFile(null);
    setSaving(false);
    toast({ title: 'Profile updated!' });
  };

  const handleCancel = () => {
    setForm({
      name: profile.name,
      bio: profile.bio || '',
      university: profile.university || '',
      course: profile.course || '',
    });
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
    setEditing(false);
  };

  const displayAvatar = avatarPreview || profile.avatar_url;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card shadow-card overflow-hidden"
      >
        <div className="h-32 gradient-primary relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-8 h-24 w-24 rounded-full bg-primary-foreground/20 blur-2xl" />
          </div>
        </div>

        <div className="relative px-6 pb-6">
          <div className="relative -mt-10 w-fit">
            <Avatar className="h-20 w-20 border-4 border-card">
              {displayAvatar ? <AvatarImage src={displayAvatar} alt={profile.name} /> : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold font-display">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            {editing && (
              <>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-start justify-between mt-3">
            <div>
              {editing ? (
                <Input value={form.name} onChange={e => update('name', e.target.value)} className="text-lg font-bold mb-1 h-9" />
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold font-display text-card-foreground">{profile.name}</h1>
                  <VerificationBadge isVerified={(profile as any).is_verified} />
                </div>
              )}
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>

            {!editing ? (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
                  <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Follow stats */}
          <div className="flex items-center gap-4 mt-3">
            <button className="text-sm" onClick={() => setShowFollowers(!showFollowers)}>
              <span className="font-semibold text-card-foreground">{followersCount}</span>{' '}
              <span className="text-muted-foreground">followers</span>
            </button>
            <button className="text-sm" onClick={() => setShowFollowing(!showFollowing)}>
              <span className="font-semibold text-card-foreground">{followingCount}</span>{' '}
              <span className="text-muted-foreground">following</span>
            </button>
          </div>

          {editing ? (
            <div className="mt-3">
              <Label className="text-xs font-medium">Bio</Label>
              <Textarea value={form.bio} onChange={e => update('bio', e.target.value)} placeholder="Tell us about yourself..." className="mt-1 resize-none" rows={2} />
            </div>
          ) : (
            profile.bio && <p className="mt-3 text-sm text-card-foreground/80 leading-relaxed">{profile.bio}</p>
          )}
        </div>
      </motion.div>

      {/* Suggested users to follow */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl bg-card shadow-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold font-display text-card-foreground">Students</h2>
        </div>
        <div className="space-y-3">
          {profiles.filter(p => p.user_id !== user.id).map(p => (
            <div key={p.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8">
                  {p.avatar_url ? <AvatarImage src={p.avatar_url} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">{getInitials(p.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-card-foreground">{p.name}</span>
                    <VerificationBadge isVerified={(p as any).is_verified} className="h-3 w-3" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">@{p.username}</p>
                </div>
              </div>
              {isFollowing(p.user_id) ? (
                <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => unfollowUser(p.user_id)}>
                  <UserMinus className="h-3 w-3" /> Unfollow
                </Button>
              ) : (
                <Button size="sm" className="gap-1 text-xs h-7" onClick={() => followUser(p.user_id)}>
                  <UserPlus className="h-3 w-3" /> Follow
                </Button>
              )}
            </div>
          ))}
          {profiles.filter(p => p.user_id !== user.id).length === 0 && (
            <p className="text-xs text-muted-foreground">No other students yet.</p>
          )}
        </div>
      </motion.div>

      {/* Academic Info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl bg-card shadow-card p-6"
      >
        <h2 className="text-sm font-semibold font-display text-card-foreground mb-4">Academic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">University</p>
              {editing ? (
                <Input value={form.university} onChange={e => update('university', e.target.value)} className="mt-0.5 h-8 text-sm" />
              ) : (
                <p className="text-sm font-medium text-card-foreground">{profile.university || 'Not set'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Course</p>
              {editing ? (
                <Input value={form.course} onChange={e => update('course', e.target.value)} className="mt-0.5 h-8 text-sm" />
              ) : (
                <p className="text-sm font-medium text-card-foreground">{profile.course || 'Not set'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Year</p>
              <p className="text-sm font-medium text-card-foreground">{profile.year_of_study ? `Year ${profile.year_of_study}` : 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Email</p>
              <p className="text-sm font-medium text-card-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Verification */}
      <VerificationApply />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl bg-card shadow-card p-6"
      >
        <p className="text-xs text-muted-foreground">
          Member since{' '}
          <span className="font-medium text-card-foreground">
            {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </p>
      </motion.div>
    </div>
  );
}
