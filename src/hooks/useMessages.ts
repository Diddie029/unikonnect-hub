import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Conversation {
  id: string;
  is_group: boolean;
  group_name: string | null;
  created_at: string;
  participants: { user_id: string; profile: { name: string; username: string; avatar_url: string | null; is_online: boolean } | null }[];
  last_message?: { content: string; created_at: string; sender_id: string };
  unread_count: number;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
  sender_profile?: { name: string; username: string; avatar_url: string | null };
}

export function useMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    // Get user's conversations
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (!participations?.length) { setLoading(false); return; }

    const convIds = participations.map(p => p.conversation_id);

    const [convsRes, allPartsRes, msgsRes] = await Promise.all([
      supabase.from('conversations').select('*').in('id', convIds),
      supabase.from('conversation_participants').select('conversation_id, user_id').in('conversation_id', convIds),
      supabase.from('messages').select('*').in('conversation_id', convIds).order('created_at', { ascending: false }),
    ]);

    // Get all participant profiles
    const allUserIds = [...new Set((allPartsRes.data || []).map(p => p.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, name, username, avatar_url, is_online')
      .in('user_id', allUserIds);
    const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));

    const enriched: Conversation[] = (convsRes.data || []).map(conv => {
      const parts = (allPartsRes.data || []).filter(p => p.conversation_id === conv.id);
      const convMsgs = (msgsRes.data || []).filter(m => m.conversation_id === conv.id);
      const unread = convMsgs.filter(m => m.sender_id !== user.id && !m.read_at).length;

      return {
        ...conv,
        participants: parts.map(p => ({
          user_id: p.user_id,
          profile: profileMap.get(p.user_id) || null,
        })),
        last_message: convMsgs[0] ? {
          content: convMsgs[0].content,
          created_at: convMsgs[0].created_at,
          sender_id: convMsgs[0].sender_id,
        } : undefined,
        unread_count: unread,
      };
    });

    enriched.sort((a, b) => {
      const aTime = a.last_message?.created_at || a.created_at;
      const bTime = b.last_message?.created_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setConversations(enriched);
    setLoading(false);
  }, [user]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!data) return;

    const senderIds = [...new Set(data.map(m => m.sender_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name, username, avatar_url')
      .in('user_id', senderIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    const enriched: Message[] = data.map(m => ({
      ...m,
      sender_profile: profileMap.get(m.sender_id) || undefined,
    }));

    setMessages(enriched);

    // Mark as read
    if (user) {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .is('read_at', null);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
        if (activeConversation) fetchMessages(activeConversation);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchConversations, fetchMessages, activeConversation]);

  useEffect(() => {
    if (activeConversation) fetchMessages(activeConversation);
  }, [activeConversation, fetchMessages]);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user) return;
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    });
  }, [user]);

  const startConversation = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    // Check if 1-1 conversation already exists
    const { data: myParts } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    const { data: theirParts } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherUserId);

    if (myParts && theirParts) {
      const myConvs = new Set(myParts.map(p => p.conversation_id));
      const shared = theirParts.filter(p => myConvs.has(p.conversation_id));

      for (const s of shared) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', s.conversation_id)
          .eq('is_group', false)
          .maybeSingle();
        if (conv) return conv.id;
      }
    }

    // Create new conversation
    const { data: conv } = await supabase
      .from('conversations')
      .insert({ is_group: false })
      .select()
      .single();

    if (!conv) return null;

    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: otherUserId },
    ]);

    await fetchConversations();
    return conv.id;
  }, [user, fetchConversations]);

  const createGroupChat = useCallback(async (name: string, memberIds: string[]): Promise<string | null> => {
    if (!user) return null;

    const { data: conv } = await supabase
      .from('conversations')
      .insert({ is_group: true, group_name: name })
      .select()
      .single();

    if (!conv) return null;

    const participants = [user.id, ...memberIds].map(uid => ({
      conversation_id: conv.id,
      user_id: uid,
    }));

    await supabase.from('conversation_participants').insert(participants);
    await fetchConversations();
    return conv.id;
  }, [user, fetchConversations]);

  return {
    conversations,
    messages,
    activeConversation,
    loading,
    setActiveConversation,
    sendMessage,
    startConversation,
    createGroupChat,
    fetchConversations,
  };
}
