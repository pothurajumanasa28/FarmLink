import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { apiRequest } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { Sprout, ShoppingBag, Layers, AlertCircle, ArrowRight, Check, X } from 'lucide-react';

export default function FarmerDashboard() {
  const { user, isApproved } = useAuth();
  const { t } = useLanguage();

  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [listingsData, ordersData] = await Promise.all([
        apiRequest('/api/listings/my/all'),
        apiRequest('/api/orders/my')
      ]);

      if (listingsData.success) setListings(listingsData.listings || []);
      if (ordersData.success) setOrders(ordersData.orders || []);
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRespond = async (orderId, action) => {
    setActionLoading(true);
    try {
      await apiRequest(`/api/orders/${orderId}/respond`, {
        method: 'PATCH',
        body: { action }
      });
      await loadDashboardData();
    } catch (err) {
      alert(err.message || 'Error responding to order request.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRequests = orders.filter((o) => o.status === 'pending');
  const activeOrders = orders.filter((o) => ['accepted', 'preparing'].includes(o.status));
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Verification Status Banner */}
        {!isApproved && (
          <div className="alert alert-warning" style={{ marginBottom: '24px' }}>
            <AlertCircle size={20} />
            <div>
              <div style={{ fontWeight: 600 }}>{t('statusPendingApproval')}</div>
              <div>{t('pendingApprovalBanner')}</div>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {t('navDashboard')} — {user?.profile?.fullName || 'Farmer'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {user?.profile?.villageTown}, {user?.profile?.district} • College Procurement Portal
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/farmer/listings" className="btn btn-primary btn-sm">
              <Sprout size={16} /> {t('btnCreateListing')}
            </Link>
            <Link to="/farmer/bulk-offers" className="btn btn-secondary btn-sm">
              <Layers size={16} /> Browse Bulk Requirements
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4" style={{ marginBottom: '32px' }}>
          <div className="card">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>My Produce Listings</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>{listings.length}</h2>
          </div>
          <div className="card">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>New Order Requests</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#d97706', marginTop: '4px' }}>{pendingRequests.length}</h2>
          </div>
          <div className="card">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Orders</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0284c7', marginTop: '4px' }}>{activeOrders.length}</h2>
          </div>
          <div className="card">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fulfilled Deliveries</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>{deliveredOrders.length}</h2>
          </div>
        </div>

        {/* Incoming Individual Order Requests */}
        <div className="card" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>
              Incoming Order Requests ({pendingRequests.length})
            </h3>
            <Link to="/farmer/orders" style={{ fontSize: '0.85rem' }}>View All Orders <ArrowRight size={14} /></Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}><div className="spinner"></div></div>
          ) : pendingRequests.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
              No pending individual order requests right now.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingRequests.map((req) => (
                <div
                  key={req._id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
                      {req.produceName}
                    </h4>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Requested: <strong>{req.quantity} {req.quantityUnit}</strong> @ ₹{req.pricePerUnit}/{req.quantityUnit} = <strong>₹{req.totalAmount}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      By: {req.institution?.profile?.institutionName || 'College Hostel/Canteen'} • Need By: {new Date(req.requiredDate).toLocaleDateString()}
                    </div>
                    {req.notes && (
                      <div style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '4px', color: '#475569' }}>
                        Note: "{req.notes}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRespond(req._id, 'reject')}
                      disabled={actionLoading}
                    >
                      <X size={14} /> {t('btnReject')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleRespond(req._id, 'accept')}
                      disabled={actionLoading}
                    >
                      <Check size={14} /> {t('btnAccept')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
