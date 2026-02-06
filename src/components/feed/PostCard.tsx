import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Post, type Comment, formatTimeAgo, getInitials } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onDelete: (postId: string) => void;
}

export default function PostCard({ post, onLike, onComment, onDelete }: PostCardProps) {
  const { currentUser, isAdmin } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
  const isOwn = currentUser?.id === post.userId;

  const handleComment = () => {
    if (!commentText.trim()) return;
    onComment(post.id, commentText.trim());
    setCommentText('');
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
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getInitials(post.userName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-card-foreground">{post.userName}</span>
              <span className="text-xs text-muted-foreground">@{post.userUsername}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {post.userUniversity && (
                <span className="text-[11px] font-medium text-primary/70">{post.userUniversity}</span>
              )}
              <span className="text-[11px] text-muted-foreground">· {formatTimeAgo(post.createdAt)}</span>
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
        <p className="text-sm leading-relaxed text-card-foreground whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Image */}
      {post.image && (
        <div className="px-4 pb-3">
          <img
            src={post.image}
            alt="Post attachment"
            className="w-full rounded-lg object-cover max-h-80"
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-border px-2 py-1">
        <Button
          variant="ghost"
          size="sm"
          className={`flex-1 gap-2 text-xs ${isLiked ? 'text-accent hover:text-accent' : 'text-muted-foreground'}`}
          onClick={() => onLike(post.id)}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-accent' : ''}`} />
          {post.likes.length > 0 && post.likes.length}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 text-xs text-muted-foreground"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-4 w-4" />
          {post.comments.length > 0 && post.comments.length}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 text-xs text-muted-foreground"
        >
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
                    <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
                      {getInitials(comment.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-card-foreground">{comment.userName}</span>
                      <span className="text-[10px] text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-xs text-card-foreground/80 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                {currentUser ? getInitials(currentUser.name) : '?'}
              </AvatarFallback>
            </Avatar>
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