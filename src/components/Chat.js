import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Chat = ({ user, onGuestLogout }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState([{ id: 1, title: 'New Chat', messages: [] }]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleLogout = async () => {
    try {
      if (user?.isGuest) {
        if (onGuestLogout) onGuestLogout();
      } else {
        await signOut(auth);
      }
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  const createNewChat = () => {
    const newId = Date.now();
    const newChat = { id: newId, title: 'New Chat', messages: [] };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
    setMessages([]);
  };

  const switchChat = (chatId) => {
    const found = chats.find(c => c.id === chatId);
    if (found) {
      // Save current messages to current chat
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages } : c));
      setActiveChatId(chatId);
      setMessages(found.messages);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg = { id: Date.now(), text: trimmed, role: 'user' };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Update chat title from first message
    if (messages.length === 0) {
      const title = trimmed.length > 30 ? trimmed.substring(0, 30) + '...' : trimmed;
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, title } : c));
    }

    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    try {
      const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      const botMsg = { id: Date.now() + 1, text: data.reply, role: 'bot' };
      const updatedMessages = [...newMessages, botMsg];
      setMessages(updatedMessages);
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: updatedMessages } : c));
    } catch (err) {
      console.error('Send message error:', err);
      let errorText = `[Error] ${err.message}`;
      
      if (err.message.includes('Failed to fetch')) {
        errorText = '[Network Error] Gateway cannot reach the backend. Check your Internet or ensure Render server is active.';
      } else if (err.message.includes('404') || err.message.includes('403')) {
        errorText = '[Gemini Error] Your API key is invalid or has been disabled by Google as "leaked". Please provide a FRESH key in .env to unlock AI.';
      }

      const errMsg = {
        id: Date.now() + 1,
        text: errorText,
        role: 'error',
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [], title: 'New Chat' } : c));
  };

  const suggestions = [
    'Explain machine learning in simple terms',
    'Write a Python function to reverse a string',
    'What are the top 5 wonders of the world?',
    'How do I improve my productivity?',
  ];

  const avatarLetter = (user?.displayName || user?.email || 'U')[0].toUpperCase();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <div style={s.root}>
      {/* ── Sidebar ──────────────────────────────── */}
      <aside style={{ ...s.sidebar, width: sidebarOpen ? '260px' : '0', minWidth: sidebarOpen ? '260px' : '0' }}>
        <div style={s.sidebarInner}>
          {/* Brand */}
          <div style={s.brand}>
            <div style={s.brandIcon}>N</div>
            <span style={s.brandText}>NexusAI</span>
          </div>

          {/* New Chat */}
          <button style={s.newChatBtn} onClick={createNewChat}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
            <span style={{ fontSize: '18px' }}>+</span> New Chat
          </button>

          {/* Chat History */}
          <div style={s.historyLabel}>Recent Chats</div>
          <div style={s.chatList}>
            {chats.map(c => (
              <div key={c.id}
                onClick={() => switchChat(c.id)}
                style={{ ...s.chatItem, ...(c.id === activeChatId ? s.chatItemActive : {}) }}
                onMouseEnter={e => c.id !== activeChatId && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => c.id !== activeChatId && (e.currentTarget.style.background = 'transparent')}>
                <span style={s.chatItemTitle}>{c.title}</span>
              </div>
            ))}
          </div>

          {/* User Profile */}
          <div style={s.userArea}>
            <div style={s.userCard}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" style={s.avatar} />
              ) : (
                <div style={s.avatarFallback}>{avatarLetter}</div>
              )}
              <div style={s.userInfo}>
                <div style={s.userName}>{displayName}</div>
                <div style={s.userRole}>{user?.isGuest ? 'Guest' : 'Member'}</div>
              </div>
              <button onClick={handleLogout} style={s.logoutBtn} title="Sign out"
                onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                Exit
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────── */}
      <main style={s.main}>
        {/* Top Bar */}
        <header style={s.topBar}>
          <button onClick={() => setSidebarOpen(o => !o)} style={s.menuBtn}>Menu</button>
          <div style={s.topBarTitle}>
            NexusAI Chat
          </div>
          <div style={s.topBarActions}>
            {messages.length > 0 && (
              <button onClick={clearChat} style={s.clearBtn}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Clear
              </button>
            )}
            <button onClick={handleLogout} style={s.logoutBtnTop}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
              Sign Out
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div style={s.messagesArea}>
          {messages.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>N</div>
              <h2 style={s.emptyTitle}>Hello, {displayName.split(' ')[0]}!</h2>
              <p style={s.emptySubtitle}>Ask me anything — I'm here to help.</p>
              <div style={s.suggestions}>
                {suggestions.map((s_item, i) => (
                  <button key={i} style={s.suggestionChip}
                    onClick={() => setInput(s_item.replace(/^[^\w]+/, '').trim())}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}>
                    {s_item}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={s.messageList}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ ...s.messageRow, ...(msg.role === 'user' ? s.messageRowUser : {}) }}>
                  {msg.role !== 'user' && (
                    <div style={{ ...s.msgAvatar, ...(msg.role === 'error' ? s.msgAvatarError : s.msgAvatarBot) }}>
                      {msg.role === 'error' ? '!' : 'AI'}
                    </div>
                  )}
                  <div style={{
                    ...s.bubble,
                    ...(msg.role === 'user' ? s.bubbleUser : msg.role === 'error' ? s.bubbleError : s.bubbleBot)
                  }}>
                    <div style={s.bubbleText}>{msg.text}</div>
                  </div>
                  {msg.role === 'user' && (
                    user?.photoURL
                      ? <img src={user.photoURL} alt="you" style={s.msgAvatar} />
                      : <div style={s.msgAvatarUser}>{avatarLetter}</div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div style={s.messageRow}>
                  <div style={s.msgAvatarBot}>AI</div>
                  <div style={{ ...s.bubble, ...s.bubbleBot }}>
                    <div style={s.typingDots}>
                      <span style={{ ...s.dot, animationDelay: '0ms' }} />
                      <span style={{ ...s.dot, animationDelay: '180ms' }} />
                      <span style={{ ...s.dot, animationDelay: '360ms' }} />
                      <span style={s.typingText}>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={s.inputArea}>
          <form onSubmit={sendMessage} style={s.inputForm}>
            <div style={s.inputBox}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message NexusAI... (Enter to send, Shift+Enter for new line)"
                disabled={isLoading}
                rows={1}
                style={s.textarea}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  ...s.sendBtn,
                  ...((!isLoading && input.trim()) ? s.sendBtnActive : s.sendBtnDisabled)
                }}>
                {isLoading ? '...' : '>'}
              </button>
            </div>
          </form>
          <div style={s.inputHint}>
            NexusAI may produce inaccurate information. Verify important facts.
          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', sans-serif; }
        textarea { resize: none; font-family: 'Inter', sans-serif; }
        textarea::placeholder { color: rgba(255,255,255,0.3); }
        textarea:focus { outline: none; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const s = {
  root: {
    display: 'flex',
    height: '100vh',
    background: '#0f0f1a',
    fontFamily: "'Inter', sans-serif",
    overflow: 'hidden',
    color: '#fff',
  },
  sidebar: {
    background: '#13131f',
    borderRight: '1px solid rgba(255,255,255,0.07)',
    transition: 'width 0.3s ease, min-width 0.3s ease',
    overflow: 'hidden',
    flexShrink: 0,
  },
  sidebarInner: {
    width: '260px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 16px',
    gap: '8px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 4px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    marginBottom: '8px',
  },
  brandIcon: {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '800',
  },
  brandText: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.3px',
  },
  newChatBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '11px 14px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
  },
  historyLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '12px 4px 4px',
  },
  chatList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  chatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  chatItemActive: {
    background: 'rgba(99,102,241,0.2)',
    border: '1px solid rgba(99,102,241,0.3)',
  },
  chatItemTitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.75)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  userArea: {
    borderTop: '1px solid rgba(255,255,255,0.07)',
    paddingTop: '14px',
    marginTop: '8px',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    borderRadius: '10px',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  avatarFallback: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    flexShrink: 0,
  },
  userInfo: { flex: 1, overflow: 'hidden' },
  userName: { fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'color 0.2s',
    flexShrink: 0,
    padding: '4px',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    background: '#0f0f1a',
    flexShrink: 0,
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '22px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    lineHeight: 1,
  },
  topBarTitle: {
    flex: 1,
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  topBarIcon: {
    color: '#6366f1',
    fontSize: '14px',
  },
  topBarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  clearBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
    padding: '7px 14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  logoutBtnTop: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    padding: '7px 14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 20px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '16px',
    padding: '40px 20px',
  },
  emptyIcon: {
    fontSize: '48px',
    color: '#6366f1',
    background: 'rgba(99,102,241,0.15)',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#fff',
    margin: 0,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '15px',
    margin: 0,
    textAlign: 'center',
  },
  suggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
    maxWidth: '600px',
    marginTop: '8px',
  },
  suggestionChip: {
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    textAlign: 'left',
  },
  messageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
    animation: 'fadeIn 0.3s ease',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
    animation: 'fadeIn 0.3s ease',
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },
  msgAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  msgAvatarBot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0,
    color: '#fff',
  },
  msgAvatarUser: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    flexShrink: 0,
    color: '#fff',
  },
  msgAvatarError: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(239,68,68,0.2)',
    border: '1px solid rgba(239,68,68,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '700',
    color: '#f87171',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '16px',
    fontSize: '15px',
    lineHeight: 1.6,
  },
  bubbleUser: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    borderBottomRightRadius: '4px',
  },
  bubbleBot: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.9)',
    borderBottomLeftRadius: '4px',
  },
  bubbleError: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#fca5a5',
    borderBottomLeftRadius: '4px',
  },
  bubbleText: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  typingDots: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
    padding: '2px 0',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.5)',
    display: 'inline-block',
    animation: 'bounce 1.2s infinite ease-in-out',
  },
  typingText: {
    marginLeft: '8px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  inputArea: {
    padding: '16px 20px 20px',
    background: '#0f0f1a',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
  },
  inputForm: { maxWidth: '800px', margin: '0 auto' },
  inputBox: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '14px',
    padding: '8px 8px 8px 16px',
    transition: 'border-color 0.2s',
  },
  textarea: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '15px',
    lineHeight: 1.5,
    maxHeight: '200px',
    overflowY: 'auto',
    padding: '6px 0',
  },
  sendBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  sendBtnActive: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
  },
  sendBtnDisabled: {
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.3)',
    cursor: 'not-allowed',
  },
  inputHint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.2)',
    fontSize: '12px',
    marginTop: '10px',
    maxWidth: '800px',
    margin: '10px auto 0',
  },
};

export default Chat;
