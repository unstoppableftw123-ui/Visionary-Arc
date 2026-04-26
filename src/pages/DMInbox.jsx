import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { AuthContext } from "../App";
import axios from "axios";
import { Send, MessageSquare, ChevronLeft } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function DMInbox() {
  const { userId: paramUserId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [inbox, setInbox] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(paramUserId || null);
  const [thread, setThread] = useState([]);
  const [partner, setPartner] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchInbox = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/messages/inbox`);
      setInbox(res.data);
    } catch (_) {}
  };

  const fetchThread = async (userId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/messages/${userId}`);
      setThread(res.data.messages || []);
      setPartner(res.data.partner);
      setInbox(prev => prev.map(c =>
        c.user.user_id === userId ? { ...c, unread_count: 0 } : c
      ));
    } catch (_) {}
  };

  // Initial inbox load + 30s poll
  useEffect(() => {
    fetchInbox();
    const poll = setInterval(fetchInbox, 30000);
    return () => clearInterval(poll);
  }, []);

  // Sync selected user from URL param
  useEffect(() => {
    if (paramUserId) setSelectedUserId(paramUserId);
  }, [paramUserId]);

  // Load thread when selected user changes
  useEffect(() => {
    if (selectedUserId) fetchThread(selectedUserId);
    else { setThread([]); setPartner(null); }
  }, [selectedUserId]);

  // Poll active thread every 5s
  useEffect(() => {
    if (!selectedUserId) return;
    const poll = setInterval(() => fetchThread(selectedUserId), 5000);
    return () => clearInterval(poll);
  }, [selectedUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const selectConversation = (userId) => {
    setSelectedUserId(userId);
    navigate(`/messages/${userId}`, { replace: true });
  };

  const goBack = () => {
    setSelectedUserId(null);
    navigate('/messages', { replace: true });
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedUserId || sending) return;
    setSending(true);
    try {
      const res = await axios.post(`${API_BASE}/api/messages`, {
        receiverId: selectedUserId,
        content: messageInput.trim(),
      });
      setThread(prev => [...prev, res.data]);
      setMessageInput('');
      fetchInbox();
    } catch (_) {} finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen overflow-hidden bg-background">
      {/* Left panel — conversation list */}
      <div className={`w-full md:w-72 shrink-0 border-r border-border flex flex-col ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-heading font-semibold text-lg">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {inbox.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            inbox.map((conv) => (
              <button
                key={conv.user.user_id}
                type="button"
                onClick={() => selectConversation(conv.user.user_id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left border-b border-border/50 ${
                  selectedUserId === conv.user.user_id ? 'bg-secondary' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conv.user.avatar} alt={conv.user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {conv.user.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-[var(--text-primary)] px-1">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-medium truncate">{conv.user.name}</p>
                    {conv.last_message && (
                      <span className="text-sm md:text-[10px] text-muted-foreground shrink-0">
                        {formatTime(conv.last_message.sent_at)}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className={`text-sm md:text-xs truncate mt-0.5 ${
                      conv.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}>
                      {conv.last_message.sender_id === user?.user_id ? 'You: ' : ''}
                      {conv.last_message.content}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel — thread */}
      <div className={`flex-1 flex flex-col min-w-0 ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        {!selectedUserId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-25" />
              <p className="text-sm">Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={goBack}
                className="md:hidden p-1 rounded hover:bg-secondary text-muted-foreground"
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {partner && (
                <>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={partner.avatar} alt={partner.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm md:text-xs font-semibold">
                      {partner.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{partner.name}</p>
                    <p className="text-sm md:text-[10px] text-muted-foreground capitalize">{partner.role}</p>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {thread.length === 0 && (
                <p className="text-center text-sm md:text-xs text-muted-foreground mt-8">No messages yet. Say hello!</p>
              )}
              {thread.map((msg) => {
                const isOwn = msg.sender_id === user?.user_id;
                return (
                  <div key={msg.message_id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm break-words ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-secondary text-foreground rounded-bl-sm'
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-sm md:text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'}`}>
                        {formatTime(msg.sent_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex items-center gap-2 shrink-0">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sending}
                autoComplete="off"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!messageInput.trim() || sending}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
