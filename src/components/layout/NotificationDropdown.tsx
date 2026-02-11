import { useState } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Megaphone, CheckCheck, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, type Notification } from '@/hooks/useNotifications';

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const ICON_MAP: Record<string, React.ElementType> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: MessageCircle,
  broadcast: Megaphone,
  verification: BadgeCheck,
};

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleClick = (notif: Notification) => {
    if (!notif.is_read) markAsRead(notif.id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold font-display text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map(notif => {
                const Icon = ICON_MAP[notif.type] || Bell;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                      !notif.is_read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      notif.type === 'like' ? 'bg-accent/10 text-accent' :
                      notif.type === 'follow' ? 'bg-primary/10 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-snug">{notif.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{formatTimeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && (
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
