import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import useSocket from '../hooks/useSocket';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';
import Whiteboard from '../components/collaboration/Whiteboard';

const Chat = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();
  
  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user.id;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  };

  const currentUserId = getCurrentUserId();
  const { socket, sendMessage: socketSendMessage, onNewMessage, onUserTyping, onUserStopTyping, startTyping, stopTyping, offNewMessage, offUserTyping } = useSocket(currentUserId);
  
  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom._id);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    onNewMessage((message) => {
      if (selectedRoom && message.chatRoom === selectedRoom._id) {
        setMessages(prev => [...prev, message]);
      }
    });

    onUserTyping((data) => {
      if (selectedRoom && data.roomId === selectedRoom._id) {
        setTypingUsers(prev => [...prev.filter(u => u !== data.username), data.username]);
      }
    });

    onUserStopTyping((data) => {
      if (selectedRoom && data.roomId === selectedRoom._id) {
        setTypingUsers(prev => prev.filter(u => u !== data.username));
      }
    });

    return () => {
      offNewMessage();
      offUserTyping();
    };
  }, [selectedRoom, onNewMessage, onUserTyping, onUserStopTyping, offNewMessage, offUserTyping]);

  const fetchChatRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.CHAT.ROOMS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatRooms(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching chat rooms:', err);
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.CHAT.MESSAGES(roomId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || sendingMessage) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(API_ENDPOINTS.CHAT.MESSAGES(selectedRoom._id), {
        content: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      socketSendMessage(selectedRoom._id, newMessage, currentUserId);
      setNewMessage('');
      stopTyping(selectedRoom._id, currentUserId);

      // Update chat room last activity
      fetchChatRooms();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (selectedRoom && currentUserId) {
      startTyping(selectedRoom._id, currentUserId);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(selectedRoom._id, currentUserId);
      }, 2000);
    }
  };

  const getOtherParticipant = (room) => {
    const currentUserId = getCurrentUserId();
    return room.participants.find(p => p._id !== currentUserId);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startVideoCall = () => {
    if (!selectedRoom) return;
    const otherParticipant = getOtherParticipant(selectedRoom);
    if (!otherParticipant) return;

    window.dispatchEvent(new CustomEvent('global-video-call-initiate', { 
      detail: { targetUserId: otherParticipant._id, targetUserName: otherParticipant.username } 
    }));
  };

  const openWhiteboard = () => setShowWhiteboard(true);
  const closeWhiteboard = () => setShowWhiteboard(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-bold">Loading chats...</div>
      </div>
    );
  }

  return (
    <>
      {showWhiteboard && selectedRoom && socket && (
        <Whiteboard 
          socket={socket}
          roomId={selectedRoom._id}
          onClose={closeWhiteboard}
        />
      )}
      
      <div className="bg-surface font-body text-on-surface h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 shrink-0 px-8 flex items-center justify-between border-b border-surface-container-high bg-surface-container-lowest z-10">
          <div className="flex items-center gap-12">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-on-primary font-bold">swap_calls</span>
              </div>
              <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dim">SkillSwap</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 font-headline font-medium text-sm tracking-tight">
              <Link to="/dashboard" className="text-on-surface-variant hover:text-primary transition-colors">Dashboard</Link>
              <Link to="/matches" className="text-on-surface-variant hover:text-primary transition-colors">Matches</Link>
              <Link to="/chat" className="text-primary font-bold border-b-2 border-primary pb-1">Chat</Link>
              <Link to="/profile-settings" className="text-on-surface-variant hover:text-primary transition-colors">Profile</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center bg-surface-container-high rounded-full px-4 py-2 gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-on-surface-variant" placeholder="Search chats..." type="text" />
            </div>

            <div className="p-2 hover:bg-surface-container-high rounded-lg transition-all duration-200 text-on-surface-variant">
              <NotificationBell socket={socket} />
            </div>

            <div className="p-2 hover:bg-surface-container-high rounded-lg transition-all duration-200 text-on-surface-variant">
              <ThemeToggle />
            </div>

            <button onClick={handleLogout} className="p-2 hover:bg-surface-container-high rounded-lg transition-all duration-200 text-on-surface-variant">
              <span className="material-symbols-outlined">logout</span>
            </button>

            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary ring-2 ring-primary-container/20">
              <img alt="User Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBl--YtWmX98LLMck0EYYnR9DzbxP_k4y55ka50_eYnKoTO98BKskSPdUlZyQFOVe7f7KQrLK84N9FQysWNcYt7i5rdRirRYqcMOff8qYUEFIVun-55QJn2T_JZA48c7AUOSrb91W0ZuXUPdyOGUAGxS9Z6vF81uny9STW8rxueiKg2u5CfqopYPY--eWaqpStGE04YW9iFFeqVWbQ_Ot16uXH1nBmQSiHNpRZRlg2TTurR3LqABLvEkWFjhAJ3ifc5oGc9zycOdHk" />
            </div>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          {/* Pane 1: Conversations List */}
          <aside className="w-80 bg-surface-container-lowest border-r border-surface-container-high flex flex-col z-0">
            <div className="p-6 border-b border-surface-container-low shrink-0 flex items-center justify-between">
              <h2 className="font-headline font-extrabold text-2xl">Messages</h2>
              <button className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-sm">edit_square</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chatRooms.length === 0 ? (
                <div className="text-center p-6 space-y-4">
                  <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl">chat</span>
                  </div>
                  <h3 className="font-headline font-bold">No Active Chats</h3>
                  <p className="text-sm text-on-surface-variant">Find matches to start swapping skills.</p>
                  <Link to="/matches" className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold mt-2 hover:bg-primary/20 transition-colors">Find Matches</Link>
                </div>
              ) : (
                chatRooms.map(room => {
                  const otherParticipant = getOtherParticipant(room);
                  const isSelected = selectedRoom?._id === room._id;

                  return (
                    <div
                      key={room._id}
                      onClick={() => setSelectedRoom(room)}
                      className={`p-3 rounded-xl flex gap-3 items-center cursor-pointer transition-all duration-200 ${isSelected ? 'bg-primary/10' : 'hover:bg-surface-container-high'}`}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-lg font-bold text-on-surface shrink-0 overflow-hidden ring-2 ring-surface">
                          {otherParticipant?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full border-2 border-surface"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-bold text-sm truncate text-on-surface">{otherParticipant?.username || 'Unknown'}</h3>
                          <span className={`text-[10px] font-label font-semibold ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>
                            {room.lastActivity ? formatTimeAgo(room.lastActivity) : 'New'}
                          </span>
                        </div>
                        <p className={`text-xs truncate ${isSelected ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>
                          {room.lastMessage?.content || 'Start a conversation...'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* Pane 2: Main Chat Window */}
          <section className="flex-1 flex flex-col bg-surface-container-lowest relative min-w-0">
            {selectedRoom ? (
              <>
                {/* Chat Header */}
                <header className="h-20 shrink-0 px-8 flex items-center justify-between border-b border-surface-container-low">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center ring-2 ring-surface-container-lowest text-on-primary font-bold text-xs shrink-0">
                      {getOtherParticipant(selectedRoom)?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-headline font-bold text-lg truncate max-w-[200px] sm:max-w-xs">{getOtherParticipant(selectedRoom)?.username}</h2>
                      <span className="flex items-center gap-1.5 text-xs font-label text-secondary font-semibold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                        Active Now
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={openWhiteboard} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-surface-container-high text-primary rounded-lg font-label text-xs font-bold hover:bg-primary/20 transition-all duration-300">
                      <span className="material-symbols-outlined text-lg">draw</span>
                      <span className="hidden sm:inline">WHITEBOARD</span>
                    </button>
                    <button onClick={startVideoCall} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary/10 text-primary rounded-lg font-label text-xs font-bold hover:bg-primary hover:text-on-primary transition-all duration-300">
                      <span className="material-symbols-outlined text-lg">videocam</span>
                      <span className="hidden sm:inline">CALL</span>
                    </button>
                    <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </div>
                </header>

                {/* Message Feed */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 flex flex-col">
                  {messages.length === 0 ? (
                    <div className="m-auto text-center space-y-4 max-w-sm">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                        <span className="material-symbols-outlined text-4xl">waving_hand</span>
                      </div>
                      <h3 className="text-xl font-bold">Say hello!</h3>
                      <p className="text-sm text-on-surface-variant">This is the start of your conversation with {getOtherParticipant(selectedRoom)?.username}. Send a message to begin swapping skills.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center">
                        <span className="px-4 py-1 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Beginning of Chat</span>
                      </div>

                      {messages.map((message, idx) => {
                        const isOwn = message.sender._id === currentUserId;
                        const showAvatar = !isOwn && (idx === 0 || messages[idx-1].sender._id === currentUserId);

                        return (
                          <div key={message._id} className={`flex items-end gap-3 max-w-[85%] sm:max-w-[70%] ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}>
                            {isOwn ? null : (
                              showAvatar ? (
                                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold shrink-0 mb-6">
                                  {getOtherParticipant(selectedRoom)?.username?.charAt(0).toUpperCase()}
                                </div>
                              ) : (
                                <div className="w-8 shrink-0"></div>
                              )
                            )}

                            <div className={isOwn ? '' : 'space-y-1'}>
                              <div className={`${isOwn ? 'bg-primary text-on-primary shadow-lg shadow-primary/10 rounded-2xl rounded-br-none' : 'bg-surface-container-low rounded-2xl rounded-bl-none'} p-4`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              </div>
                              <span className={`text-[10px] font-label block mt-1 ${isOwn ? 'text-on-surface-variant/70 text-right' : 'text-on-surface-variant'}`}>
                                {formatMessageTime(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {typingUsers.length > 0 && (
                        <div className="flex items-end gap-3 max-w-[80%]">
                           <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold shrink-0 mb-2">
                             {typingUsers[0].charAt(0).toUpperCase()}
                           </div>
                           <div className="bg-surface-container-low p-3 rounded-2xl rounded-bl-none flex items-center gap-1 mb-2">
                             <div className="w-2 h-2 bg-on-surface-variant/50 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                             <div className="w-2 h-2 bg-on-surface-variant/50 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                             <div className="w-2 h-2 bg-on-surface-variant/50 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                           </div>
                        </div>
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <footer className="p-4 sm:p-6 bg-surface-container-lowest shrink-0">
                  <form onSubmit={sendMessage} className="bg-surface-container-high rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
                    <div className="flex items-end gap-2 p-1 sm:p-2">
                      <button type="button" className="p-2 sm:p-3 hover:bg-surface-container-highest rounded-xl text-on-surface-variant transition-colors shrink-0">
                        <span className="material-symbols-outlined text-xl">add_circle</span>
                      </button>
                      <textarea
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none py-2 sm:py-3 placeholder:text-on-surface-variant/60 max-h-32 min-h-[44px]"
                        placeholder="Type your message..."
                        rows="1"
                        value={newMessage}
                        onChange={handleTyping}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(e);
                          }
                        }}
                        disabled={sendingMessage}
                      ></textarea>
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className="w-10 h-10 sm:w-12 sm:h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shrink-0"
                      >
                        <span className="material-symbols-outlined text-lg sm:text-xl">send</span>
                      </button>
                    </div>
                  </form>
                </footer>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-surface p-8 text-center border-l border-surface-container-low">
                <div className="w-24 h-24 bg-surface-container-highest rounded-full flex items-center justify-center mb-6 text-primary">
                  <span className="material-symbols-outlined text-5xl">forum</span>
                </div>
                <h2 className="text-2xl font-headline font-bold mb-2">Your Conversations</h2>
                <p className="text-on-surface-variant max-w-sm">Select a chat from the sidebar to start messaging, or find new matches to expand your network.</p>
                <Link to="/matches" className="mt-8 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  Explore Matches
                </Link>
              </div>
            )}
          </section>

          {/* Pane 3: Detail Panel (Visible only on large screens when a chat is selected) */}
          {selectedRoom && (
            <aside className="w-72 bg-surface-container-low border-l border-surface-container-high overflow-y-auto hidden xl:flex flex-col shrink-0">
              <div className="p-8 text-center space-y-4">
                <div className="w-32 h-32 rounded-full mx-auto bg-surface-container-highest ring-4 ring-surface-container-lowest shadow-xl flex items-center justify-center text-4xl font-bold text-primary">
                  {getOtherParticipant(selectedRoom)?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-headline font-extrabold text-xl">{getOtherParticipant(selectedRoom)?.username}</h3>
                  <p className="text-sm font-label text-on-surface-variant font-medium">SkillSwap Member</p>
                </div>

                {/* Example Skills Display */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <span className="px-3 py-1 bg-secondary/10 text-secondary-dim text-[10px] font-bold rounded-full uppercase truncate max-w-[120px]">Matched Skill</span>
                </div>
              </div>

              <div className="px-6 py-4 space-y-6 flex-1">
                {/* Session Stats */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl space-y-4 shadow-sm border border-surface-container-high">
                  <h4 className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Connection Info</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant">Started</span>
                      <span className="font-medium text-on-surface">
                        {new Date(selectedRoom.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3 pt-4">
                  <button onClick={() => navigate('/matches')} className="w-full py-3 bg-surface-container-lowest border border-surface-container-high text-on-surface text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-high transition-all">
                    <span className="material-symbols-outlined text-lg">person</span>
                    View Profile
                  </button>
                  <button className="w-full py-3 bg-error/5 text-error text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-error/10 transition-all">
                    <span className="material-symbols-outlined text-lg">block</span>
                    Report User
                  </button>
                </div>
              </div>
            </aside>
          )}
        </main>
      </div>
    </>
  );
};

export default Chat;
