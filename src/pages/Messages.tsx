import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Send, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

interface Conversation {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const Messages = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeUserId = searchParams.get('chat');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeProfile, setActiveProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    loadConversations();

    // Subscribe to new messages for conversation list updates
    const channel = supabase
      .channel('messages-list')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        loadConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Load active chat messages
  useEffect(() => {
    if (!user || !activeUserId) { setMessages([]); return; }
    loadMessages(activeUserId);
    loadActiveProfile(activeUserId);
    markAsRead(activeUserId);

    const channel = supabase
      .channel(`chat-${activeUserId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as Message;
        if (
          (msg.sender_id === activeUserId && msg.receiver_id === user.id) ||
          (msg.sender_id === user.id && msg.receiver_id === activeUserId)
        ) {
          setMessages(prev => [...prev, msg]);
          if (msg.sender_id === activeUserId) markAsRead(activeUserId);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeUserId, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = document.getElementById('messages-end');
    el?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);

    // Get all messages involving the user
    const { data: allMessages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!allMessages) { setLoading(false); return; }

    // Group by other user
    const convMap = new Map<string, { last_message: string; last_message_at: string; unread_count: number }>();
    for (const msg of allMessages) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          last_message: msg.content,
          last_message_at: msg.created_at,
          unread_count: 0,
        });
      }
      if (msg.receiver_id === user.id && !msg.is_read) {
        const entry = convMap.get(otherId)!;
        entry.unread_count++;
      }
    }

    // Fetch profiles
    const userIds = Array.from(convMap.keys());
    if (userIds.length === 0) { setConversations([]); setLoading(false); return; }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);

    const convs: Conversation[] = (profiles || []).map(p => ({
      user_id: p.user_id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      ...convMap.get(p.user_id)!,
    })).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

    setConversations(convs);
    setLoading(false);
  };

  const loadMessages = async (otherId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const loadActiveProfile = async (otherId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', otherId)
      .single();
    setActiveProfile(data);
  };

  const markAsRead = async (otherId: string) => {
    if (!user) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', otherId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);
    loadConversations();
  };

  const handleSend = async () => {
    if (!user || !activeUserId || !newMessage.trim()) return;
    setSending(true);
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: activeUserId,
      content: newMessage.trim(),
    });
    setNewMessage('');
    setSending(false);
    // Realtime will handle adding the message
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .ilike('full_name', `%${q}%`)
      .neq('user_id', user?.id || '')
      .limit(10);
    setSearchResults(data || []);
  };

  const openChat = (userId: string) => {
    setSearchParams({ chat: userId });
    setSearchQuery('');
    setSearchResults([]);
  };

  if (!user) return null;

  // Chat view
  if (activeUserId) {
    return (
      <div className="flex flex-col h-[calc(100vh-56px-64px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] md:h-[calc(100vh-64px)] max-w-2xl mx-auto">
        {/* Chat header */}
        <div className="flex items-center gap-3 p-3 border-b border-border bg-background/80 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={() => setSearchParams({})}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarImage src={activeProfile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {activeProfile?.full_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm truncate">{activeProfile?.full_name || '...'}</span>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMine = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      isMine
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMine ? 'text-primary-foreground/60 justify-end' : 'text-muted-foreground'}`}>
                      <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                      {isMine && (msg.is_read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div id="messages-end" />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border bg-background">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('Type a message...', 'संदेश लिखें...')}
              className="flex-1 rounded-full"
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full shrink-0"
              disabled={!newMessage.trim() || sending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Conversation list view
  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">{t('Messages', 'संदेश')}</h1>

        {/* Search for new chats */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('Search people...', 'लोगों को खोजें...')}
            className="pl-10 rounded-full"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-background border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-auto">
              {searchResults.map((p) => (
                <button
                  key={p.user_id}
                  onClick={() => openChat(p.user_id)}
                  className="flex items-center gap-3 w-full p-3 hover:bg-muted transition-colors text-left"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{p.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{p.full_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="h-[calc(100vh-250px)]">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            {t('Loading...', 'लोड हो रहा है...')}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm gap-2">
            <p>{t('No conversations yet', 'अभी कोई बातचीत नहीं')}</p>
            <p className="text-xs">{t('Search for someone to start chatting', 'चैट शुरू करने के लिए किसी को खोजें')}</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.user_id}
              onClick={() => openChat(conv.user_id)}
              className="flex items-center gap-3 w-full p-4 hover:bg-muted/50 transition-colors border-b border-border/50 text-left"
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conv.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary">{conv.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                {conv.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm truncate">{conv.full_name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                  </span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {conv.last_message}
                </p>
              </div>
            </button>
          ))
        )}
      </ScrollArea>
    </div>
  );
};

export default Messages;
