import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { apiRequest } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import FeedbackModal from '../../components/FeedbackModal';
import { Package, Clock, Phone, Mail, CheckCircle2, XCircle, ArrowRight, Star } from 'lucide-react';

export default function FarmerOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  // Cancel modal state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Feedback modal
  const [feedbackTarget, setFeedbackTarget] = useState(null);

  const loadOrders = async () => {
    try {
      const res = await apiRequest('/api/orders/my');
      if (res.success) setOrders(res.orders || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleAdvanceStatus = async (orderId, newStatus) => {
    setActionLoading(true);
    try {
      await apiRequest(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status: newStatus }
      });
      await loadOrders();
    } catch (err) {
      alert(err.message || 'Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      await apiRequest(`/api/orders/${cancelTarget._id}/cancel`, {
        method: 'PATCH',
        body: { reason: cancelReason }
      });
      setCancelTarget(null);
      setCancelReason('');
      await loadOrders();
    } catch (err) {
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (tab === 'pending') return o.status === 'pending';
    if (tab === 'active') return ['accepted', 'preparing'].includes(o.status);
    if (tab === 'delivered') return o.status === 'delivered';
    if (tab === 'cancelled') return ['cancelled', 'rejected'].includes(o.status);
    return true;
  });

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('navMyOrders')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Track buyer orders, update preparation and delivery progress, and coordinate with college hostels.
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'Pending Requests' },
            { id: 'active', label: 'Active In-Progress' },
            { id: 'delivered', label: 'Fulfilled / Delivered' },
            { id: 'cancelled', label: 'Cancelled / Declined' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`btn btn-sm ${tab === item.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div></div>
        ) : filteredOrders.length === 0 ? (
          <div className="card empty-state">{t('noOrdersFound')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredOrders.map((ord) => {
              const contactRevealed = ['accepted', 'preparing', 'delivered'].includes(ord.status);

              return (
                <div key={ord._id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{ord.produceName}</h3>
                        <StatusBadge status={ord.status} />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          ID: #{ord._id.slice(-6)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Required by: <strong>{new Date(ord.requiredDate).toLocaleDateString()}</strong> • Type: {ord.orderType === 'bulk_offer' ? 'Bulk Tender Order' : 'Individual Listing Request'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                        ₹{ord.totalAmount}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {ord.quantity} {ord.quantityUnit} @ ₹{ord.pricePerUnit}/{ord.quantityUnit}
                      </div>
                    </div>
                  </div>

                  {/* Buyer Contact Details Box */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                      Buyer: {ord.institution?.profile?.institutionName || 'College Mess'}
                    </div>

                    {contactRevealed ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.82rem', color: '#334155', marginTop: '6px' }}>
                        <div><strong>Contact:</strong> {ord.institution?.profile?.contactPerson || 'Warden'}</div>
                        {ord.institution?.profile?.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={14} color="var(--primary)" /> {ord.institution.profile.phone}
                          </div>
                        )}
                        {ord.institution?.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={14} color="var(--primary)" /> {ord.institution.email}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        🔒 {t('contactHidden')}
                      </div>
                    )}

                    {ord.notes && (
                      <div style={{ fontSize: '0.8rem', marginTop: '6px', color: '#475569' }}>
                        <strong>Notes:</strong> {ord.notes}
                      </div>
                    )}
                  </div>

                  {/* Action progression bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {ord.status === 'accepted' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAdvanceStatus(ord._id, 'preparing')}
                          disabled={actionLoading}
                        >
                          <Package size={14} /> {t('btnAdvancePreparing')}
                        </button>
                      )}

                      {ord.status === 'preparing' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAdvanceStatus(ord._id, 'delivered')}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 size={14} /> {t('btnAdvanceDelivered')}
                        </button>
                      )}

                      {ord.status === 'delivered' && !ord.farmerFeedbackGiven && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setFeedbackTarget(ord)}
                        >
                          <Star size={14} color="#eab308" /> {t('btnLeaveFeedback')}
                        </button>
                      )}

                      {ord.status === 'delivered' && ord.farmerFeedbackGiven && (
                        <span style={{ fontSize: '0.8rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Feedback Submitted
                        </span>
                      )}
                    </div>

                    {/* Cancellation option (before delivery) */}
                    {['pending', 'accepted', 'preparing'].includes(ord.status) && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setCancelTarget(ord);
                          setCancelReason('');
                        }}
                      >
                        <XCircle size={14} /> {t('btnCancelOrder')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        <ConfirmModal
          isOpen={!!cancelTarget}
          title="Cancel Procurement Order"
          message={`Are you sure you want to cancel the order for ${cancelTarget?.quantity} ${cancelTarget?.quantityUnit} of ${cancelTarget?.produceName}?`}
          warningText="Cancelling this accepted order will release the reserved inventory stock exactly once. The buyer will be notified immediately."
          confirmText="Confirm Cancellation"
          isDanger={true}
          isLoading={actionLoading}
          onConfirm={confirmCancel}
          onCancel={() => setCancelTarget(null)}
        />

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={!!feedbackTarget}
          order={feedbackTarget}
          onClose={() => setFeedbackTarget(null)}
          onSuccess={() => loadOrders()}
        />
      </div>
    </div>
  );
}
