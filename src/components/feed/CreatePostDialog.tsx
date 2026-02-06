import { useState } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Send, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/data/mockData';

interface CreatePostDialogProps {
  onPost: (content: string, image?: string) => void;
}

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop',
];

export default function CreatePostDialog({ onPost }: CreatePostDialogProps) {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handlePost = () => {
    if (!content.trim()) return;
    onPost(content.trim(), selectedImage || undefined);
    setContent('');
    setSelectedImage(null);
  };

  const handleAddImage = () => {
    const randomImage = SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
    setSelectedImage(randomImage);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card shadow-card p-4"
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 border-2 border-border">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {currentUser ? getInitials(currentUser.name) : '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind? Share with your campus..."
            className="w-full resize-none bg-transparent text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none min-h-[60px]"
            rows={2}
          />

          {selectedImage && (
            <div className="relative mt-2 mb-2">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full max-h-48 object-cover rounded-lg"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-foreground/60 flex items-center justify-center text-background hover:bg-foreground/80 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:text-primary"
                onClick={handleAddImage}
              >
                <ImagePlus className="h-4 w-4" />
                Photo
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