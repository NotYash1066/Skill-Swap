import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useSocket from '../hooks/useSocket';
import '../styles/Chat.css';

const Chat = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();
  
  // Helper function to get current user ID from token
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
  const { sendMessage: socketSendMessage, onNewMessage, onUserTyping, onUserStopTyping, startTyping, stopTyping, offNewMessage, offUserTyping } = useSocket(currentUserId);

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
    // Set up socket event listeners
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
      const response = await axios.get('http://localhost:5000/api/chat/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Chat rooms fetched:', response.data);
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
      const response = await axios.get(`http://localhost:5000/api/chat/rooms/${roomId}/messages`, {
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
      const response = await axios.post(`http://localhost:5000/api/chat/rooms/${selectedRoom._id}/messages`, {
        content: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Send via socket for real-time delivery
      socketSendMessage(selectedRoom._id, newMessage, currentUserId);

      setNewMessage('');
      stopTyping(selectedRoom._id, currentUserId);
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
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
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
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="loading">Loading chats...</div>
      </div>
    );
  }

  if (chatRooms.length === 0) {
    return (
      <div className="chat-container">
        <div className="no-chats">
          <h2>No Active Chats</h2>
          <p>You don't have any active conversations yet.</p>
          <button onClick={() => navigate('/matches')} className="btn-primary">
            Find Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>Messages</h2>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Back
          </button>
        </div>
        
        <div className="chat-rooms-list">
          {chatRooms.map(room => {
            const otherParticipant = getOtherParticipant(room);
            return (
              <div
                key={room._id}
                className={`chat-room-item ${selectedRoom?._id === room._id ? 'active' : ''}`}
                onClick={() => setSelectedRoom(room)}
              >
                <div className="room-avatar">
                  {otherParticipant?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="room-info">
                  <div className="chat-room-name">{otherParticipant?.username}</div>
                  <div className="chat-room-last-message">
                    {room.lastMessage?.content || 'Start a conversation...'}
                  </div>
                </div>
                <div className="room-time">
                  {room.lastActivity && formatMessageTime(room.lastActivity)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="chat-main">
        {selectedRoom ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="user-avatar">
                  {getOtherParticipant(selectedRoom)?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <h3>{getOtherParticipant(selectedRoom)?.username}</h3>
                  <p className="user-email">{getOtherParticipant(selectedRoom)?.email}</p>
                </div>
              </div>
            </div>

            <div className="chat-messages">
              <div className="messages-list">
                {messages.map(message => (
                  <div
                    key={message._id}
                    className={`message ${message.sender._id === currentUserId ? 'own' : 'other'}`}
                  >
                    <div className={`message-bubble ${message.sender._id === currentUserId ? 'sent' : 'received'}`}>
                      {message.content}
                    </div>
                    <div className="message-time">
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                ))}
                
                {typingUsers.length > 0 && (
                  <div className="typing-indicator">
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="message-input-container">
              <form onSubmit={sendMessage} className="message-form">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="message-input"
                  disabled={sendingMessage}
                />
                <button 
                  type="submit" 
                  className="send-button"
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  {sendingMessage ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <h3>Select a conversation</h3>
            <p>Choose a chat room from the sidebar to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
