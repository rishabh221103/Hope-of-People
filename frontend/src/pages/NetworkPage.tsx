import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  connectionService,
  ConnectedUser,
  ConnectionResponse,
} from '../services/connectionService';
import { ConnectButton } from '../components/ConnectButton';
import {
  Users,
  UserCheck,
  Clock,
  UserPlus,
  UserX,
  MessageSquare,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export const NetworkPage: React.FC = () => {

  const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'discover'>('connections');
  const [connections, setConnections] = useState<ConnectedUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ConnectionResponse[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectionResponse[]>([]);
  const [discoverPeople, setDiscoverPeople] = useState<ConnectedUser[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadNetworkData = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const [connData, incData, outData, discData] = await Promise.all([
        connectionService.getMyConnections(),
        connectionService.getPendingIncoming(),
        connectionService.getPendingOutgoing(),
        connectionService.getDiscoverPeople(),
      ]);

      setConnections(connData || []);
      setIncomingRequests(incData || []);
      setOutgoingRequests(outData || []);
      setDiscoverPeople(discData || []);
    } catch (err: any) {
      console.error('Failed to load network data', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load network data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetworkData();
  }, []);

  const handleAccept = async (req: ConnectionResponse) => {
    setActionLoadingId(req.id);
    try {
      await connectionService.acceptRequest(req.id);
      setStatusMessage({ type: 'success', text: `You are now connected with ${req.requesterName}!` });
      await loadNetworkData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to accept connection.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (req: ConnectionResponse) => {
    if (!window.confirm(`Decline connection request from ${req.requesterName}?`)) return;
    setActionLoadingId(req.id);
    try {
      await connectionService.rejectRequest(req.id);
      setStatusMessage({ type: 'success', text: `Connection request declined.` });
      await loadNetworkData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to decline request.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDisconnect = async (conn: ConnectedUser) => {
    if (!window.confirm(`Remove connection with ${conn.fullName}?`)) return;
    setActionLoadingId(conn.connectionId);
    try {
      await connectionService.disconnect(conn.connectionId);
      setStatusMessage({ type: 'success', text: `Removed connection with ${conn.fullName}.` });
      await loadNetworkData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to disconnect.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          color: '#ffffff',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.25)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.85rem', backdropFilter: 'blur(4px)' }}>
            <Users size={14} />
            <span>HOP Community Network</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
            Connections & Mutual Aid
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', maxWidth: '620px', lineHeight: 1.5 }}>
            Build trust within the HOP ecosystem. Connect directly with donors, grassroots organizers, and verified beneficiaries to stay informed, share updates, and provide direct support.
          </p>
        </div>

        <button
          onClick={loadNetworkData}
          disabled={loading}
          className="btn"
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.1rem',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: statusMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: statusMessage.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${statusMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            fontSize: '0.9rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-color, #e2e8f0)',
          marginBottom: '2rem',
          gap: '1rem',
        }}
      >
        <button
          onClick={() => setActiveTab('connections')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'connections' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'connections' ? '#2563eb' : 'var(--text-muted, #64748b)',
            fontWeight: activeTab === 'connections' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '-2px',
          }}
        >
          <UserCheck size={18} />
          <span>My Connections</span>
          <span
            style={{
              backgroundColor: activeTab === 'connections' ? '#dbeafe' : '#f1f5f9',
              color: activeTab === 'connections' ? '#1e40af' : '#64748b',
              padding: '0.15rem 0.55rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            {connections.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'requests' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'requests' ? '#2563eb' : 'var(--text-muted, #64748b)',
            fontWeight: activeTab === 'requests' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '-2px',
          }}
        >
          <Clock size={18} />
          <span>Pending Requests</span>
          {incomingRequests.length > 0 && (
            <span
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                padding: '0.15rem 0.55rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('discover')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'discover' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'discover' ? '#2563eb' : 'var(--text-muted, #64748b)',
            fontWeight: activeTab === 'discover' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '-2px',
          }}
        >
          <UserPlus size={18} />
          <span>Discover Community</span>
          <span
            style={{
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              padding: '0.15rem 0.55rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            {discoverPeople.length}
          </span>
        </button>
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: '#2563eb', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.95rem' }}>Loading network connections...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: MY CONNECTIONS */}
          {activeTab === 'connections' && (
            <div>
              {connections.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '16px',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <Users size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
                    No connections yet
                  </h3>
                  <p style={{ color: '#64748b', maxWidth: '440px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
                    Connect with other donors, organizers, and beneficiaries to stay in touch, follow assistance campaigns, and collaborate.
                  </p>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="btn btn-primary"
                    style={{ borderRadius: '9999px', padding: '0.55rem 1.35rem' }}
                  >
                    Find People to Connect
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                    gap: '1.25rem',
                  }}
                >
                  {connections.map((conn) => (
                    <div
                      key={conn.connectionId}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '14px',
                        padding: '1.35rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            border: '2px solid #bfdbfe',
                            flexShrink: 0,
                          }}
                        >
                          {conn.avatarUrl ? (
                            <img
                              src={conn.avatarUrl}
                              alt={conn.fullName}
                              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            conn.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conn.fullName}
                          </h4>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.15rem 0.55rem',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              marginTop: '0.25rem',
                              backgroundColor: conn.role?.includes('DONOR') ? '#ecfdf5' : '#eff6ff',
                              color: conn.role?.includes('DONOR') ? '#059669' : '#2563eb',
                            }}
                          >
                            {conn.role?.includes('DONOR') ? 'Verified Donor' : conn.role?.includes('ADMIN') ? 'HOP Admin' : 'Community Member'}
                          </span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          Connected {conn.connectedSince ? new Date(conn.connectedSince).toLocaleDateString() : 'Recently'}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link
                            to={`/messages?userId=${conn.userId}`}
                            className="btn btn-sm btn-primary"
                            style={{
                              borderRadius: '8px',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.78rem',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <MessageSquare size={13} />
                            <span>Message</span>
                          </Link>
                          <button
                            onClick={() => handleDisconnect(conn)}
                            disabled={actionLoadingId === conn.connectionId}
                            title="Remove connection"
                            className="btn btn-sm"
                            style={{
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <UserX size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PENDING REQUESTS */}
          {activeTab === 'requests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Incoming Requests */}
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={18} style={{ color: '#2563eb' }} />
                  <span>Incoming Requests ({incomingRequests.length})</span>
                </h3>

                {incomingRequests.length === 0 ? (
                  <div style={{ padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                    No incoming connection requests at this time.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {incomingRequests.map((req) => (
                      <div
                        key={req.id}
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          padding: '1.25rem',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '1.1rem',
                            }}
                          >
                            {req.requesterName?.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                              {req.requesterName}
                            </h4>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {req.requesterRole?.includes('DONOR') ? 'Donor' : 'Community Member'} • Sent {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.65rem' }}>
                          <button
                            onClick={() => handleAccept(req)}
                            disabled={actionLoadingId === req.id}
                            className="btn btn-primary btn-sm"
                            style={{
                              flex: 1,
                              backgroundColor: '#10b981',
                              borderColor: '#10b981',
                              borderRadius: '8px',
                              padding: '0.45rem',
                              fontWeight: 600,
                            }}
                          >
                            {actionLoadingId === req.id ? 'Accepting...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            disabled={actionLoadingId === req.id}
                            className="btn btn-secondary btn-sm"
                            style={{
                              flex: 1,
                              borderRadius: '8px',
                              padding: '0.45rem',
                              fontWeight: 600,
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing Requests */}
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} style={{ color: '#d97706' }} />
                  <span>Outgoing Requests Sent by You ({outgoingRequests.length})</span>
                </h3>

                {outgoingRequests.length === 0 ? (
                  <div style={{ padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                    You have no pending outgoing requests.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {outgoingRequests.map((req) => (
                      <div
                        key={req.id}
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          padding: '1.25rem',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: '#fffbeb',
                              color: '#d97706',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '1rem',
                              border: '1px solid #fef3c7',
                            }}
                          >
                            {req.receiverName?.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                              {req.receiverName}
                            </h4>
                            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 500 }}>
                              Requested on {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <ConnectButton
                          targetUserId={req.receiverId}
                          initialStatus="PENDING_OUTGOING"
                          initialConnectionId={req.id}
                          compact
                          onStatusChange={loadNetworkData}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DISCOVER COMMUNITY */}
          {activeTab === 'discover' && (
            <div>
              {discoverPeople.length === 0 ? (
                <div style={{ padding: '3rem', backgroundColor: '#f8fafc', borderRadius: '16px', textAlign: 'center', color: '#64748b' }}>
                  No other community members found at this time.
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.25rem',
                  }}
                >
                  {discoverPeople.map((person) => (
                    <div
                      key={person.userId}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '14px',
                        padding: '1.35rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            backgroundColor: '#f1f5f9',
                            color: '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            border: '1px solid #cbd5e1',
                            flexShrink: 0,
                          }}
                        >
                          {person.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {person.fullName}
                          </h4>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.12rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              marginTop: '0.2rem',
                              backgroundColor: person.role?.includes('DONOR') ? '#ecfdf5' : '#eff6ff',
                              color: person.role?.includes('DONOR') ? '#059669' : '#2563eb',
                            }}
                          >
                            {person.role?.includes('DONOR') ? 'Verified Donor' : person.role?.includes('ADMIN') ? 'HOP Admin' : 'Community Member'}
                          </span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <ConnectButton
                          targetUserId={person.userId}
                          targetUserName={person.fullName}
                          compact
                          onStatusChange={loadNetworkData}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
