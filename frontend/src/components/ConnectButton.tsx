import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { connectionService, ConnectionStatusResponse } from '../services/connectionService';
import { UserPlus, Check, Clock, UserCheck, Loader2 } from 'lucide-react';

interface ConnectButtonProps {
  targetUserId: number;
  targetUserName?: string;
  compact?: boolean;
  className?: string;
  initialStatus?: ConnectionStatusResponse['status'];
  initialConnectionId?: number | null;
  onStatusChange?: (status: ConnectionStatusResponse['status']) => void;
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
  targetUserId,
  targetUserName,
  compact = false,
  className = '',
  initialStatus,
  initialConnectionId,
  onStatusChange,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<ConnectionStatusResponse['status']>(initialStatus || 'NONE');
  const [connectionId, setConnectionId] = useState<number | null>(initialConnectionId || null);
  const [loading, setLoading] = useState<boolean>(!initialStatus);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);

  // If user is viewing their own card/profile, don't show connect button
  const isSelf = user?.userId === targetUserId || status === 'SELF';

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated || !targetUserId || targetUserId === user?.userId) {
      setLoading(false);
      if (targetUserId === user?.userId) {
        setStatus('SELF');
      }
      return;
    }

    if (!initialStatus) {
      connectionService
        .getStatus(targetUserId)
        .then((res) => {
          if (isMounted) {
            setStatus(res.status);
            if (res.connectionId) {
              setConnectionId(res.connectionId);
            }
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [targetUserId, isAuthenticated, user?.userId, initialStatus]);

  if (isSelf) {
    return null;
  }

  const handleConnectClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setActionInProgress(true);
    try {
      if (status === 'NONE' || status === 'REJECTED') {
        const res = await connectionService.sendRequest(targetUserId);
        setStatus(res.status === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING_OUTGOING');
        setConnectionId(res.id);
        onStatusChange?.(res.status === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING_OUTGOING');
      } else if (status === 'PENDING_INCOMING' && connectionId) {
        await connectionService.acceptRequest(connectionId);
        setStatus('ACCEPTED');
        onStatusChange?.('ACCEPTED');
      } else if (status === 'PENDING_OUTGOING' && connectionId) {
        // Cancel request
        await connectionService.disconnect(connectionId);
        setStatus('NONE');
        setConnectionId(null);
        onStatusChange?.('NONE');
      }
    } catch (err: any) {
      console.error('Failed to update connection status', err);
      alert(err.message || 'Action failed. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className={`btn btn-secondary ${compact ? 'btn-sm' : ''} ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          opacity: 0.6,
          padding: compact ? '0.25rem 0.6rem' : undefined,
          fontSize: compact ? '0.78rem' : undefined,
        }}
      >
        <Loader2 size={compact ? 12 : 14} className="animate-spin" />
        <span>Loading...</span>
      </button>
    );
  }

  const isConnected = status === 'ACCEPTED' || status === 'CONNECTED';
  const isOutgoing = status === 'PENDING_OUTGOING' || status === 'PENDING_SENT';
  const isIncoming = status === 'PENDING_INCOMING' || status === 'PENDING_RECEIVED';

  // State: Connected
  if (isConnected) {
    return (
      <button
        disabled
        title={targetUserName ? `Connected with ${targetUserName}` : 'Connected'}
        className={`btn ${compact ? 'btn-sm' : ''} ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          backgroundColor: '#ecfdf5',
          color: '#059669',
          border: '1px solid #a7f3d0',
          cursor: 'default',
          padding: compact ? '0.25rem 0.6rem' : '0.4rem 0.85rem',
          fontSize: compact ? '0.78rem' : '0.85rem',
          fontWeight: 600,
          borderRadius: '9999px',
        }}
      >
        <Check size={compact ? 12 : 15} />
        <span>Connected</span>
      </button>
    );
  }

  // State: Request Pending (Sent by Current User)
  if (isOutgoing) {
    return (
      <button
        onClick={handleConnectClick}
        disabled={actionInProgress}
        title="Click to cancel connection request"
        className={`btn ${compact ? 'btn-sm' : ''} ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          backgroundColor: '#fffbeb',
          color: '#d97706',
          border: '1px solid #fde68a',
          cursor: 'pointer',
          padding: compact ? '0.25rem 0.6rem' : '0.4rem 0.85rem',
          fontSize: compact ? '0.78rem' : '0.85rem',
          fontWeight: 600,
          borderRadius: '9999px',
          transition: 'all 0.15s ease',
        }}
      >
        {actionInProgress ? (
          <Loader2 size={compact ? 12 : 14} className="animate-spin" />
        ) : (
          <Clock size={compact ? 12 : 14} />
        )}
        <span>Requested</span>
      </button>
    );
  }

  // State: Request Received (Awaiting Current User's Acceptance)
  if (isIncoming) {
    return (
      <button
        onClick={handleConnectClick}
        disabled={actionInProgress}
        title="Accept Connection Request"
        className={`btn btn-primary ${compact ? 'btn-sm' : ''} ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          color: '#ffffff',
          cursor: 'pointer',
          padding: compact ? '0.25rem 0.6rem' : '0.4rem 0.85rem',
          fontSize: compact ? '0.78rem' : '0.85rem',
          fontWeight: 600,
          borderRadius: '9999px',
          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
        }}
      >
        {actionInProgress ? (
          <Loader2 size={compact ? 12 : 14} className="animate-spin" />
        ) : (
          <UserCheck size={compact ? 12 : 14} />
        )}
        <span>Accept Request</span>
      </button>
    );
  }

  // State: None or Rejected (Can send connection request)
  return (
    <button
      onClick={handleConnectClick}
      disabled={actionInProgress}
      title={targetUserName ? `Connect with ${targetUserName}` : 'Connect'}
      className={`btn btn-primary ${compact ? 'btn-sm' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: compact ? '0.25rem 0.65rem' : '0.4rem 0.85rem',
        fontSize: compact ? '0.78rem' : '0.85rem',
        fontWeight: 600,
        borderRadius: '9999px',
        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
        transition: 'all 0.15s ease',
      }}
    >
      {actionInProgress ? (
        <Loader2 size={compact ? 12 : 14} className="animate-spin" />
      ) : (
        <UserPlus size={compact ? 12 : 14} />
      )}
      <span>Connect</span>
    </button>
  );
};
