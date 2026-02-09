import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Send, X, Video, Hash, Globe, Lock, Users as UsersIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

interface CreatePostDialogProps {
  onPost: (content: string, hashtags: string[], visibility: string, mediaFiles: File[]) => Promise<void>;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function CreatePostDialog({ onPost }: CreatePostDialogProps) {
  const { profile } = useAuth();
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [visibility, setVisibility] = useState('public');
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    const hashtags = (content.match(/#(\w+)/g) || []).map(t => t.slice(1));
    await onPost(content.trim(), hashtags, visibility, selectedFiles);
    setContent('');
    setSelectedFiles([]);
    previews.forEach(p => URL.revokeObjectURL(p.url));
    setPreviews([]);
    setError('');
    setPosting(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB');
      return;
    }

    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      setError('Only JPG, PNG, GIF, WebP images and MP4, WebM videos are allowed');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFiles(prev => [...prev, file]);
    setPreviews(prev => [...prev, { url: objectUrl, type: isImage ? 'image' : 'video' }]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const hashtags = content.match(/#\w+/g) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card shadow-card p-4"
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 border-2 border-border">
          {profile?.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt={profile.name} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {profile ? getInitials(profile.name) : '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind? Share with your campus... Use #hashtags!"
            className="w-full resize-none bg-transparent text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none min-h-[60px]"
            rows={2}
          />

          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {hashtags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                >
                  <Hash className="h-2.5 w-2.5" />
                  {tag.slice(1)}
                </span>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-destructive mb-2">{error}</p>}

          {previews.length > 0 && (
            <div className="flex gap-2 mt-2 mb-2 overflow-x-auto">
              {previews.map((preview, i) => (
                <div key={i} className="relative shrink-0">
                  {preview.type === 'image' ? (
                    <img src={preview.url} alt="Preview" className="h-32 w-auto rounded-lg object-cover" />
                  ) : (
                    <video src={preview.url} className="h-32 w-auto rounded-lg" controls muted />
                  )}
                  <button
                    onClick={() => removeMedia(i)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-foreground/60 flex items-center justify-center text-background hover:bg-foreground/80 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:text-primary"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = ACCEPTED_IMAGE_TYPES.join(',');
                    fileInputRef.current.click();
                  }
                }}
              >
                <ImagePlus className="h-4 w-4" />
                Photo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:text-primary"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = ACCEPTED_VIDEO_TYPES.join(',');
                    fileInputRef.current.click();
                  }
                }}
              >
                <Video className="h-4 w-4" />
                Video
              </Button>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="h-7 w-auto gap-1 text-xs border-none shadow-none px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public"><span className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> Public</span></SelectItem>
                  <SelectItem value="course_only"><span className="flex items-center gap-1.5"><UsersIcon className="h-3 w-3" /> Course Only</span></SelectItem>
                  <SelectItem value="friends"><span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> Friends</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handlePost}
              disabled={!content.trim() || posting}
            >
              <Send className="h-3.5 w-3.5" />
              {posting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
