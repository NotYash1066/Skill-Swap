import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from '../lib/motion';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import useSocket from '../hooks/useSocket';
import Whiteboard from '../components/collaboration/Whiteboard';
import Navbar from '../components/common/Navbar';

const Chat = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
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
      if (response.data.length > 0 && !selectedRoom) {
        setSelectedRoom(response.data[0]);
      }
      setLoading(false);
    } catch (err) {
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
    } catch (err) {}
  };

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || sendingMessage) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(API_ENDPOINTS.CHAT.MESSAGES(selectedRoom._id), {
        content: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      socketSendMessage(selectedRoom._id, newMessage, currentUserId);
      setNewMessage('');
      stopTyping(selectedRoom._id, currentUserId);
    } catch (err) {
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (selectedRoom && currentUserId) {
      startTyping(selectedRoom._id, currentUserId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => stopTyping(selectedRoom._id, currentUserId), 2000);
    }
  };

  const getOtherParticipant = (room) => {
    return room.participants.find(p => p._id !== currentUserId);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startVideoCall = () => {
    if (!selectedRoom) return;
    const other = getOtherParticipant(selectedRoom);
    window.dispatchEvent(new CustomEvent('global-video-call-initiate', { 
      detail: { targetUserId: other._id, targetUserName: other.username } 
    }));
  };

  const otherParticipant = selectedRoom ? getOtherParticipant(selectedRoom) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
        <p className="ml-4 font-headline font-bold text-on-surface">Opening your messages...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface font-body text-on-surface h-screen flex flex-col overflow-hidden">
      <Navbar />
      
      <main className="flex flex-1 overflow-hidden">
        {/* Pane 1: Conversation Sidebar */}
        <aside className="w-80 flex flex-col bg-surface-container-low border-r border-transparent">
          <div className="p-6">
            <h1 className="font-headline text-2xl font-extrabold tracking-tight mb-4">Messages</h1>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input 
                className="w-full bg-surface-container-highest border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-all placeholder:text-on-surface-variant/60 text-on-surface" 
                placeholder="Search conversations..." 
                type="text"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
            {chatRooms.map(room => {
              const other = getOtherParticipant(room);
              const isActive = selectedRoom?._id === room._id;
              return (
                <div 
                  key={room._id} 
                  className={`p-3 rounded-xl flex gap-3 items-center cursor-pointer transition-all duration-200 ${isActive ? 'bg-surface-container-lowest shadow-sm' : 'hover:bg-surface-container-high'}`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <div className="relative">
                    <img 
                      className="w-12 h-12 rounded-full object-cover" 
                      src={other?.avatar || `https://ui-avatars.com/api/?name=${other?.username}`} 
                      alt={other?.username} 
                    />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-secondary border-2 border-surface-container-lowest rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-sm truncate text-on-surface">{other?.username}</h3>
                      {isActive ? (
                        <span className="text-[10px] font-label font-bold text-primary uppercase">Active</span>
                      ) : (
                        <span className="text-[10px] font-label font-semibold text-on-surface-variant">2H AGO</span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">{room.lastMessage?.content || 'Start a conversation...'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Pane 2: Main Chat Window */}
        <section className="flex-1 flex flex-col bg-surface-container-lowest relative">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <header className="h-20 px-8 flex items-center justify-between border-b border-surface-container-low">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3 overflow-hidden p-1">
                    <img 
                      className="inline-block h-10 w-10 rounded-full ring-2 ring-surface-container-lowest object-cover" 
                      src={otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${otherParticipant?.username}`} 
                      alt={otherParticipant?.username} 
                    />
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center ring-2 ring-surface-container-lowest text-on-primary font-bold text-xs uppercase">
                      {otherParticipant?.username.slice(0, 2)}
                    </div>
                  </div>
                  <div>
                    <h2 className="font-headline font-bold text-lg text-on-surface">{otherParticipant?.username}</h2>
                    <span className="flex items-center gap-1.5 text-xs font-label text-secondary font-semibold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                      Online
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-primary rounded-lg font-label text-xs font-bold hover:bg-primary hover:text-on-primary transition-all duration-300"
                    onClick={startVideoCall}
                    title="Start video call"
                  >
                    <span className="material-symbols-outlined text-lg">videocam</span>
                    START CALL
                  </button>
                  <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
              </header>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                <div className="flex justify-center">
                  <span className="px-4 py-1 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Today</span>
                </div>

                {messages.map(msg => {
                  const isSent = msg.sender._id === currentUserId;
                  return (
                    <div key={msg._id} className={`flex items-end gap-3 max-w-[80%] ${isSent ? 'ml-auto flex-row-reverse' : ''}`}>
                      {!isSent && (
                        <img 
                          className="w-8 h-8 rounded-full object-cover" 
                          src={otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${otherParticipant?.username}`} 
                          alt="" 
                        />
                      )}
                      <div className={`p-4 rounded-2xl ${isSent ? 'bg-primary text-on-primary rounded-br-none shadow-lg shadow-primary/10' : 'bg-surface-container-low text-on-surface rounded-bl-none'}`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <span className={`text-[10px] font-label mt-2 block ${isSent ? 'text-on-primary/70 text-right' : 'text-on-surface-variant'}`}>
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {typingUsers.length > 0 && (
                  <div className="text-xs text-on-surface-variant font-medium animate-pulse">
                    {typingUsers[0]} is typing...
                  </div>
                )}
                
                {/* Whiteboard Invite Message */}
                <div className="flex items-end gap-3 max-w-[80%]">
                  <img 
                    className="w-8 h-8 rounded-full object-cover" 
                    src={otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${otherParticipant?.username}`} 
                    alt="" 
                  />
                  <div className="space-y-3">
                    <div className="bg-surface-container-high/50 p-4 rounded-xl flex items-center gap-4 border border-surface-container-highest">
                      <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                        <span className="material-symbols-outlined">draw</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-tight text-on-surface">Interactive Whiteboard</p>
                        <p className="text-[10px] text-on-surface-variant font-medium">Elena started a session</p>
                      </div>
                      <button 
                        className="bg-secondary text-on-secondary px-3 py-1.5 rounded-lg text-xs font-bold hover:shadow-md transition-all"
                        onClick={() => setShowWhiteboard(true)}
                      >
                        JOIN
                      </button>
                    </div>
                  </div>
                </div>

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <footer className="p-6 bg-surface-container-lowest">
                <div className="bg-surface-container-high rounded-2xl p-2 shadow-sm border border-surface-container-highest">
                  <div className="flex gap-1 px-2 py-1 border-b border-surface-container-highest mb-2">
                    <button className="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant transition-colors"><span className="material-symbols-outlined text-sm">format_bold</span></button>
                    <button className="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant transition-colors"><span className="material-symbols-outlined text-sm">format_italic</span></button>
                    <button className="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant transition-colors"><span className="material-symbols-outlined text-sm">link</span></button>
                    <button className="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant transition-colors"><span className="material-symbols-outlined text-sm">image</span></button>
                    <div className="w-px h-4 bg-surface-variant self-center mx-1"></div>
                    <button className="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant transition-colors"><span className="material-symbols-outlined text-sm">sentiment_satisfied</span></button>
                  </div>
                  <div className="flex items-end gap-2 p-2">
                    <textarea 
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none py-1 placeholder:text-on-surface-variant/50 text-on-surface" 
                      placeholder="Type your message..." 
                      rows="1"
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
                    ></textarea>
                    <button 
                      className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
                      onClick={sendMessage}
                      disabled={sendingMessage || !newMessage.trim()}
                    >
                      <span className="material-symbols-outlined text-lg">send</span>
                    </button>
                  </div>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant p-8 text-center">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-20">forum</span>
              <h2 className="text-xl font-bold mb-2">Your Studio Conversations</h2>
              <p className="max-w-xs font-medium">Select a peer from the list to start swapping knowledge and ideas.</p>
            </div>
          )}
        </section>

        {/* Pane 3: Detail Panel */}
        {selectedRoom && (
          <aside className="w-72 bg-surface-container-low border-l border-transparent overflow-y-auto hidden lg:flex flex-col custom-scrollbar">
            <div className="p-8 text-center space-y-4">
              <div className="relative inline-block group">
                <img 
                  className="w-32 h-32 rounded-full mx-auto object-cover ring-4 ring-surface-container-lowest shadow-xl" 
                  src={otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${otherParticipant?.username}`} 
                  alt={otherParticipant?.username} 
                />
                <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold uppercase tracking-widest">View Profile</span>
                </div>
              </div>
              <div>
                <h3 className="font-headline font-extrabold text-xl text-on-surface">{otherParticipant?.username}</h3>
                <p className="text-sm font-label text-on-surface-variant font-medium">UI/UX Design Student</p>
              </div>
              <div className="flex justify-center gap-2">
                <span className="px-3 py-1 bg-secondary/10 text-secondary-dim text-[10px] font-bold rounded-full uppercase">React</span>
                <span className="px-3 py-1 bg-primary/10 text-primary-dim text-[10px] font-bold rounded-full uppercase">Figma</span>
              </div>
            </div>

            <div className="px-6 py-4 space-y-6">
              <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm space-y-4">
                <h4 className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Session Summary</h4>
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <span className="block text-xl font-black text-primary">12</span>
                    <span className="text-[9px] font-label font-bold text-on-surface-variant uppercase">Swaps</span>
                  </div>
                  <div className="w-px h-8 bg-surface-container-high"></div>
                  <div className="text-center flex-1">
                    <span className="block text-xl font-black text-secondary">4.9</span>
                    <span className="text-[9px] font-label font-bold text-on-surface-variant uppercase">Rating</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Shared Assets</h4>
                  <button className="text-[10px] font-bold text-primary hover:underline">SEE ALL</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map(i => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-surface-container-high group relative border border-surface-container-highest">
                      <img className="w-full h-full object-cover transition-transform group-hover:scale-110" src={`https://picsum.photos/seed/${i + 10}/200`} alt="" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="material-symbols-outlined text-white text-sm">visibility</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button className="w-full py-3 bg-surface-container-highest text-on-surface text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-error/10 hover:text-error transition-all">
                  <span className="material-symbols-outlined text-lg">block</span>
                  Report Session
                </button>
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto bg-surface-container-low border-none flex flex-col md:flex-row justify-between items-center px-8 py-4 gap-4 shrink-0">
        <span className="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">© 2024 SkillSwap. The Kinetic Studio.</span>
        <div className="flex gap-6 font-label text-[10px] font-semibold uppercase tracking-widest">
          <a className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Terms of Service</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Help Center</a>
        </div>
      </footer>

      <AnimatePresence>
        {showWhiteboard && selectedRoom && socket && (
          <Whiteboard 
            socket={socket}
            roomId={selectedRoom._id}
            onClose={() => setShowWhiteboard(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
