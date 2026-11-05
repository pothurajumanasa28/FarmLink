import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import {
  Users,
  AlertTriangle,
  ShieldCheck,
  History,
  RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/api/admin/stats');
      if (res.success) {
        setStats(res.stats);
        setRecentLogs(res.recentLogs || []);
      } else {
        setError(res.message || 'Failed to fetch platform metrics.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const getActionBadge = (action) => {
    const act = String(action || 'action').toLowerCase();
    if (act.includes('suspend') || act.includes('reject') || act.includes('archive')) {
      return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{act.replace('_', ' ').toUpperCase()}</span>;
    }
    if (act.includes('reactivate') || act.includes('approve') || act.includes('restore') || act.includes('resolve')) {
      return <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{act.replace('_', ' ').toUpperCase()}</span>;
    }
    return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{act.replace('_', ' ').toUpperCase()}</span>;
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={26} color="var(--primary)" /> FarmLink Platform Administration
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Real-time database metrics, user governance, content moderation, and platform security.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadStats}>
              <RefreshCw size={15} /> Refresh
            </button>
            <Link to="/admin/complaints" className="btn btn-secondary btn-sm" style={{ position: 'relative' }}>
              <AlertTriangle size={15} color="#d97706" />
              Complaints
              {stats?.complaints?.unresolved > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  marginLeft: '4px'
                }}>
                  {stats.complaints.unresolved}
                </span>
              )}
            </Link>
            <Link to="/admin/users" className="btn btn-primary btn-sm">
              <Users size={16} /> User Management
            </Link>
          </div>
        </div>

        {/* Loading and Error states */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading platform metrics from database...</p>
          </div>
        ) : error ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', borderLeft: '4px solid var(--danger)' }}>
            <AlertTriangle size={36} color="var(--danger)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '8px' }}>
              Unable to load administrative metrics
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>{error}</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={loadStats}>
              <RefreshCw size={14} /> Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* Section 1: User & Platform Health */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '12px', color: '#1e293b' }}>
                User & Platform Overview
              </h2>
              <div className="grid grid-cols-4" style={{ gap: '16px' }}>
                <div className="card" style={{ borderTop: '3px solid var(--primary)' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Registered Farmers</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                    {stats?.users?.farmers || 0}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Total active accounts
                  </div>
                </div>

                <div className="card" style={{ borderTop: '3px solid #0284c7' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Registered Institutions</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0284c7', marginTop: '4px' }}>
                    {stats?.users?.institutions || 0}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Colleges, hostels, canteens
                  </div>
                </div>

                <div className="card" style={{ borderTop: '3px solid #16a34a' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Active Accounts</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
                    {stats?.users?.approved || 0}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Total non-admin accounts: {stats?.users?.total || 0}
                  </div>
                </div>

                <div className="card" style={{ borderTop: '3px solid #ef4444' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Suspended Accounts</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: stats?.users?.suspended > 0 ? '#ef4444' : 'var(--text-muted)', marginTop: '4px' }}>
                    {stats?.users?.suspended || 0}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Pending reviews: {stats?.users?.pending || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Marketplace Activity */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '12px', color: '#1e293b' }}>
                Marketplace Listings & Tenders
              </h2>
              <div className="grid grid-cols-4" style={{ gap: '16px' }}>
                <div className="card">
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Active Farmer Listings</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                    {stats?.listings?.active || 0}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Total listings: {stats?.listings?.total || 0}
                  </div>
                </div>

                <div className="card">
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Open Bulk Requirements</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0284c7', marginTop: '4px' }}>
                    {stats?.requirements?.open || 0}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Total tenders: {stats?.requirements?.total || 0}
                  </div>
                </div>

                <div className="card">
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Unresolved Complaints</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: stats?.complaints?.unresolved > 0 ? '#d97706' : '#16a34a', marginTop: '4px' }}>
                    {stats?.complaints?.unresolved || 0}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Total submitted: {stats?.complaints?.total || 0}
                  </div>
                </div>

                <div className="card">
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Published Feedback</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>
                    {stats?.feedback?.total || 0}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Verified completed reviews
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Orders Lifecycle Breakdown */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '12px', color: '#1e293b' }}>
                Procurement Orders Lifecycle ({stats?.orders?.total || 0} Total Orders)
              </h2>
              <div className="grid grid-cols-5" style={{ gap: '14px' }}>
                <div className="card" style={{ padding: '14px', background: '#fefce8' }}>
                  <div style={{ fontSize: '0.78rem', color: '#854d0e', fontWeight: 600 }}>Pending Requests</div>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a16207', marginTop: '4px' }}>
                    {stats?.orders?.pending || 0}
                  </h4>
                </div>

                <div className="card" style={{ padding: '14px', background: '#f0fdf4' }}>
                  <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>Accepted (Stock Reserved)</div>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15803d', marginTop: '4px' }}>
                    {stats?.orders?.accepted || 0}
                  </h4>
                </div>

                <div className="card" style={{ padding: '14px', background: '#f0f9ff' }}>
                  <div style={{ fontSize: '0.78rem', color: '#075985', fontWeight: 600 }}>In Preparation</div>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0284c7', marginTop: '4px' }}>
                    {stats?.orders?.preparing || 0}
                  </h4>
                </div>

                <div className="card" style={{ padding: '14px', background: '#ecfdf5' }}>
                  <div style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 600 }}>Delivered & Fulfilled</div>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
                    {stats?.orders?.delivered || 0}
                  </h4>
                </div>

                <div className="card" style={{ padding: '14px', background: '#f8fafc' }}>
                  <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Cancelled</div>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>
                    {stats?.orders?.cancelled || 0}
                  </h4>
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={18} /> Recent Administrative Audit Trail
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Append-only immutable event logs
                </span>
              </div>

              {recentLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No administrative actions recorded yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px' }}>Timestamp</th>
                        <th style={{ padding: '10px 12px' }}>Action</th>
                        <th style={{ padding: '10px 12px' }}>Admin Actor</th>
                        <th style={{ padding: '10px 12px' }}>Target Model</th>
                        <th style={{ padding: '10px 12px' }}>Details / Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLogs.map((log) => (
                        <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {getActionBadge(log.action)}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                            {log.actor?.email || 'System'}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#475569' }}>
                            {log.targetModel}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#334155', maxWidth: '350px' }}>
                            {typeof log.details === 'object' && log.details !== null
                              ? log.details.reason
                                ? `Reason: ${log.details.reason}`
                                : JSON.stringify(log.details)
                              : String(log.details || '-')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
