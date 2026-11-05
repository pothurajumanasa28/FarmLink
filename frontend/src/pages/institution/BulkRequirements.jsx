import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { apiRequest } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { Plus, Edit3, XCircle, RotateCcw, ArrowRight, Eye, Calendar, DollarSign } from 'lucide-react';

const UNITS = ['kg', 'quintal', 'tonne', 'bags', 'pieces', 'litres'];

export default function BulkRequirements() {
  const { isApproved } = useAuth();
  const { t } = useLanguage();

  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    produceName: '',
    requiredQuantity: '',
    quantityUnit: 'kg',
    requiredDate: '',
    targetPricePerUnit: '',
    description: ''
  });

  // Action states
  const [closeTarget, setCloseTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadRequirements = async () => {
    try {
      const res = await apiRequest('/api/bulk-requirements/my/all');
      if (res.success) setRequirements(res.requirements || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, []);

  const openCreateModal = () => {
    setEditingReq(null);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);

    setFormData({
      produceName: '',
      requiredQuantity: '',
      quantityUnit: 'kg',
      requiredDate: futureDate.toISOString().split('T')[0],
      targetPricePerUnit: '',
      description: ''
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingReq(item);
    setFormData({
      produceName: item.produceName,
      requiredQuantity: item.requiredQuantity,
      quantityUnit: item.quantityUnit,
      requiredDate: item.requiredDate ? new Date(item.requiredDate).toISOString().split('T')[0] : '',
      targetPricePerUnit: item.targetPricePerUnit || '',
      description: item.description || ''
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSaveRequirement = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      if (editingReq) {
        const res = await apiRequest(`/api/bulk-requirements/${editingReq._id}`, {
          method: 'PUT',
          body: formData
        });
        if (res.success) {
          setModalOpen(false);
          await loadRequirements();
        }
      } else {
        const res = await apiRequest('/api/bulk-requirements', {
          method: 'POST',
          body: formData
        });
        if (res.success) {
          setModalOpen(false);
          await loadRequirements();
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error saving requirement.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmClose = async () => {
    if (!closeTarget) return;
    setActionLoading(true);
    try {
      await apiRequest(`/api/bulk-requirements/${closeTarget._id}/close`, {
        method: 'PATCH'
      });
      setCloseTarget(null);
      await loadRequirements();
    } catch (err) {
      alert(err.message || 'Error closing requirement.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async (req) => {
    const newDate = prompt('Enter new future required date (YYYY-MM-DD):', new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    if (!newDate) return;

    try {
      await apiRequest(`/api/bulk-requirements/${req._id}/reopen`, {
        method: 'PATCH',
        body: { newRequiredDate: newDate }
      });
      await loadRequirements();
    } catch (err) {
      alert(err.message || 'Failed to reopen requirement.');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('navRequirements')}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Publish bulk produce requirements for hostel dining halls and campus canteens.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
            disabled={!isApproved}
            title={!isApproved ? 'Account approval required' : ''}
          >
            <Plus size={18} /> {t('btnPostRequirement')}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div></div>
        ) : requirements.length === 0 ? (
          <div className="card empty-state">
            <p>{t('noRequirementsFound')}</p>
            {isApproved && (
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal} style={{ marginTop: '12px' }}>
                Post Your First Requirement
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {requirements.map((item) => {
              const total = item.requiredQuantity || 1;
              const committed = item.committedQuantity || 0;
              const delivered = item.deliveredQuantity || 0;
              const percent = Math.min(100, Math.round(((committed + delivered) / total) * 100));

              return (
                <div key={item._id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>{item.produceName}</h3>
                        <StatusBadge status={item.status} />
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Required by: <strong>{new Date(item.requiredDate).toLocaleDateString()}</strong> • Location: {item.location?.villageTown}, {item.location?.district}
                      </div>
                      {item.targetPricePerUnit && (
                        <div style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 600, marginTop: '2px' }}>
                          Target Budget: ₹{item.targetPricePerUnit} / {item.quantityUnit}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link to={`/institution/requirements/${item._id}/offers`} className="btn btn-primary btn-sm">
                        <Eye size={14} /> Review Offers
                      </Link>

                      {item.status === 'open' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit3 size={14} /> {t('btnEdit')}
                        </button>
                      )}

                      {item.status === 'open' && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setCloseTarget(item)}
                        >
                          <XCircle size={14} /> Close
                        </button>
                      )}

                      {['closed', 'expired'].includes(item.status) && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleReopen(item)}
                        >
                          <RotateCcw size={14} /> Reopen
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600 }}>Fulfillment Progress: {percent}%</span>
                      <span>Total Required: <strong>{item.requiredQuantity} {item.quantityUnit}</strong></span>
                    </div>

                    <div style={{ background: '#e2e8f0', borderRadius: '6px', height: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                      <div
                        style={{
                          background: percent >= 100 ? '#16a34a' : 'var(--primary)',
                          width: `${percent}%`,
                          height: '100%'
                        }}
                      ></div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.82rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>{t('committedQuantity')}:</span><br />
                        <strong style={{ color: '#0284c7', fontSize: '0.95rem' }}>{committed} {item.quantityUnit}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>{t('deliveredQuantity')}:</span><br />
                        <strong style={{ color: '#16a34a', fontSize: '0.95rem' }}>{delivered} {item.quantityUnit}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>{t('remainingQuantity')}:</span><br />
                        <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>{item.remainingQuantity} {item.quantityUnit}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>
                {editingReq ? 'Edit Bulk Requirement' : t('btnPostRequirement')}
              </h3>

              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              <form onSubmit={handleSaveRequirement}>
                <div className="form-group">
                  <label className="form-label">{t('produceName')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.produceName}
                    onChange={(e) => setFormData({ ...formData, produceName: e.target.value })}
                    placeholder="e.g. Sona Masoori Rice, Tomatoes, Fresh Milk"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('quantity')} *</label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      className="form-input"
                      required
                      value={formData.requiredQuantity}
                      onChange={(e) => setFormData({ ...formData, requiredQuantity: e.target.value })}
                      placeholder="e.g. 500"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('unit')} *</label>
                    <select
                      className="form-select"
                      disabled={!!editingReq}
                      value={formData.quantityUnit}
                      onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('requiredDate')} *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={formData.requiredDate}
                      onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Budget (₹/unit)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={formData.targetPricePerUnit}
                      onChange={(e) => setFormData({ ...formData, targetPricePerUnit: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Requirement Details & Schedule</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide details on dining hall batch, gate timings, packaging..."
                  ></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                    {t('btnCancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : t('btnSave')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Close Confirmation Modal */}
        <ConfirmModal
          isOpen={!!closeTarget}
          title="Close Bulk Requirement"
          message={`Are you sure you want to close the requirement for "${closeTarget?.produceName}"?`}
          warningText="Closing this requirement will stop accepting new offers and automatically close all pending farmer offers with notification."
          confirmText="Yes, Close Requirement"
          isDanger={true}
          isLoading={actionLoading}
          onConfirm={confirmClose}
          onCancel={() => setCloseTarget(null)}
        />
      </div>
    </div>
  );
}
