import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBell } from 'react-icons/fi';
import { API_ENDPOINTS } from '../config/api';
import '../styles/NotificationBell.css';

const NotificationBell = ({ socket }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const user = JSON.parse(localStorage.getItem('user'));
    if (socket && user) {
      socket.emit('join-notifications', user._id);
      socket.on('new-notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
    }
    return () => socket?.off('new-notification');
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(API_ENDPOINTS.NOTIFICATIONS.LIST, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(API_ENDPOINTS.NOTIFICATIONS.READ(id), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  return (
    <div className="notification-bell">
      <button onClick={() => setShowDropdown(!showDropdown)} className="bell-btn">
        <FiBell size={20} />
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
      {showDropdown && (
        <div className="notification-dropdown">
          <h4>Notifications</h4>
          {notifications.length === 0 ? (
            <p className="no-notifications">No notifications</p>
          ) : (
            notifications.slice(0, 10).map(n => (
              <div key={n._id} className={`notification-item ${n.read ? 'read' : 'unread'}`} onClick={() => markAsRead(n._id)}>
                <strong>{n.title}</strong>
                <p>{n.body}</p>
                <small>{new Date(n.createdAt).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
