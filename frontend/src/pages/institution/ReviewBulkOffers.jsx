import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { apiRequest } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { ArrowLeft, Check, X, MapPin, Calendar, DollarSign, Layers } from 'lucide-react';

export default function ReviewBulkOffers() {
  const { requirementId } = useParams();
  const { t } = useLanguage();

  const [requirement, setRequirement] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sorting
  const [sortBy, setSortBy] = useState('price_asc');

  // Accept modal
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [acceptQty, setAcceptQty] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reject target
  const [rejectTarget, setRejectTarget] = useState(null);

  const loadData = async () => {
    try {
      const [reqData, offersData] = await Promise.all([
        apiRequest(`/api/bulk-requirements/${requirementId}`),
        apiRequest(`/api/bulk-offers/requirement/${requirementId}?sortBy=${sortBy.startsWith('price') ? 'price' : 'quantity'}&sortOrder=${sortBy.endsWith('desc') ? 'desc' : 'asc'}`)
      ]);

      if (reqData.success) {
        setRequirement(reqData.requirement);
        setMetrics(reqData.metrics);
      }
      if (offersData.success) {
        setOffers(offersData.offers || []);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [requirementId, sortBy]);

  const openAcceptModal = (offer) => {
    setAcceptTarget(offer);
    const availableOffered = offer.offeredQuantity - (offer.acceptedQuantity || 0);
    const maxCapacity = metrics?.eligibleCapacity ?? availableOffered;
    const defaultQty = Math.min(availableOffered, maxCapacity);

    setAcceptQty(defaultQty > 0 ? defaultQty : availableOffered);
    setErrorMsg('');
  };

  const handleConfirmAccept = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await apiRequest(`/api/bulk-offers/${acceptTarget._id}/accept`, {
        method: 'PATCH',
        body: { acceptQuantity: Number(acceptQty) }
      });

      if (res.success) {
        setAcceptTarget(null);
        await loadData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error accepting offer.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);

    try {
      await apiRequest(`/api/bulk-offers/${rejectTarget._id}/reject`, {
        method: 'PATCH',
        body: { reason: 'Offer declined by institution' }
      });
      setRejectTarget(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Error rejecting offer.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ marginBottom: '20px' }}>
          <Link to="/institution/requirements" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back to Requirements
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                Offers for: {requirement?.produceName}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Total Required: {requirement?.requiredQuantity} {requirement?.quantityUnit} • Needed By: {new Date(requirement?.requiredDate).toLocaleDateString()}
              </p>
            </div>
            <StatusBadge status={requirement?.status} />
          </div>
        </div>

        {/* Progress summary card */}
        <div className="card" style={{ marginBottom: '24px', background: '#f8fafc' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '0.88rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Required:</span><br />
              <strong style={{ fontSize: '1.1rem' }}>{requirement?.requiredQuantity} {requirement?.quantityUnit}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Committed Orders:</span><br />
              <strong style={{ fontSize: '1.1rem', color: '#0284c7' }}>{metrics?.committedQuantity || 0} {requirement?.quantityUnit}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Delivered:</span><br />
              <strong style={{ fontSize: '1.1rem', color: '#16a34a' }}>{metrics?.deliveredQuantity || 0} {requirement?.quantityUnit}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Remaining Capacity:</span><br />
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{metrics?.eligibleCapacity || 0} {requirement?.quantityUnit}</strong>
            </div>
          </div>
        </div>

        {/* Offers List & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Farmer Offers Received ({offers.length})</h3>
          <div>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="quantity_desc">Quantity: High to Low</option>
            </select>
          </div>
        </div>

        {offers.length === 0 ? (
          <div className="card empty-state">No farmer offers received for this requirement yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {offers.map((off) => {
              const remainingOffered = off.offeredQuantity - (off.acceptedQuantity || 0);

              return (
                <div key={off._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                        {off.farmer?.profile?.fullName || 'Local Farmer'}
                      </h4>
                      <StatusBadge status={off.status} />
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} /> {off.farmer?.profile?.villageTown}, {off.farmer?.profile?.district}
                    </div>

                    <div style={{ fontSize: '0.95rem', marginTop: '6px' }}>
                      Offered: <strong>{off.offeredQuantity} {off.quantityUnit}</strong> @ <strong style={{ color: 'var(--primary)' }}>₹{off.proposedPricePerUnit}/{off.quantityUnit}</strong>
                      {off.acceptedQuantity > 0 && (
                        <span style={{ color: '#16a34a', marginLeft: '10px', fontSize: '0.85rem', fontWeight: 600 }}>
                          (Accepted: {off.acceptedQuantity} {off.quantityUnit})
                        </span>
                      )}
                    </div>

                    {off.notes && (
                      <div style={{ fontSize: '0.82rem', color: '#475569', fontStyle: 'italic', marginTop: '4px' }}>
                        Note: "{off.notes}"
                      </div>
                    )}
                  </div>

                  <div>
                    {off.status === 'pending' && requirement?.status === 'open' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setRejectTarget(off)}
                        >
                          <X size={14} /> {t('btnReject')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => openAcceptModal(off)}
                        >
                          <Check size={14} /> Accept Offer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Accept Modal (Supports Partial or Full Acceptance) */}
        {acceptTarget && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '6px' }}>
                Accept Farmer Offer
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Farmer: {acceptTarget.farmer?.profile?.fullName} • Proposed Rate: ₹{acceptTarget.proposedPricePerUnit} / {acceptTarget.quantityUnit}
              </p>

              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              <form onSubmit={handleConfirmAccept}>
                <div className="form-group">
                  <label className="form-label">
                    Quantity to Accept ({acceptTarget.quantityUnit}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    max={acceptTarget.offeredQuantity - (acceptTarget.acceptedQuantity || 0)}
                    className="form-input"
                    required
                    value={acceptQty}
                    onChange={(e) => setAcceptQty(e.target.value)}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Available in this offer: {acceptTarget.offeredQuantity - (acceptTarget.acceptedQuantity || 0)} {acceptTarget.quantityUnit} • Remaining requirement capacity: {metrics?.eligibleCapacity} {acceptTarget.quantityUnit}
                  </div>
                  {acceptQty > 0 && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: '6px' }}>
                      Committed Order Total: ₹{(Number(acceptQty) * acceptTarget.proposedPricePerUnit).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setAcceptTarget(null)}>
                    {t('btnCancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Processing...' : 'Confirm & Create Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        <ConfirmModal
          isOpen={!!rejectTarget}
          title="Decline Farmer Offer"
          message={`Are you sure you want to decline the offer from ${rejectTarget?.farmer?.profile?.fullName}?`}
          confirmText="Yes, Decline Offer"
          isDanger={true}
          isLoading={actionLoading}
          onConfirm={confirmReject}
          onCancel={() => setRejectTarget(null)}
        />
      </div>
    </div>
  );
}
