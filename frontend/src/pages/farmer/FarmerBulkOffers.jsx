import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { apiRequest } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { Layers, Send, Building2, Calendar, MapPin, Undo2 } from 'lucide-react';

export default function FarmerBulkOffers() {
  const { isApproved } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('browse');
  const [requirements, setRequirements] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit offer modal
  const [targetReq, setTargetReq] = useState(null);
  const [offerQty, setOfferQty] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNotes, setOfferNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Withdraw offer
  const [withdrawTarget, setWithdrawTarget] = useState(null);

  const loadData = async () => {
    try {
      const [reqData, offersData] = await Promise.all([
        apiRequest('/api/bulk-requirements/open'),
        apiRequest('/api/bulk-offers/my')
      ]);

      if (reqData.success) setRequirements(reqData.requirements || []);
      if (offersData.success) setMyOffers(offersData.offers || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openOfferModal = (req) => {
    setTargetReq(req);
    setOfferQty(req.remainingQuantity || req.requiredQuantity || '');
    setOfferPrice(req.targetPricePerUnit || '');
    setOfferNotes('');
    setErrorMsg('');
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await apiRequest('/api/bulk-offers', {
        method: 'POST',
        body: {
          requirementId: targetReq._id,
          offeredQuantity: Number(offerQty),
          proposedPricePerUnit: Number(offerPrice),
          notes: offerNotes
        }
      });

      if (res.success) {
        setTargetReq(null);
        await loadData();
        setActiveTab('my-offers');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error submitting offer.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmWithdraw = async () => {
    if (!withdrawTarget) return;
    setActionLoading(true);

    try {
      await apiRequest(`/api/bulk-offers/${withdrawTarget._id}/withdraw`, {
        method: 'PATCH'
      });
      setWithdrawTarget(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Error withdrawing offer.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Institutional Bulk Procurement Tenders</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Direct bulk requirements published by SRGEC hostels and canteens. Submit competitive offers.
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse Open Requirements ({requirements.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'my-offers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('my-offers')}
          >
            My Submitted Offers ({myOffers.length})
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div></div>
        ) : activeTab === 'browse' ? (
          requirements.length === 0 ? (
            <div className="card empty-state">{t('noRequirementsFound')}</div>
          ) : (
            <div className="grid grid-cols-3">
              {requirements.map((req) => (
                <div key={req._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{req.produceName}</h3>
                      <StatusBadge status={req.status} />
                    </div>

                    <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={16} color="var(--primary)" />
                      <strong>{req.institution?.profile?.institutionName || 'College Dining Mess'}</strong>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '12px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Total Required:</span>
                        <strong>{req.requiredQuantity} {req.quantityUnit}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Committed:</span>
                        <strong style={{ color: '#0284c7' }}>{req.committedQuantity || 0} {req.quantityUnit}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Remaining Capacity:</span>
                        <strong style={{ color: 'var(--primary)' }}>{req.eligibleCapacity ?? req.requiredQuantity} {req.quantityUnit}</strong>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} /> Required by: {new Date(req.requiredDate).toLocaleDateString()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> Location: {req.location?.villageTown}, {req.location?.district}
                      </div>
                      {req.targetPricePerUnit && (
                        <div style={{ color: '#d97706', fontWeight: 600, marginTop: '2px' }}>
                          Target Price: ₹{req.targetPricePerUnit} / {req.quantityUnit}
                        </div>
                      )}
                      {req.description && <p style={{ marginTop: '4px' }}>{req.description}</p>}
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                      onClick={() => openOfferModal(req)}
                      disabled={!isApproved}
                      title={!isApproved ? 'Account approval required' : ''}
                    >
                      <Send size={14} /> {t('btnSubmitOffer')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* My Submitted Offers */
          myOffers.length === 0 ? (
            <div className="card empty-state">You have not submitted any bulk offers yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myOffers.map((off) => (
                <div key={off._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                        {off.bulkRequirement?.produceName || 'Produce Tender'}
                      </h4>
                      <StatusBadge status={off.status} />
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Institution: <strong>{off.bulkRequirement?.institution?.profile?.institutionName || 'College Hostel'}</strong>
                    </div>
                    <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                      Offered: <strong>{off.offeredQuantity} {off.quantityUnit}</strong> @ <strong>₹{off.proposedPricePerUnit}/{off.quantityUnit}</strong>
                      {off.acceptedQuantity > 0 && (
                        <span style={{ color: '#16a34a', marginLeft: '10px', fontWeight: 600 }}>
                          (Accepted: {off.acceptedQuantity} {off.quantityUnit})
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {off.status === 'pending' && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setWithdrawTarget(off)}
                      >
                        <Undo2 size={14} /> {t('btnWithdraw')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Submit Offer Modal */}
        {targetReq && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '6px' }}>
                Submit Offer for {targetReq.produceName}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Buyer: {targetReq.institution?.profile?.institutionName || 'Hostel Mess'} • Required: {targetReq.requiredQuantity} {targetReq.quantityUnit}
              </p>

              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              <form onSubmit={handleSubmitOffer}>
                <div className="form-group">
                  <label className="form-label">Offered Quantity ({targetReq.quantityUnit}) *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    className="form-input"
                    required
                    value={offerQty}
                    onChange={(e) => setOfferQty(e.target.value)}
                    placeholder={`e.g. 100`}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    * You can offer all or part of the requirement. Institutions can also accept partial quantities.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Proposed Price Per {targetReq.quantityUnit} (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    className="form-input"
                    required
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="e.g. 52"
                  />
                  {targetReq.targetPricePerUnit && (
                    <span style={{ fontSize: '0.75rem', color: '#d97706' }}>
                      Target budget requested by hostel: ₹{targetReq.targetPricePerUnit}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Logistics arrangements</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={offerNotes}
                    onChange={(e) => setOfferNotes(e.target.value)}
                    placeholder="Delivery date capability, packaging, etc."
                  ></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setTargetReq(null)}>
                    {t('btnCancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Submitting...' : t('btnSubmitOffer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Withdraw Confirmation Modal */}
        <ConfirmModal
          isOpen={!!withdrawTarget}
          title="Withdraw Bulk Offer"
          message={`Are you sure you want to withdraw your offer for ${withdrawTarget?.bulkRequirement?.produceName}?`}
          warningText="Once withdrawn, the institution can no longer accept this offer."
          confirmText="Yes, Withdraw Offer"
          isDanger={true}
          isLoading={actionLoading}
          onConfirm={confirmWithdraw}
          onCancel={() => setWithdrawTarget(null)}
        />
      </div>
    </div>
  );
}
