import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Send, X, Video, Hash } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/data/mockData';

interface CreatePostDialogProps {
  onPost: (content: string, image?: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export default function CreatePostDialog({ onPost }: CreatePostDialogProps) {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePost = () => {
    if (!content.trim()) return;
    onPost(content.trim(), selectedMedia || undefined);
    setContent('');
    setSelectedMedia(null);
    setError('');
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
    setSelectedMedia(objectUrl);
    setMediaType(isImage ? 'image' : 'video');

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMedia = () => {
    if (selectedMedia) {
      URL.revokeObjectURL(selectedMedia);
    }
    setSelectedMedia(null);
    setError('');
  };

  // Extract hashtags from content
  const hashtags = content.match(/#\w+/g) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card shadow-card p-4"
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 border-2 border-border">
          {currentUser?.profilePicture ? (
            <AvatarImage src={currentUser.profilePicture} alt={currentUser.name} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {currentUser ? getInitials(currentUser.name) : '?'}
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

          {/* Hashtag preview */}
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

          {/* Error message */}
          {error && (
            <p className="text-xs text-destructive mb-2">{error}</p>
          )}

          {/* Media preview */}
          {selectedMedia && (
            <div className="relative mt-2 mb-2">
              {mediaType === 'image' ? (
                <img
                  src={selectedMedia}
                  alt="Preview"
                  className="w-full max-h-48 object-cover rounded-lg"
                />
              ) : (
                <video
                  src={selectedMedia}
                  className="w-full max-h-48 rounded-lg"
                  controls
                  muted
                />
              )}
              <button
                onClick={removeMedia}
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-foreground/60 flex items-center justify-center text-background hover:bg-foreground/80 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Hidden file input */}
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
            </div>
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handlePost}
              disabled={!content.trim()}
            >
              <Send className="h-3.5 w-3.5" />
              Post
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
