import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { AlertTriangle, ShieldCheck, CheckCircle2, RefreshCw, X } from 'lucide-react';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal for resolving
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('resolved');
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      let query = '/api/admin/complaints?';
      if (statusFilter) query += `status=${statusFilter}&`;
      if (typeFilter) query += `targetType=${typeFilter}&`;

      const res = await apiRequest(query);
      if (res.success) {
        setComplaints(res.complaints || []);
      } else {
        setError(res.message || 'Failed to fetch complaints.');
      }
    } catch (err) {
      setError(err.message || 'Error loading complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [statusFilter, typeFilter]);

  const handleOpenResolve = (comp) => {
    setSelectedComplaint(comp);
    setResolutionStatus(comp.status === 'open' ? 'under_review' : 'resolved');
    setResolutionNote(comp.resolutionNote || '');
    setActionError('');
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      setActionError('Please provide an investigation summary or resolution note.');
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      const res = await apiRequest(`/api/admin/complaints/${selectedComplaint._id}/resolve`, {
        method: 'PATCH',
        body: {
          status: resolutionStatus,
          resolutionNote: resolutionNote.trim()
        }
      });

      if (res.success) {
        setSelectedComplaint(null);
        await loadComplaints();
      } else {
        setActionError(res.message || 'Could not update complaint.');
      }
    } catch (err) {
      setActionError(err.message || 'Error updating complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>Open</span>;
      case 'under_review':
        return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>Under Review</span>;
      case 'resolved':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>Resolved</span>;
      case 'dismissed':
        return <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>Dismissed</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={24} color="#d97706" /> Dispute & Complaint Resolution
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Investigate and moderate reported listings, abusive conduct, and order disputes.
            </p>
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={loadComplaints}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Filter controls */}
        <div className="card" style={{ marginBottom: '20px', padding: '14px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Status Filter
              </label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="open">Open (Unresolved)</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Target Type Filter
              </label>
              <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option value="listing">Produce Listing</option>
                <option value="requirement">Bulk Requirement</option>
                <option value="order">Order Issue</option>
                <option value="user">User Account</option>
                <option value="feedback">Feedback/Review</option>
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Table / List */}
        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div></div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--danger)' }}>
              <p>{error}</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={loadComplaints} style={{ marginTop: '10px' }}>
                Retry
              </button>
            </div>
          ) : complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={38} color="#16a34a" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>No complaints found</p>
              <span style={{ fontSize: '0.85rem' }}>No issues match the selected filters.</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Date</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Target Type</th>
                    <th style={{ padding: '10px 12px' }}>Reason & Details</th>
                    <th style={{ padding: '10px 12px' }}>Reporter</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {getStatusBadge(c.status)}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, textTransform: 'capitalize' }}>
                        {c.targetType}
                      </td>
                      <td style={{ padding: '10px 12px', maxWidth: '320px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.reason}</div>
                        <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.description}
                        </div>
                        {c.resolutionNote && (
                          <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '4px', background: '#f0f9ff', padding: '3px 6px', borderRadius: '4px' }}>
                            <strong>Resolution:</strong> {c.resolutionNote}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 500 }}>{c.reporter?.profile?.fullName || c.reporter?.profile?.institutionName || 'User'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.reporter?.email} ({c.reporter?.role})</div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenResolve(c)}
                        >
                          Review / Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review / Resolve Modal */}
        {selectedComplaint && (
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content" style={{ maxWidth: '600px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={22} color="var(--primary)" /> Review & Resolve Complaint
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {actionError && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>
                  {actionError}
                </div>
              )}

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.85rem' }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Target Type:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedComplaint.targetType}</span>
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Target ID:</strong> <code style={{ fontSize: '0.8rem' }}>{selectedComplaint.targetId}</code>
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Reported By:</strong> {selectedComplaint.reporter?.email} ({selectedComplaint.reporter?.role})
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Alleged Issue:</strong> {selectedComplaint.reason}
                </div>
                <div>
                  <strong>Details:</strong>
                  <p style={{ marginTop: '4px', color: '#334155', whiteSpace: 'pre-wrap' }}>
                    {selectedComplaint.description}
                  </p>
                </div>
              </div>

              <form onSubmit={handleResolveSubmit}>
                <div className="form-group">
                  <label className="form-label">Update Complaint Status *</label>
                  <select
                    className="form-select"
                    value={resolutionStatus}
                    onChange={(e) => setResolutionStatus(e.target.value)}
                  >
                    <option value="under_review">Under Review (Investigation in progress)</option>
                    <option value="resolved">Resolved (Action taken / Issue settled)</option>
                    <option value="dismissed">Dismissed (No violation / Insufficient evidence)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Investigation Summary & Resolution Note *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    required
                    placeholder="Document findings, communications, and administrative actions taken..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    This note will be safely shared with the reporting party upon status update.
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedComplaint(null)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving...' : 'Save Resolution'}
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
