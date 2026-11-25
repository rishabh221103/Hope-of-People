import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  messageService,
  ChatMessage,
  ConversationSummary,
} from '../services/messageService';
import {
  MessageSquare,
  Send,
  Search,
  Check,
  CheckCheck,
  Users,
  Loader2,
} from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUserIdParam = searchParams.get('userId');

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    initialUserIdParam ? Number(initialUserIdParam) : null
  );
  const [activePartner, setActivePartner] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async (maintainSelected = true) => {
    try {
      const data = await messageService.getConversations();
      setConversations(data || []);

      if (data && data.length > 0) {
        if (!maintainSelected || !selectedUserId) {
          const target = initialUserIdParam ? Number(initialUserIdParam) : data[0].otherUserId;
          setSelectedUserId(target);
          const found = data.find((c) => c.otherUserId === target) || data[0];
          setActivePartner(found);
        } else {
          const current = data.find((c) => c.otherUserId === selectedUserId);
          if (current) setActivePartner(current);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations(false);
  }, []);

  // Update selected conversation when initialUserIdParam changes
  useEffect(() => {
    if (initialUserIdParam) {
      const id = Number(initialUserIdParam);
      setSelectedUserId(id);
      const partner = conversations.find((c) => c.otherUserId === id);
      if (partner) setActivePartner(partner);
    }
  }, [initialUserIdParam, conversations]);

  // Load active messages when selected user changes
  useEffect(() => {
    if (!selectedUserId) return;

    let isMounted = true;
    setLoadingMessages(true);

    const fetchMessages = async () => {
      try {
        const msgs = await messageService.getConversation(selectedUserId);
        if (isMounted) {
          setMessages(msgs || []);
          setTimeout(scrollToBottom, 80);
        }
      } catch (err) {
        console.error('Failed to fetch conversation', err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    fetchMessages();

    // Auto-poll conversation every 4 seconds
    const interval = setInterval(() => {
      messageService
        .getConversation(selectedUserId)
        .then((msgs) => {
          if (isMounted) {
            setMessages((prev) => {
              if (msgs.length !== prev.length) {
                setTimeout(scrollToBottom, 60);
                return msgs;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedUserId]);

  const handleSelectConversation = (conv: ConversationSummary) => {
    setSelectedUserId(conv.otherUserId);
    setActivePartner(conv);
    setSearchParams({ userId: String(conv.otherUserId) });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessageText.trim() || !selectedUserId || sending) return;

    const textToSend = newMessageText.trim();
    setSending(true);

    try {
      const sent = await messageService.sendMessage(selectedUserId, textToSend);
      setMessages((prev) => [...prev, sent]);
      setNewMessageText('');
      setTimeout(scrollToBottom, 50);

      // Refresh conversations list to update snippet
      loadConversations(true);
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.otherUserName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="page-container" style={{ maxWidth: '1180px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          color: '#ffffff',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 20px -4px rgba(30, 58, 138, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <MessageSquare size={13} />
            <span>HOP Messenger</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: '#ffffff' }}>
            Community Direct Messaging
          </h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: '0.9rem', maxWidth: '600px' }}>
            Connect and communicate directly with verified community members, coordinate aid deliveries, and stay updated in real time.
          </p>
        </div>

        <Link
          to="/network"
          className="btn"
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1rem',
            borderRadius: '10px',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <Users size={15} />
          <span>My Network</span>
        </Link>
      </div>

      {/* Main Chat Frame */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) 1fr',
          minHeight: '620px',
          height: 'calc(100vh - 280px)',
          overflow: 'hidden',
        }}
      >
        {/* Left Column: Conversations List */}
        <div
          style={{
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f8fafc',
          }}
        >
          {/* Search Header */}
          <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="text"
                placeholder="Search connections..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConversations ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                <span style={{ fontSize: '0.85rem' }}>Loading chats...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                <Users size={32} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', fontWeight: 600 }}>No conversations yet</h4>
                <p style={{ fontSize: '0.8rem', margin: '0 0 1rem 0' }}>
                  Connect with donors or beneficiaries to start direct messaging.
                </p>
                <Link to="/network" className="btn btn-primary btn-sm" style={{ borderRadius: '9999px' }}>
                  Find People
                </Link>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedUserId === conv.otherUserId;
                return (
                  <div
                    key={conv.otherUserId}
                    onClick={() => handleSelectConversation(conv)}
                    style={{
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                      borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: '#dbeafe',
                        color: '#1d4ed8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        flexShrink: 0,
                      }}
                    >
                      {conv.otherUserName.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: isSelected ? 700 : 600, fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.otherUserName}
                        </span>
                        {conv.lastMessageAt && (
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', flexShrink: 0 }}>
                            {new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: isSelected ? '#1e40af' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.lastMessage}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span
                            style={{
                              backgroundColor: '#ef4444',
                              color: '#ffffff',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              borderRadius: '9999px',
                              padding: '0.1rem 0.45rem',
                              marginLeft: '0.5rem',
                              flexShrink: 0,
                            }}
                          >
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Thread */}
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
          {selectedUserId && activePartner ? (
            <>
              {/* Chat Thread Header */}
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                      border: '2px solid #bfdbfe',
                    }}
                  >
                    {activePartner.otherUserName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#1e293b' }}>
                      {activePartner.otherUserName}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                      Connected Community Member ({activePartner.otherUserRole})
                    </span>
                  </div>
                </div>

                <Link
                  to="/network"
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  View Profile
                </Link>
              </div>

              {/* Message List Scroll Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  backgroundColor: '#f8fafc',
                }}
              >
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: '#2563eb' }} />
                    <span style={{ fontSize: '0.85rem' }}>Loading conversation...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
                    <MessageSquare size={36} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
                    <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 600 }}>Start your conversation</h4>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>
                      Say hello to {activePartner.otherUserName} to begin collaborating!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.isMe;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '70%',
                            padding: '0.65rem 0.95rem',
                            borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            backgroundColor: isMe ? '#2563eb' : '#ffffff',
                            color: isMe ? '#ffffff' : '#1e293b',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                            border: isMe ? 'none' : '1px solid #e2e8f0',
                            fontSize: '0.9rem',
                            lineHeight: 1.45,
                            wordBreak: 'break-word',
                          }}
                        >
                          {msg.content}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            marginTop: '0.2rem',
                            fontSize: '0.7rem',
                            color: '#94a3b8',
                          }}
                        >
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && (
                            msg.isRead ? (
                              <span title="Read"><CheckCheck size={13} style={{ color: '#2563eb' }} /></span>
                            ) : (
                              <span title="Sent"><Check size={13} style={{ color: '#94a3b8' }} /></span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '0.85rem 1rem',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <input
                  type="text"
                  placeholder={`Message ${activePartner.otherUserName}...`}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  disabled={sending}
                  style={{
                    flex: 1,
                    padding: '0.65rem 1rem',
                    fontSize: '0.9rem',
                    borderRadius: '9999px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                  }}
                />

                <button
                  type="submit"
                  disabled={!newMessageText.trim() || sending}
                  className="btn btn-primary"
                  style={{
                    borderRadius: '9999px',
                    padding: '0.65rem 1.25rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 600,
                  }}
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', padding: '2rem' }}>
              <MessageSquare size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                Select a conversation
              </h3>
              <p style={{ fontSize: '0.875rem', maxWidth: '340px', textAlign: 'center', margin: 0 }}>
                Choose a connection on the left to view messages or coordinate aid requests.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
