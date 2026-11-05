import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { apiRequest } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { Plus, Edit3, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const UNITS = ['kg', 'quintal', 'tonne', 'bags', 'pieces', 'litres'];

export default function ManageListings() {
  const { isApproved } = useAuth();
  const { t } = useLanguage();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    produceName: '',
    totalQuantity: '',
    quantityUnit: 'kg',
    pricePerUnit: '',
    availabilityDate: '',
    description: ''
  });

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadListings = async () => {
    try {
      const res = await apiRequest('/api/listings/my/all');
      if (res.success) setListings(res.listings || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const openCreateModal = () => {
    setEditingListing(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);

    setFormData({
      produceName: '',
      totalQuantity: '',
      quantityUnit: 'kg',
      pricePerUnit: '',
      availabilityDate: tomorrow.toISOString().split('T')[0],
      description: ''
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingListing(item);
    setFormData({
      produceName: item.produceName,
      totalQuantity: item.totalQuantity,
      quantityUnit: item.quantityUnit,
      pricePerUnit: item.pricePerUnit,
      availabilityDate: item.availabilityDate ? new Date(item.availabilityDate).toISOString().split('T')[0] : '',
      description: item.description || ''
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSaveListing = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      if (editingListing) {
        // Update
        const res = await apiRequest(`/api/listings/${editingListing._id}`, {
          method: 'PUT',
          body: formData
        });
        if (res.success) {
          setModalOpen(false);
          await loadListings();
        }
      } else {
        // Create
        const res = await apiRequest('/api/listings', {
          method: 'POST',
          body: formData
        });
        if (res.success) {
          setModalOpen(false);
          await loadListings();
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error saving produce listing.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'active' ? 'unavailable' : 'active';
    try {
      await apiRequest(`/api/listings/${item._id}`, {
        method: 'PUT',
        body: { status: nextStatus }
      });
      await loadListings();
    } catch (err) {
      alert(err.message || 'Failed to toggle listing status.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await apiRequest(`/api/listings/${deleteTarget._id}`, {
        method: 'DELETE'
      });
      setDeleteTarget(null);
      await loadListings();
    } catch (err) {
      alert(err.message || 'Error deleting listing.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('navMyListings')}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Manage your crop stock, protected reservations, and campus pricing.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
            disabled={!isApproved}
            title={!isApproved ? 'Account approval required' : ''}
          >
            <Plus size={18} /> {t('btnCreateListing')}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div></div>
        ) : listings.length === 0 ? (
          <div className="card empty-state">
            <p>{t('noListingsFound')}</p>
            {isApproved && (
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal} style={{ marginTop: '12px' }}>
                Add Your First Produce
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3">
            {listings.map((item) => (
              <div key={item._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{item.produceName}</h3>
                    <StatusBadge status={item.status} />
                  </div>

                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px' }}>
                    ₹{item.pricePerUnit} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ {item.quantityUnit}</span>
                  </div>

                  {/* Stock Breakdown */}
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '12px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('totalQuantity')}:</span>
                      <strong>{item.totalQuantity} {item.quantityUnit}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#d97706' }}>{t('reservedQuantity')}:</span>
                      <strong style={{ color: '#d97706' }}>{item.reservedQuantity} {item.quantityUnit}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                      <span style={{ color: 'var(--primary)' }}>{t('unreservedQuantity')}:</span>
                      <strong style={{ color: 'var(--primary)' }}>{item.unreservedQuantity} {item.quantityUnit}</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div><strong>{t('availabilityDate')}:</strong> {new Date(item.availabilityDate).toLocaleDateString()}</div>
                    {item.description && <div style={{ marginTop: '4px' }}>{item.description}</div>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => openEditModal(item)}
                  >
                    <Edit3 size={14} /> {t('btnEdit')}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleToggleStatus(item)}
                    title={item.status === 'active' ? 'Mark Unavailable' : 'Mark Active'}
                  >
                    {item.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setDeleteTarget(item)}
                    title={t('btnDelete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>
                {editingListing ? 'Edit Produce Listing' : t('btnCreateListing')}
              </h3>

              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              <form onSubmit={handleSaveListing}>
                <div className="form-group">
                  <label className="form-label">{t('produceName')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.produceName}
                    onChange={(e) => setFormData({ ...formData, produceName: e.target.value })}
                    placeholder="e.g. Sona Masoori Rice, Fresh Tomatoes"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('totalQuantity')} *</label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      className="form-input"
                      required
                      value={formData.totalQuantity}
                      onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                    />
                    {editingListing && (
                      <span style={{ fontSize: '0.75rem', color: '#d97706' }}>
                        * Minimum allowed: {editingListing.reservedQuantity} {editingListing.quantityUnit} (reserved for accepted orders).
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('unit')} *</label>
                    <select
                      className="form-select"
                      disabled={!!editingListing}
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
                    <label className="form-label">{t('pricePerUnit')} (₹) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      className="form-input"
                      required
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('availabilityDate')} *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={formData.availabilityDate}
                      onChange={(e) => setFormData({ ...formData, availabilityDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Produce Description</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Details on crop variety, harvest freshness, packaging..."
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

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Remove Produce Listing"
          message={`Are you sure you want to remove "${deleteTarget?.produceName}"?`}
          warningText="Removing this listing will automatically close all pending order requests and notify buyers. Any already accepted orders remain protected and active."
          confirmText="Yes, Remove Listing"
          isDanger={true}
          isLoading={actionLoading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  );
}
