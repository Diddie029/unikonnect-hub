import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Plus,
  Users,
  Search,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function MessagingPage() {
  const { user, profiles } = useAuth();
  const {
    conversations, messages, activeConversation, loading,
    setActiveConversation, sendMessage, startConversation, createGroupChat,
  } = useMessages();

  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageInput.trim() || !activeConversation) return;
    await sendMessage(activeConversation, messageInput.trim());
    setMessageInput('');
  };

  const handleStartDM = async (otherUserId: string) => {
    const convId = await startConversation(otherUserId);
    if (convId) {
      setActiveConversation(convId);
      setShowNewChat(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    const convId = await createGroupChat(groupName, selectedMembers);
    if (convId) {
      setActiveConversation(convId);
      setShowNewChat(false);
      setGroupName('');
      setSelectedMembers([]);
    }
  };

  const activeConv = conversations.find(c => c.id === activeConversation);
  const otherProfiles = profiles.filter(p => p.user_id !== user?.id);

  const getConversationName = (conv: typeof conversations[0]) => {
    if (conv.is_group) return conv.group_name || 'Group Chat';
    const other = conv.participants.find(p => p.user_id !== user?.id);
    return other?.profile?.name || 'Unknown';
  };

  const getConversationAvatar = (conv: typeof conversations[0]) => {
    if (conv.is_group) return null;
    const other = conv.participants.find(p => p.user_id !== user?.id);
    return other?.profile?.avatar_url || null;
  };

  const filteredConversations = conversations.filter(c =>
    getConversationName(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-border flex flex-col bg-card ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-display text-card-foreground">Messages</h2>
            <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Start a direct message</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {otherProfiles.map(p => (
                      <button
                        key={p.user_id}
                        onClick={() => handleStartDM(p.user_id)}
                        className="flex items-center gap-3 w-full rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          {p.avatar_url ? <AvatarImage src={p.avatar_url} /> : null}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(p.name)}</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground">@{p.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" /> Create Group Chat
                    </h4>
                    <Input
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      placeholder="Group name..."
                      className="mb-2"
                    />
                    <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
                      {otherProfiles.map(p => (
                        <label key={p.user_id} className="flex items-center gap-2 px-2 py-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(p.user_id)}
                            onChange={e => {
                              if (e.target.checked) setSelectedMembers(prev => [...prev, p.user_id]);
                              else setSelectedMembers(prev => prev.filter(id => id !== p.user_id));
                            }}
                          />
                          <span className="text-sm">{p.name}</span>
                        </label>
                      ))}
                    </div>
                    <Button size="sm" onClick={handleCreateGroup} disabled={!groupName.trim() || selectedMembers.length === 0}>
                      Create Group
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-center text-xs text-muted-foreground py-8">Loading...</p>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors ${
                  activeConversation === conv.id ? 'bg-muted/50' : ''
                }`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  {getConversationAvatar(conv) ? <AvatarImage src={getConversationAvatar(conv)!} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {conv.is_group ? <Users className="h-4 w-4" /> : getInitials(getConversationName(conv))}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-card-foreground truncate">{getConversationName(conv)}</p>
                    {conv.last_message && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatTimeAgo(conv.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message.content}</p>
                  )}
                </div>
                {conv.unread_count > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                    {conv.unread_count}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation && activeConv ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setActiveConversation(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-9 w-9">
                {getConversationAvatar(activeConv) ? <AvatarImage src={getConversationAvatar(activeConv)!} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {activeConv.is_group ? <Users className="h-4 w-4" /> : getInitials(getConversationName(activeConv))}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-card-foreground">{getConversationName(activeConv)}</p>
                {activeConv.is_group && (
                  <p className="text-[11px] text-muted-foreground">{activeConv.participants.length} members</p>
                )}
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
                    {!isMine && (
                      <Avatar className="h-7 w-7 shrink-0">
                        {msg.sender_profile?.avatar_url ? <AvatarImage src={msg.sender_profile.avatar_url} /> : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                          {msg.sender_profile ? getInitials(msg.sender_profile.name) : '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${
                      isMine
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-card-foreground rounded-bl-md'
                    }`}>
                      {!isMine && activeConv.is_group && (
                        <p className="text-[10px] font-semibold mb-0.5 opacity-70">{msg.sender_profile?.name}</p>
                      )}
                      {msg.content}
                      <p className={`text-[9px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {formatTimeAgo(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border p-3 bg-card">
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSend} disabled={!messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
