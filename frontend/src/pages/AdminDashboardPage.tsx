import React, { useEffect, useState } from 'react';
import { adminService, AdminMetrics } from '../services/adminService';
import { AssistanceRequestItem } from '../services/assistanceService';
import { UserProfile } from '../services/userService';
import { Shield, CheckCircle, Users, DollarSign, FileText, RefreshCw } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [queue, setQueue] = useState<AssistanceRequestItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'METRICS' | 'QUEUE' | 'USERS'>('QUEUE');

  const [isLoading, setIsLoading] = useState(true);
  const [reviewModalRequest, setReviewModalRequest] = useState<AssistanceRequestItem | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [m, q, u] = await Promise.all([
        adminService.getMetrics(),
        adminService.getReviewQueue(),
        adminService.getAllUsers(0, 50),
      ]);
      setMetrics(m);
      setQueue(q);
      const userList = Array.isArray(u) ? u : (u as any).content || [];
      setUsers(userList);
    } catch (err: any) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalRequest) return;

    try {
      await adminService.reviewRequest(reviewModalRequest.id, {
        action: reviewAction,
        remarks: reviewRemarks || undefined,
      });
      setActionMessage({
        text: `Request #${reviewModalRequest.id} marked as ${reviewAction === 'APPROVE' ? 'APPROVED' : 'REJECTED'}.`,
        type: 'success',
      });
      setReviewModalRequest(null);
      setReviewRemarks('');
      loadAllAdminData();
    } catch (err: any) {
      setActionMessage({
        text: err?.message || 'Failed to review request.',
        type: 'error',
      });
    }
  };

  const handleStatusChange = async (userId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminService.updateUserStatus(userId, nextStatus as any);
      setActionMessage({
        text: `User #${userId} status changed to ${nextStatus}.`,
        type: 'success',
      });
      loadAllAdminData();
    } catch (err: any) {
      setActionMessage({
        text: err?.message || 'Failed to update user status.',
        type: 'error',
      });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={28} color="var(--primary)" /> Administrative Control Center
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Oversee assistance requests, moderate platform users, and monitor financial transparency
          </p>
        </div>
        <button onClick={loadAllAdminData} className="btn btn-outline btn-sm">
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {actionMessage && (
        <div className={`alert ${actionMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL USERS</span>
              <Users size={20} color="var(--primary)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{metrics.totalUsers}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {metrics.totalRequests} Total Applications
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>PENDING QUEUE</span>
              <FileText size={20} color="var(--warning)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--warning)' }}>
              {metrics.pendingRequests}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Awaiting admin review
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>FULFILLED / APPROVED</span>
              <CheckCircle size={20} color="var(--accent)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)' }}>
              {metrics.fulfilledRequests} / {metrics.approvedRequests}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {metrics.rejectedRequests} Rejected
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>FUNDS MOBILIZED</span>
              <DollarSign size={20} color="var(--primary)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
              ${(metrics.totalRaisedAmount || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Target: ${(metrics.totalTargetAmount || 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`btn ${activeTab === 'QUEUE' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          Verification Queue ({queue.length})
        </button>
        <button
          onClick={() => setActiveTab('USERS')}
          className={`btn ${activeTab === 'USERS' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          User Moderation ({users.length})
        </button>
      </div>

      {/* Verification Queue Tab */}
      {activeTab === 'QUEUE' && (
        <div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Loading review queue...</div>
          ) : queue.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <CheckCircle size={40} color="var(--accent)" style={{ margin: '0 auto 1rem' }} />
              <h3>All Caught Up!</h3>
              <p style={{ color: 'var(--text-muted)' }}>There are no assistance requests pending review.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Initiative Details</th>
                    <th>Applicant</th>
                    <th>Target Amount</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((req) => (
                    <tr key={req.id}>
                      <td>#{req.id}</td>
                      <td>
                        <strong>{req.title}</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Category: {req.category}
                        </div>
                      </td>
                      <td>
                        <div>{req.userFullName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.userEmail}</div>
                      </td>
                      <td>${req.targetAmount.toLocaleString()}</td>
                      <td>
                        <span className={`badge badge-${req.priority.toLowerCase()}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${req.status.toLowerCase()}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setReviewModalRequest(req);
                            setReviewAction('APPROVE');
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* User Moderation Tab */}
      {activeTab === 'USERS' && (
        <div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Loading users...</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td><strong>{u.firstName} {u.lastName}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {u.roles?.map((r) => (
                            <span key={r} className="badge badge-pending" style={{ fontSize: '0.7rem' }}>
                              {r.replace('ROLE_', '')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.status === 'ACTIVE' ? 'badge-active' : 'badge-suspended'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleStatusChange(u.id, u.status)}
                          className={`btn btn-sm ${u.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalRequest && (
        <div className="modal-backdrop" onClick={() => setReviewModalRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Review Assistance Application #{reviewModalRequest.id}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              <strong>{reviewModalRequest.title}</strong> by {reviewModalRequest.userFullName} (${reviewModalRequest.targetAmount.toLocaleString()})
            </p>

            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label className="form-label">Review Decision</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="decision"
                      checked={reviewAction === 'APPROVE'}
                      onChange={() => setReviewAction('APPROVE')}
                    />
                    <strong style={{ color: 'var(--accent)' }}>Approve for Funding</strong>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="decision"
                      checked={reviewAction === 'REJECT'}
                      onChange={() => setReviewAction('REJECT')}
                    />
                    <strong style={{ color: 'var(--danger)' }}>Reject Application</strong>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Administrative Remarks & Feedback</label>
                <textarea
                  rows={3}
                  required={reviewAction === 'REJECT'}
                  placeholder={reviewAction === 'APPROVE' ? 'Optional verification approval notes...' : 'Required: Reason for rejecting application...'}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setReviewModalRequest(null)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${reviewAction === 'APPROVE' ? 'btn-success' : 'btn-danger'}`}
                  style={{ flex: 2 }}
                >
                  Confirm {reviewAction === 'APPROVE' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
