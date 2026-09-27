import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { notificationService } from '../../services/notificationService.js';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  RotateCcw,
  Users,
  CheckSquare,
  Check,
  X
} from 'lucide-react';

export function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { subscribe } = useSocket();
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ limit: 15 });
      setNotifications(res?.notifications || []);
      setUnreadCount(res?.unreadCount || 0);
    } catch (err) {
      console.warn('Could not load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [loadNotifications, user]);

  // Real-time listener for incoming in-app notifications
  useEffect(() => {
    const unsub = subscribe('notification:new', (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    const handleOnline = () => loadNotifications();
    window.addEventListener('online', handleOnline);

    return () => {
      unsub?.();
      window.removeEventListener('online', handleOnline);
    };
  }, [subscribe, loadNotifications]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id, link) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (link) {
        setIsOpen(false);
        navigate(link);
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <CheckSquare size={16} color="var(--accent-cyan)" />;
      case 'TASK_COMPLETED':
        return <CheckCircle2 size={16} color="var(--accent-emerald)" />;
      case 'TASK_MISSED':
        return <AlertTriangle size={16} color="var(--accent-rose)" />;
      case 'EXPENSE_ADDED':
        return <Receipt size={16} color="var(--accent-amber)" />;
      case 'EXPENSE_REVERSED':
        return <RotateCcw size={16} color="var(--accent-rose)" />;
      case 'INVITE_RECEIVED':
        return <Users size={16} color="var(--accent-teal)" />;
      default:
        return <Bell size={16} color="var(--accent-cyan)" />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={drawerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm"
        style={{
          position: 'relative',
          padding: '0.5rem',
          minWidth: '40px',
          minHeight: '40px'
        }}
        title="Notifications"
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'var(--accent-rose)',
            color: '#ffffff',
            fontSize: '0.65rem',
            fontWeight: '800',
            borderRadius: 'var(--radius-full)',
            minWidth: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 2px 5px rgba(244, 63, 94, 0.5)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '340px',
          maxWidth: '90vw',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-hover)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          overflow: 'hidden',
          animation: 'fadeIn 150ms ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '0.85rem 1rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: '700', fontSize: '0.925rem' }}>Notifications</span>
              {unreadCount > 0 && (
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  style={{
                    background: 'transparent',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                  title="Mark all as read"
                >
                  <Check size={13} />
                  Mark all
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', color: 'var(--text-muted)' }}
                aria-label="Close notifications"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Loading updates...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Bell size={28} style={{ opacity: 0.3, margin: '0 auto 0.75rem auto' }} />
                <p>No notifications yet</p>
                <span style={{ fontSize: '0.75rem' }}>You're all caught up on care team events</span>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  onClick={() => handleMarkAsRead(notif._id, notif.link)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: notif.read ? 'transparent' : 'rgba(56, 189, 248, 0.05)',
                    cursor: notif.link ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    transition: 'background var(--transition-fast)'
                  }}
                >
                  <div style={{
                    marginTop: '2px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getIcon(notif.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.825rem',
                        fontWeight: notif.read ? '600' : '700',
                        color: notif.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--accent-cyan)',
                          flexShrink: 0
                        }}></span>
                      )}
                    </div>
                    <p style={{
                      fontSize: '0.775rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.2rem',
                      lineHeight: '1.4'
                    }}>
                      {notif.message}
                    </p>
                    <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
