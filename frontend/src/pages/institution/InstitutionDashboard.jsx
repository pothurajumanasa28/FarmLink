import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { apiRequest } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { Building2, Search, Plus, ShoppingCart, Layers, AlertCircle, ArrowRight } from 'lucide-react';

export default function InstitutionDashboard() {
  const { user, isApproved } = useAuth();
  const { t } = useLanguage();

  const [orders, setOrders] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersData, reqData] = await Promise.all([
          apiRequest('/api/orders/my'),
          apiRequest('/api/bulk-requirements/my/all')
        ]);

        if (ordersData.success) setOrders(ordersData.orders || []);
        if (reqData.success) setRequirements(reqData.requirements || []);
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const activeOrders = orders.filter((o) => ['accepted', 'preparing'].includes(o.status));
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const openRequirements = requirements.filter((r) => r.status === 'open');

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

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {t('navDashboard')} — {user?.profile?.institutionName || 'Hostel Mess'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Campus Dining & Procurement Console • Seshadri Rao Gudlavalleru Engineering College
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/institution/browse" className="btn btn-primary btn-sm">
              <Search size={16} /> {t('navBrowse')}
            </Link>
            <Link to="/institution/requirements" className="btn btn-secondary btn-sm">
              <Plus size={16} /> {t('btnPostRequirement')}
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4" style={{ marginBottom: '32px' }}>
          <div className="card">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Open Bulk Requirements</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>{openRequirements.length}</h2>
          </div>
          <div className="card">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pending Requests</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#d97706', marginTop: '4px' }}>{pendingOrders.length}</h2>
          </div>
          <div className="card">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Deliveries</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0284c7', marginTop: '4px' }}>{activeOrders.length}</h2>
          </div>
          <div className="card">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Delivered Orders</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>{deliveredOrders.length}</h2>
          </div>
        </div>

        {/* Active Bulk Requirement Progress */}
        <div className="card" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Active Bulk Procurement Progress</h3>
            <Link to="/institution/requirements" style={{ fontSize: '0.85rem' }}>View All Requirements <ArrowRight size={14} /></Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}><div className="spinner"></div></div>
          ) : openRequirements.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
              No active bulk requirements currently posted.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {openRequirements.slice(0, 3).map((req) => {
                const total = req.requiredQuantity || 1;
                const committed = req.committedQuantity || 0;
                const delivered = req.deliveredQuantity || 0;
                const percent = Math.min(100, Math.round(((committed + delivered) / total) * 100));

                return (
                  <div key={req._id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '1.05rem' }}>{req.produceName}</h4>
                      <Link to={`/institution/requirements/${req._id}/offers`} className="btn btn-secondary btn-sm">
                        Review Offers
                      </Link>
                    </div>

                    <div style={{ background: '#e2e8f0', borderRadius: '6px', height: '10px', overflow: 'hidden', marginBottom: '10px' }}>
                      <div
                        style={{
                          background: percent >= 100 ? '#16a34a' : 'var(--primary)',
                          width: `${percent}%`,
                          height: '100%',
                          transition: 'width 0.3s'
                        }}
                      ></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span>Total: <strong>{req.requiredQuantity} {req.quantityUnit}</strong></span>
                      <span>Committed: <strong style={{ color: '#0284c7' }}>{committed} {req.quantityUnit}</strong></span>
                      <span>Delivered: <strong style={{ color: '#16a34a' }}>{delivered} {req.quantityUnit}</strong></span>
                      <span>Remaining: <strong style={{ color: 'var(--primary)' }}>{req.remainingQuantity} {req.quantityUnit}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
