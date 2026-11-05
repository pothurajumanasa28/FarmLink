import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { apiRequest } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { User, Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    fullName: user?.profile?.fullName || '',
    institutionName: user?.profile?.institutionName || '',
    contactPerson: user?.profile?.contactPerson || '',
    phone: user?.profile?.phone || '',
    villageTown: user?.profile?.villageTown || '',
    district: user?.profile?.district || '',
    state: user?.profile?.state || 'Andhra Pradesh'
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Deactivation state
  const [deactReason, setDeactReason] = useState('');
  const [showDeactModal, setShowDeactModal] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');

    try {
      const data = await apiRequest('/api/users/profile', {
        method: 'PATCH',
        body: { profile: formData }
      });

      if (data.success) {
        setMsg('Profile details updated successfully.');
        await refreshUser();
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleReapproval = async () => {
    setLoading(true);
    setError('');
    setMsg('');

    try {
      const data = await apiRequest('/api/users/request-reapproval', {
        method: 'POST'
      });

      if (data.success) {
        setMsg('Re-approval request submitted to college administration.');
        await refreshUser();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit re-approval request.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/api/users/request-deactivation', {
        method: 'POST',
        body: { reason: deactReason }
      });

      if (data.success) {
        setShowDeactModal(false);
        setMsg('Account deactivation requested. Administrator will review active obligations.');
        await refreshUser();
      }
    } catch (err) {
      setError(err.message || 'Failed to request deactivation.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '720px' }}>
        {/* Account Status Card */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '50%' }}>
                <User size={24} color="var(--primary)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {user.role === 'farmer' ? user.profile?.fullName : user.profile?.institutionName || user.email}
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {user.email} • {user.role.toUpperCase()}
                </div>
              </div>
            </div>
            <StatusBadge status={user.status} />
          </div>

          {/* Rejection notice and reapproval CTA */}
          {user.status === 'rejected' && (
            <div className="alert alert-danger" style={{ marginTop: '16px' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Account Application Rejected</div>
                <div style={{ fontSize: '0.88rem' }}>Reason: {user.rejectionReason}</div>
                <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                  Please update your profile details below and click "Request Re-approval".
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '10px' }}
                  onClick={handleReapproval}
                  disabled={loading}
                >
                  <RefreshCw size={14} /> {t('btnRequestReapproval')}
                </button>
              </div>
            </div>
          )}

          {/* Pending notice */}
          {user.status === 'pending_approval' && (
            <div className="alert alert-warning" style={{ marginTop: '16px', fontSize: '0.88rem' }}>
              {t('pendingApprovalBanner')}
            </div>
          )}

          {/* Suspension notice */}
          {user.status === 'suspended' && (
            <div className="alert alert-danger" style={{ marginTop: '16px', fontSize: '0.88rem' }}>
              {t('suspendedBanner')} Reason: {user.suspensionReason || 'Contact college admin.'}
            </div>
          )}
        </div>

        {/* Profile Edit Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
            Update Profile Information
          </h3>

          {error && <div className="alert alert-danger">{error}</div>}
          {msg && <div className="alert alert-success">{msg}</div>}

          <form onSubmit={handleUpdate}>
            {user.role === 'farmer' ? (
              <div className="form-group">
                <label className="form-label">{t('fullName')}</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">{t('institutionName')}</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('contactPerson')}</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">{t('phone')}</label>
              <input
                type="tel"
                className="form-input"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                * Private contact details are visible to buyers/sellers only after an order is mutually accepted.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">{t('villageTown')}</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.villageTown}
                  onChange={(e) => setFormData({ ...formData, villageTown: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('district')}</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? 'Saving...' : t('btnSave')}
            </button>
          </form>

          {/* Account Deactivation Option */}
          {user.status === 'approved' && (
            <div style={{ marginTop: '36px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '6px' }}>
                Account Deactivation
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                You may request account deactivation if you no longer intend to participate. College administration reviews active order obligations before approving.
              </p>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => setShowDeactModal(true)}
              >
                {t('btnRequestDeactivation')}
              </button>
            </div>
          )}
        </div>

        {/* Deactivation Modal */}
        {showDeactModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '8px' }}>
                Request Account Deactivation
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Please specify why you wish to deactivate your account. Active orders must be fulfilled or resolved first.
              </p>
              <form onSubmit={handleDeactivation}>
                <div className="form-group">
                  <label className="form-label">Reason for Deactivation</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    required
                    value={deactReason}
                    onChange={(e) => setDeactReason(e.target.value)}
                    placeholder="e.g. Seasonal closure, relocation..."
                  ></textarea>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowDeactModal(false)}>
                    {t('btnCancel')}
                  </button>
                  <button type="submit" className="btn btn-danger" disabled={loading}>
                    Submit Deactivation Request
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
