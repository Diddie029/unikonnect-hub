import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import type { PostWithDetails } from '@/hooks/usePosts';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface PostCardProps {
  post: PostWithDetails;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onDelete: (postId: string) => void;
}

export default function PostCard({ post, onLike, onComment, onDelete }: PostCardProps) {
  const { user, isAdmin } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const isOwn = user?.id === post.user_id;

  const handleComment = () => {
    if (!commentText.trim()) return;
    onComment(post.id, commentText.trim());
    setCommentText('');
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, i) =>
      part.startsWith('#') ? (
        <span key={i} className="text-primary font-medium cursor-pointer hover:underline">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card shadow-card transition-shadow hover:shadow-card-hover"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-border">
            {post.profile?.avatar_url ? (
              <AvatarImage src={post.profile.avatar_url} alt={post.profile.name} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {post.profile ? getInitials(post.profile.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-card-foreground">{post.profile?.name}</span>
              <span className="text-xs text-muted-foreground">@{post.profile?.username}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {post.profile?.university && (
                <span className="text-[11px] font-medium text-primary/70">{post.profile.university}</span>
              )}
              <span className="text-[11px] text-muted-foreground">· {formatTimeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>

        {(isOwn || isAdmin) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(post.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed text-card-foreground whitespace-pre-wrap">
          {renderContent(post.content)}
        </p>
      </div>

      {/* Media */}
      {post.media.length > 0 && (
        <div className="px-4 pb-3">
          {post.media.map(m => (
            m.media_type === 'video' ? (
              <video key={m.id} src={m.media_url} className="w-full rounded-lg max-h-80" controls muted />
            ) : (
              <img key={m.id} src={m.media_url} alt="Post attachment" className="w-full rounded-lg object-cover max-h-80" loading="lazy" />
            )
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-border px-2 py-1">
        <Button
          variant="ghost"
          size="sm"
          className={`flex-1 gap-2 text-xs ${post.is_liked ? 'text-accent hover:text-accent' : 'text-muted-foreground'}`}
          onClick={() => onLike(post.id)}
        >
          <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-accent' : ''}`} />
          {post.likes_count > 0 && post.likes_count}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 text-xs text-muted-foreground"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-4 w-4" />
          {post.comments_count > 0 && post.comments_count}
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 gap-2 text-xs text-muted-foreground">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments */}
      {showComments && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-border"
        >
          {post.comments.length > 0 && (
            <div className="px-4 py-3 space-y-3">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5">
                  <Avatar className="h-7 w-7 mt-0.5">
                    {comment.profile?.avatar_url ? (
                      <AvatarImage src={comment.profile.avatar_url} />
                    ) : null}
                    <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
                      {comment.profile ? getInitials(comment.profile.name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-card-foreground">{comment.profile?.name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-xs text-card-foreground/80 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder="Write a comment..."
              className="flex-1 bg-muted/50 rounded-full px-3 py-1.5 text-xs text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary font-semibold"
              onClick={handleComment}
              disabled={!commentText.trim()}
            >
              Post
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
