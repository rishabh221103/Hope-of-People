import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Users,
  MessageSquare,
  Heart,
  DollarSign,
  CheckCircle,
  Briefcase,
  Check,
  Trash2,
  Filter,
} from 'lucide-react';
import { notificationService, NotificationItem } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

export const NotificationsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'SOCIAL' | 'FINANCIAL'>('ALL');
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getRecentNotifications();
      setNotifications(data || []);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadNotifications();
  }, [isAuthenticated, navigate]);

  const handleMarkRead = async (item: NotificationItem) => {
    if (!item.isRead) {
      await notificationService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }
    if (item.actionUrl) {
      navigate(item.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDelete = async (id: number) => {
    await notificationService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = notifications.filter((item) => {
    if (filter === 'UNREAD') return !item.isRead;
    if (filter === 'SOCIAL') {
      return (
        item.type === 'CONNECTION_REQUEST' ||
        item.type === 'CONNECTION_ACCEPTED' ||
        item.type === 'DIRECT_MESSAGE'
      );
    }
    if (filter === 'FINANCIAL') {
      return (
        item.type === 'DONATION_RECEIVED' ||
        item.type === 'CAMPAIGN_FUNDED' ||
        item.type === 'REQUEST_APPROVED'
      );
    }
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CONNECTION_REQUEST':
      case 'CONNECTION_ACCEPTED':
        return <Users size={18} color="#8b5cf6" />;
      case 'DIRECT_MESSAGE':
        return <MessageSquare size={18} color="#3b82f6" />;
      case 'DONATION_RECEIVED':
        return <Heart size={18} color="#ef4444" />;
      case 'CAMPAIGN_FUNDED':
        return <Briefcase size={18} color="#10b981" />;
      case 'REQUEST_APPROVED':
        return <CheckCircle size={18} color="#059669" />;
      default:
        return <DollarSign size={18} color="#6366f1" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ minHeight: '80vh', backgroundColor: '#f8fafc', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Page Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  padding: '0.5rem',
                  borderRadius: '10px',
                  display: 'flex',
                }}
              >
                <Bell size={24} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                  Notification Center
                </h1>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Real-time activity alerts, connection requests, and contribution updates.
                </p>
              </div>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
            >
              <Check size={14} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginRight: '0.25rem' }}>
            <Filter size={14} /> Filter:
          </span>
          <button
            onClick={() => setFilter('ALL')}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              border: '1px solid',
              borderColor: filter === 'ALL' ? '#2563eb' : '#e2e8f0',
              backgroundColor: filter === 'ALL' ? '#eff6ff' : '#ffffff',
              color: filter === 'ALL' ? '#2563eb' : '#475569',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              border: '1px solid',
              borderColor: filter === 'UNREAD' ? '#dc2626' : '#e2e8f0',
              backgroundColor: filter === 'UNREAD' ? '#fef2f2' : '#ffffff',
              color: filter === 'UNREAD' ? '#dc2626' : '#475569',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('SOCIAL')}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              border: '1px solid',
              borderColor: filter === 'SOCIAL' ? '#8b5cf6' : '#e2e8f0',
              backgroundColor: filter === 'SOCIAL' ? '#f5f3ff' : '#ffffff',
              color: filter === 'SOCIAL' ? '#8b5cf6' : '#475569',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Network & Chat
          </button>
          <button
            onClick={() => setFilter('FINANCIAL')}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              border: '1px solid',
              borderColor: filter === 'FINANCIAL' ? '#10b981' : '#e2e8f0',
              backgroundColor: filter === 'FINANCIAL' ? '#ecfdf5' : '#ffffff',
              color: filter === 'FINANCIAL' ? '#059669' : '#475569',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Donations & Micro-Grants
          </button>
        </div>

        {/* Notifications List Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
              Loading notifications...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
              <Bell size={40} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#334155' }}>
                No notifications in this view
              </h3>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                You are all caught up! As actions happen on HOP, alerts will stream here.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkRead(item)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.1rem 1.25rem',
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: item.isRead ? '#ffffff' : '#f0fdf4',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = item.isRead ? '#f8fafc' : '#dcfce7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = item.isRead ? '#ffffff' : '#f0fdf4';
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    padding: '0.6rem',
                    borderRadius: '10px',
                    backgroundColor: item.isRead ? '#f1f5f9' : '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getNotificationIcon(item.type)}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '0.95rem',
                          fontWeight: item.isRead ? 600 : 700,
                          color: '#0f172a',
                        }}
                      >
                        {item.title}
                      </h3>
                      {!item.isRead && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '9999px',
                            backgroundColor: '#10b981',
                            display: 'inline-block',
                          }}
                        />
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '0.35rem 0 0',
                      fontSize: '0.85rem',
                      color: '#475569',
                      lineHeight: 1.45,
                    }}
                  >
                    {item.message}
                  </p>

                  {item.actionUrl && (
                    <div style={{ marginTop: '0.45rem' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: '#2563eb',
                        }}
                      >
                        Click to view details &rarr;
                      </span>
                    </div>
                  )}
                </div>

                {/* Dismiss */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  title="Delete notification"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0.35rem',
                    borderRadius: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.backgroundColor = '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
