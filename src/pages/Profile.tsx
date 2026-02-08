import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/data/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Mail,
  Edit3,
  Save,
  X,
  Camera,
} from 'lucide-react';

export default function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    bio: currentUser?.bio || '',
    university: currentUser?.university || '',
    course: currentUser?.course || '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return; // Max 5MB
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return; // Only images
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleSave = () => {
    const updates: Record<string, string> = { ...form };
    if (avatarPreview) {
      updates.profilePicture = avatarPreview;
    }
    updateProfile(updates);
    setEditing(false);
    setAvatarPreview(null);
  };

  const handleCancel = () => {
    setForm({
      name: currentUser.name,
      bio: currentUser.bio || '',
      university: currentUser.university || '',
      course: currentUser.course || '',
    });
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    setEditing(false);
  };

  const displayAvatar = avatarPreview || currentUser.profilePicture;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card shadow-card overflow-hidden"
      >
        {/* Banner */}
        <div className="h-32 gradient-primary relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-8 h-24 w-24 rounded-full bg-primary-foreground/20 blur-2xl" />
            <div className="absolute bottom-2 left-12 h-16 w-16 rounded-full bg-primary-foreground/15 blur-xl" />
          </div>
        </div>

        {/* Avatar + Info */}
        <div className="relative px-6 pb-6">
          <div className="relative -mt-10 w-fit">
            <Avatar className="h-20 w-20 border-4 border-card">
              {displayAvatar ? (
                <AvatarImage src={displayAvatar} alt={currentUser.name} />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold font-display">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            {editing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card hover:bg-primary/90 transition-colors"
                  title="Change profile picture"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-start justify-between mt-3">
            <div>
              {editing ? (
                <Input
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  className="text-lg font-bold mb-1 h-9"
                />
              ) : (
                <h1 className="text-xl font-bold font-display text-card-foreground">
                  {currentUser.name}
                </h1>
              )}
              <p className="text-sm text-muted-foreground">@{currentUser.username}</p>

              {currentUser.role === 'admin' && (
                <span className="inline-flex items-center mt-2 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                  Platform Admin
                </span>
              )}
            </div>

            {!editing ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setEditing(true)}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" className="gap-1.5" onClick={handleSave}>
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="mt-3">
              <Label className="text-xs font-medium">Bio</Label>
              <Textarea
                value={form.bio}
                onChange={e => update('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                className="mt-1 resize-none"
                rows={2}
              />
            </div>
          ) : (
            currentUser.bio && (
              <p className="mt-3 text-sm text-card-foreground/80 leading-relaxed">
                {currentUser.bio}
              </p>
            )
          )}
        </div>
      </motion.div>

      {/* Details */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl bg-card shadow-card p-6"
      >
        <h2 className="text-sm font-semibold font-display text-card-foreground mb-4">
          Academic Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">University</p>
              {editing ? (
                <Input
                  value={form.university}
                  onChange={e => update('university', e.target.value)}
                  className="mt-0.5 h-8 text-sm"
                />
              ) : (
                <p className="text-sm font-medium text-card-foreground">
                  {currentUser.university || 'Not set'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <BookOpen className="h-4.5 w-4.5 text-accent" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Course</p>
              {editing ? (
                <Input
                  value={form.course}
                  onChange={e => update('course', e.target.value)}
                  className="mt-0.5 h-8 text-sm"
                />
              ) : (
                <p className="text-sm font-medium text-card-foreground">
                  {currentUser.course || 'Not set'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <Calendar className="h-4.5 w-4.5 text-success" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Year</p>
              <p className="text-sm font-medium text-card-foreground">
                {currentUser.yearOfStudy ? `Year ${currentUser.yearOfStudy}` : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Mail className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Email</p>
              <p className="text-sm font-medium text-card-foreground">{currentUser.email}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Member Since */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl bg-card shadow-card p-6"
      >
        <p className="text-xs text-muted-foreground">
          Member since{' '}
          <span className="font-medium text-card-foreground">
            {currentUser.createdAt.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </p>
      </motion.div>
    </div>
  );
}
