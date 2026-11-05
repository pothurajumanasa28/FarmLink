import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { Users, Check, X, ShieldAlert, RotateCcw, Search, Eye, RefreshCw } from 'lucide-react';

export default function UserApprovals() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Modals state
  const [viewUser, setViewUser] = useState(null);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      let query = `/api/admin/users?`;
      if (statusFilter) query += `status=${statusFilter}&`;
      if (roleFilter) query += `role=${roleFilter}&`;
      if (search) query += `search=${encodeURIComponent(search.trim())}&`;
      if (locationFilter) query += `location=${encodeURIComponent(locationFilter.trim())}&`;

      const res = await apiRequest(query);
      if (res.success) {
        setUsers(res.users || []);
      } else {
        setError(res.message || 'Failed to load user accounts.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [statusFilter, roleFilter]);

  const handleApprove = async (user) => {
    setActionLoading(true);
    try {
      await apiRequest(`/api/admin/users/${user._id}/approve`, { method: 'PATCH' });
      await loadUsers();
    } catch (err) {
      alert(err.message || 'Error approving account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setActionError('A rejection reason is mandatory.');
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      await apiRequest(`/api/admin/users/${rejectTarget._id}/reject`, {
        method: 'PATCH',
        body: { reason: rejectReason.trim() }
      });
      setRejectTarget(null);
      setRejectReason('');
      await loadUsers();
    } catch (err) {
      setActionError(err.message || 'Error rejecting user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmSuspend = async (e) => {
    e.preventDefault();
    if (!suspendReason.trim()) {
      setActionError('A mandatory suspension reason must be provided.');
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      await apiRequest(`/api/admin/users/${suspendTarget._id}/suspend`, {
        method: 'PATCH',
        body: { reason: suspendReason.trim() }
      });
      setSuspendTarget(null);
      setSuspendReason('');
      await loadUsers();
    } catch (err) {
      setActionError(err.message || 'Error suspending user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (user) => {
    if (!window.confirm(`Are you sure you want to reactivate the account for ${user.email}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await apiRequest(`/api/admin/users/${user._id}/reactivate`, { method: 'PATCH' });
      await loadUsers();
    } catch (err) {
      alert(err.message || 'Error reactivating account.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={22} color="var(--primary)" /> User Governance & Account Management
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Search, moderate, review, suspend, or reactivate farmer and institution accounts.
            </p>
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={loadUsers}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Filter controls */}
        <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadUsers();
            }}
            style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}
          >
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Search Name / Email
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Filter Location
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Village, town, district..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Account Status
              </label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="approved">Approved / Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="rejected">Rejected</option>
                <option value="deactivation_requested">Deactivation Requested</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Account Role
              </label>
              <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                <option value="farmer">Farmer</option>
                <option value="institution">Institution</option>
              </select>
            </div>

            <div>
              <button type="submit" className="btn btn-primary" style={{ height: '40px', width: '100%' }}>
                <Search size={14} /> Search
              </button>
            </div>
          </form>
        </div>

        {/* Users Table */}
        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div></div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--danger)' }}>
              <p>{error}</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={loadUsers} style={{ marginTop: '10px' }}>
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              No accounts match the selected filters.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Role</th>
                    <th style={{ padding: '10px 12px' }}>Account & Contact</th>
                    <th style={{ padding: '10px 12px' }}>Location</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Reports</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const displayName = u.role === 'farmer' ? u.profile?.fullName : u.profile?.institutionName;

                    return (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, textTransform: 'capitalize' }}>
                          <span style={{
                            background: u.role === 'farmer' ? '#ecfdf5' : '#eff6ff',
                            color: u.role === 'farmer' ? '#047857' : '#1d4ed8',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.78rem'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600 }}>{displayName || 'N/A'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          {u.suspensionReason && (
                            <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '2px' }}>
                              Suspension reason: {u.suspensionReason}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {u.profile?.villageTown || '-'}, {u.profile?.district || '-'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <StatusBadge status={u.status} />
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {u.reportsCount > 0 ? (
                            <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600 }}>
                              {u.reportsCount} report(s)
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>0</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setViewUser(u)}
                              title="View Profile Details"
                            >
                              <Eye size={14} /> View
                            </button>

                            {['pending_approval', 'rejected', 'deactivation_requested'].includes(u.status) && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleApprove(u)}
                                disabled={actionLoading}
                                title="Approve Account"
                              >
                                <Check size={14} /> Approve
                              </button>
                            )}

                            {u.status === 'pending_approval' && (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  setRejectTarget(u);
                                  setRejectReason('');
                                  setActionError('');
                                }}
                                disabled={actionLoading}
                                title="Reject Account"
                              >
                                <X size={14} /> Reject
                              </button>
                            )}

                            {u.status === 'approved' && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setSuspendTarget(u);
                                  setSuspendReason('');
                                  setActionError('');
                                }}
                                disabled={actionLoading}
                                title="Suspend Account"
                                style={{ color: '#b91c1c' }}
                              >
                                <ShieldAlert size={14} /> Suspend
                              </button>
                            )}

                            {u.status === 'suspended' && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleReactivate(u)}
                                disabled={actionLoading}
                                title="Reactivate Account"
                                style={{ color: '#16a34a' }}
                              >
                                <RotateCcw size={14} /> Reactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View User Details Modal */}
        {viewUser && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '520px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Account Profile Details</h3>
                <button
                  type="button"
                  onClick={() => setViewUser(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                  <strong>{viewUser.email}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Role:</span>
                  <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{viewUser.role}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Account Status:</span>
                  <StatusBadge status={viewUser.status} />
                </div>
                {viewUser.role === 'farmer' ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Full Name:</span>
                    <strong>{viewUser.profile?.fullName || '-'}</strong>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Institution Name:</span>
                      <strong>{viewUser.profile?.institutionName || '-'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Contact Person:</span>
                      <strong>{viewUser.profile?.contactPerson || '-'}</strong>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Phone Number:</span>
                  <strong>{viewUser.profile?.phone || '-'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Village / Town:</span>
                  <strong>{viewUser.profile?.villageTown || '-'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>District & State:</span>
                  <strong>{viewUser.profile?.district || '-'}, {viewUser.profile?.state || 'Andhra Pradesh'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Member Since:</span>
                  <strong>{new Date(viewUser.createdAt).toLocaleDateString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Disputes / Reports:</span>
                  <strong>{viewUser.reportsCount || 0} filed against account</strong>
                </div>
                {viewUser.suspensionReason && (
                  <div style={{ background: '#fee2e2', padding: '8px 10px', borderRadius: '4px', color: '#991b1b', marginTop: '6px' }}>
                    <strong>Suspension Reason:</strong> {viewUser.suspensionReason}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setViewUser(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectTarget && (
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '8px' }}>
                Reject Account Registration
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
                Account: {rejectTarget.email} ({rejectTarget.role})
              </p>
              {actionError && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 10px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '12px' }}>
                  {actionError}
                </div>
              )}
              <form onSubmit={handleConfirmReject}>
                <div className="form-group">
                  <label className="form-label">Mandatory Rejection Reason *</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide specific feedback so the user knows what details were incomplete or invalid..."
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setRejectTarget(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger" disabled={actionLoading}>
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Suspend Modal */}
        {suspendTarget && (
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content" style={{ maxWidth: '520px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '8px' }}>
                Suspend Account: {suspendTarget.email}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
                Suspending this user will immediately block new procurement actions, hide their active listings, and close pending offers. Accepted and fulfilled order history remains preserved.
              </p>
              {actionError && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 10px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '12px' }}>
                  {actionError}
                </div>
              )}
              <form onSubmit={handleConfirmSuspend}>
                <div className="form-group">
                  <label className="form-label">Mandatory Suspension Reason *</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    required
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="e.g. Failure to honor agreed quantity/quality, fraudulent claims, policy violation..."
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setSuspendTarget(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger" disabled={actionLoading}>
                    {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
