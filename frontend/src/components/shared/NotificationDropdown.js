import React, { useState, useEffect, useCallback, useRef } from 'react';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const [notifRes, countRes] = await Promise.all([
        fetch(`${API_URL}/notifications?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/notifications/count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (notifRes.ok) {
        const data = await notifRes.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      }

      if (countRes.ok) {
        const countData = await countRes.json();
        if (countData.success) {
          setUnreadCount(countData.unreadCount || countData.count || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const deleted = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (deleted && !deleted.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Clear all read notifications
  const clearReadNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/notifications/clear-read`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setNotifications(prev => prev.filter(n => !n.is_read));
      }
    } catch (error) {
      console.error('Error clearing read notifications:', error);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    const icons = {
      'message': 'ri-message-3-line',
      'group_message': 'ri-group-line',
      'circular': 'ri-megaphone-line',
      'approval_request': 'ri-shield-check-line',
      'approval_response': 'ri-checkbox-circle-line',
      'document_received': 'ri-file-received-line',
      'document_shared': 'ri-share-line',
      'document_generated': 'ri-file-add-line',
      'system': 'ri-notification-3-line'
    };
    return icons[type] || 'ri-notification-3-line';
  };

  // Get notification color
  const getNotificationColor = (type) => {
    const colors = {
      'message': { bg: '#e0e7ff', text: '#3730a3' },
      'group_message': { bg: '#e0e7ff', text: '#3730a3' },
      'circular': { bg: '#fef3c7', text: '#92400e' },
      'approval_request': { bg: '#fef3c7', text: '#92400e' },
      'approval_response': { bg: '#d1fae5', text: '#065f46' },
      'document_received': { bg: '#dbeafe', text: '#1e40af' },
      'document_shared': { bg: '#e0e7ff', text: '#3730a3' },
      'document_generated': { bg: '#d1fae5', text: '#065f46' },
      'system': { bg: '#f3f4f6', text: '#374151' }
    };
    return colors[type] || { bg: '#f3f4f6', text: '#374151' };
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="notification-dropdown-wrapper" ref={dropdownRef}>
      <button 
        className={`icon-btn notification-trigger ${unreadCount > 0 ? 'has-alert' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
      >
        <i className="ri-notification-3-line"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button className="notif-action-btn" onClick={markAllAsRead} title="Mark all as read">
                  <i className="ri-check-double-line"></i>
                </button>
              )}
              <button className="notif-action-btn" onClick={clearReadNotifications} title="Clear read">
                <i className="ri-delete-bin-line"></i>
              </button>
              <button className="notif-action-btn" onClick={fetchNotifications} title="Refresh">
                <i className="ri-refresh-line"></i>
              </button>
            </div>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">
                <i className="ri-loader-4-line spin"></i>
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <i className="ri-notification-off-line"></i>
                <span>No notifications</span>
              </div>
            ) : (
              notifications.map((notification) => {
                const color = getNotificationColor(notification.type);
                return (
                  <div 
                    key={notification.id}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div 
                      className="notification-icon"
                      style={{ backgroundColor: color.bg, color: color.text }}
                    >
                      <i className={getNotificationIcon(notification.type)}></i>
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{formatTimeAgo(notification.created_at)}</div>
                    </div>
                    <button 
                      className="notification-delete"
                      onClick={(e) => deleteNotification(notification.id, e)}
                      title="Delete"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                    {!notification.is_read && <div className="unread-dot"></div>}
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button className="view-all-btn">
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
