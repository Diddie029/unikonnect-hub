import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, X, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useStories, type StoryWithDetails } from '@/hooks/useStories';
import { BadgeCheck } from 'lucide-react';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatTimeAgo(dateStr: string): string {
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}

export default function StoriesBar() {
  const { user, profile } = useAuth();
  const { storiesByUser, createStory, likeStory, deleteStory } = useStories();
  const [viewingStories, setViewingStories] = useState<StoryWithDetails[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const userGroups = Object.entries(storiesByUser);
  const currentStory = viewingStories?.[currentIndex];

  const handleCreateStory = async () => {
    if (!storyText.trim() && !storyFile) return;
    setPosting(true);
    await createStory(storyText.trim() || null, storyFile);
    setStoryText('');
    setStoryFile(null);
    if (storyPreview) URL.revokeObjectURL(storyPreview);
    setStoryPreview(null);
    setCreating(false);
    setPosting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 10 * 1024 * 1024) return;
    setStoryFile(file);
    setStoryPreview(URL.createObjectURL(file));
  };

  const nextStory = () => {
    if (viewingStories && currentIndex < viewingStories.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setViewingStories(null);
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* Create story */}
        <button onClick={() => setCreating(true)} className="shrink-0 flex flex-col items-center gap-1">
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-dashed border-primary/40">
              {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{profile ? getInitials(profile.name) : '+'}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card">
              <Plus className="h-3 w-3" />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Your story</span>
        </button>

        {/* Other users' stories */}
        {userGroups.map(([userId, userStories]) => {
          const p = userStories[0].profile;
          if (!p) return null;
          return (
            <button
              key={userId}
              onClick={() => { setViewingStories(userStories); setCurrentIndex(0); }}
              className="shrink-0 flex flex-col items-center gap-1"
            >
              <Avatar className="h-14 w-14 border-2 border-primary ring-2 ring-primary/30">
                {p.avatar_url ? <AvatarImage src={p.avatar_url} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(p.name)}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[60px]">
                {userId === user?.id ? 'You' : p.name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Create Story Modal */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl bg-card shadow-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold font-display text-card-foreground">Create Story</h3>
                <button onClick={() => { setCreating(false); setStoryText(''); setStoryFile(null); if (storyPreview) URL.revokeObjectURL(storyPreview); setStoryPreview(null); }}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <textarea
                value={storyText}
                onChange={e => setStoryText(e.target.value)}
                placeholder="What's happening right now?"
                className="w-full resize-none bg-muted/50 rounded-lg p-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 min-h-[80px]"
                rows={3}
              />

              {storyPreview && (
                <div className="relative mt-3">
                  <img src={storyPreview} alt="Story preview" className="w-full rounded-lg max-h-48 object-cover" />
                  <button onClick={() => { setStoryFile(null); if (storyPreview) URL.revokeObjectURL(storyPreview); setStoryPreview(null); }} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-foreground/60 text-background flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />

              <div className="flex items-center justify-between mt-3">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" /> Add Media
                </Button>
                <Button size="sm" className="gap-1.5 text-xs" onClick={handleCreateStory} disabled={(!storyText.trim() && !storyFile) || posting}>
                  {posting ? 'Posting...' : 'Share Story'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Story Modal */}
      <AnimatePresence>
        {viewingStories && currentStory && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/98 flex items-center justify-center"
            onClick={() => setViewingStories(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative w-full max-w-sm h-[80vh] rounded-2xl bg-card shadow-card overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Progress bars */}
              <div className="flex gap-1 p-2">
                {viewingStories.map((_, i) => (
                  <div key={i} className={`flex-1 h-0.5 rounded-full ${i <= currentIndex ? 'bg-primary' : 'bg-muted'}`} />
                ))}
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {currentStory.profile?.avatar_url ? <AvatarImage src={currentStory.profile.avatar_url} /> : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                      {currentStory.profile ? getInitials(currentStory.profile.name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-card-foreground">{currentStory.profile?.name}</span>
                      {currentStory.profile?.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary fill-primary/20" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{formatTimeAgo(currentStory.created_at)} ago</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentStory.user_id === user?.id && (
                    <button onClick={() => { deleteStory(currentStory.id); nextStory(); }} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => setViewingStories(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex items-center justify-center p-4">
                {currentStory.media_url ? (
                  currentStory.media_type === 'video' ? (
                    <video src={currentStory.media_url} className="max-w-full max-h-full rounded-lg" autoPlay muted controls />
                  ) : (
                    <img src={currentStory.media_url} alt="Story" className="max-w-full max-h-full rounded-lg object-contain" />
                  )
                ) : null}
                {currentStory.content && (
                  <div className={`${currentStory.media_url ? 'absolute bottom-20 left-4 right-4' : ''} text-center`}>
                    <p className={`text-sm ${currentStory.media_url ? 'bg-foreground/60 text-background rounded-lg px-3 py-2' : 'text-xl font-semibold text-card-foreground'}`}>
                      {currentStory.content}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <button onClick={prevStory} disabled={currentIndex === 0} className="text-muted-foreground disabled:opacity-30">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1.5 text-xs ${currentStory.is_liked ? 'text-accent' : 'text-muted-foreground'}`}
                  onClick={() => likeStory(currentStory.id)}
                >
                  <Heart className={`h-4 w-4 ${currentStory.is_liked ? 'fill-accent' : ''}`} />
                  {currentStory.likes_count > 0 && currentStory.likes_count}
                </Button>
                <button onClick={nextStory} className="text-muted-foreground">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
