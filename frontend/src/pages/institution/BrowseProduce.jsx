import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { apiRequest } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  Search,
  ShoppingBag,
  MapPin,
  Calendar,
  AlertCircle,
  Filter,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import ReportModal from '../../components/ReportModal';

export default function BrowseProduce() {
  const { user, isAuthenticated, isApproved } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [reportListing, setReportListing] = useState(null);

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Search & Filters (All query real saved database fields)
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minQtyFilter, setMinQtyFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Request Modal State
  const [targetListing, setTargetListing] = useState(null);
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqDate, setReqDate] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchListings = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('produce', searchTerm.trim());
      if (locationFilter.trim()) params.append('location', locationFilter.trim());
      if (minQtyFilter && !isNaN(Number(minQtyFilter))) params.append('minQuantity', minQtyFilter);
      if (minPrice && !isNaN(Number(minPrice))) params.append('minPrice', minPrice);
      if (maxPrice && !isNaN(Number(maxPrice))) params.append('maxPrice', maxPrice);

      if (sortBy === 'price_asc') {
        params.append('sortBy', 'price_asc');
      } else if (sortBy === 'price_desc') {
        params.append('sortBy', 'price_desc');
      } else if (sortBy === 'availability') {
        params.append('sortBy', 'availability');
      } else {
        params.append('sortBy', 'newest');
      }

      const res = await apiRequest(`/api/listings/search?${params.toString()}`);
      if (res.success) {
        setListings(res.listings || []);
      } else {
        setFetchError(res.message || 'Unable to retrieve produce listings.');
      }
    } catch (err) {
      setFetchError(err.message || 'Failed to connect to the marketplace service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setMinQtyFilter('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setTimeout(() => {
      fetchListings();
    }, 10);
  };

  const handleOrderClick = (listing) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'institution') {
      return;
    }
    if (!isApproved) {
      return;
    }

    setTargetListing(listing);
    setReqQuantity('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    setReqDate(tomorrow.toISOString().split('T')[0]);
    setReqNotes('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiRequest('/api/orders/individual', {
        method: 'POST',
        body: {
          listingId: targetListing._id,
          quantity: Number(reqQuantity),
          requiredDate: reqDate,
          notes: reqNotes
        }
      });

      if (res.success) {
        setSuccessMsg('Order request submitted successfully! Farmer will review and confirm.');
        setTimeout(() => {
          setTargetListing(null);
          fetchListings();
        }, 1600);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error submitting order request.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header Title & Context */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            <Sparkles size={16} /> Verified Produce Marketplace
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {t('navBrowse')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '720px', marginTop: '4px' }}>
            Discover fresh harvests directly from verified local growers. Search by crop name, saved village or district location, quantity requirements, and price.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="card" style={{ marginBottom: '32px', padding: '24px', background: '#fff', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSearchSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              {/* Keyword Produce Search */}
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  Crop / Produce Name
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rice, Tomato, Milk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Real Saved Location Search */}
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  Location (Town / District)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Gudlavalleru, Krishna..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>

              {/* Min Quantity Available */}
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  Min Available Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 50"
                  value={minQtyFilter}
                  onChange={(e) => setMinQtyFilter(e.target.value)}
                />
              </div>

              {/* Price Range */}
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  Price (₹/unit)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="Min ₹"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="Max ₹"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  Sort By
                </label>
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Recently Listed</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="availability">Available Date (Earliest)</option>
                </select>
              </div>
            </div>

            {/* Filter Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {listings.length} {listings.length === 1 ? 'produce item' : 'produce items'} currently matching
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetFilters}
                  title="Clear all search filters"
                >
                  <RotateCcw size={14} /> Reset Filters
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  <Search size={15} /> Apply Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Listings Display Area */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '14px', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Searching active produce listings across verified regional farms...
            </p>
          </div>
        ) : fetchError ? (
          <div className="alert alert-danger" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={20} />
              <span>{fetchError}</span>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={fetchListings}>
              Try Again
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="card empty-state" style={{ padding: '60px 20px', background: '#fff' }}>
            <AlertCircle size={40} color="#94a3b8" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '12px', color: 'var(--text-main)' }}>
              {t('noListingsFound')}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '480px', margin: '8px auto 20px auto' }}>
              No active listings match your current filters. Try resetting the filters or searching for another crop name or location.
            </p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetFilters}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3" style={{ gap: '22px' }}>
            {listings.map((item) => {
              const canOrder = isAuthenticated && user?.role === 'institution' && isApproved;
              const isPending = isAuthenticated && user?.role === 'institution' && !isApproved;

              return (
                <div
                  key={item._id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '22px',
                    background: '#fff',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div>
                    {/* Header: Title + Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {item.produceName}
                      </h3>
                      <StatusBadge status={item.status} />
                    </div>

                    {/* Price per Unit */}
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>
                      ₹{item.pricePerUnit}{' '}
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                        / {item.quantityUnit}
                      </span>
                    </div>

                    {/* Available Stock Box */}
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        marginBottom: '14px',
                        fontSize: '0.88rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Available Stock:</span>
                        <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
                          {item.unreservedQuantity} {item.quantityUnit}
                        </strong>
                      </div>
                    </div>

                    {/* Verified Location & Details */}
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>
                        <strong>Farmer:</strong> {item.farmer?.profile?.fullName || 'Verified Local Farmer'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={15} color="var(--primary)" />
                        <span>{item.villageTown}, {item.district}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={15} color="#64748b" />
                        <span>Available until: {new Date(item.availabilityDate).toLocaleDateString()}</span>
                      </div>
                      {item.description && (
                        <p style={{ marginTop: '6px', fontSize: '0.82rem', color: '#475569', fontStyle: 'italic', lineHeight: 1.4 }}>
                          "{item.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Order Action Button */}
                  <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    {!isAuthenticated ? (
                      <Link
                        to="/login"
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        Sign in to Order <ArrowRight size={14} />
                      </Link>
                    ) : user?.role === 'farmer' ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled
                        style={{ width: '100%', justifyContent: 'center', cursor: 'default' }}
                      >
                        Farmer Preview View
                      </button>
                    ) : isPending ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled
                        style={{ width: '100%', justifyContent: 'center' }}
                        title="Your institution account is pending administrator approval"
                      >
                        <Lock size={14} /> Approval Pending
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => handleOrderClick(item)}
                        >
                          <ShoppingBag size={14} /> {t('btnRequestQuantity')}
                        </button>
                        {isAuthenticated && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            title="Report this produce listing"
                            onClick={() => setReportListing(item)}
                            style={{ padding: '6px 10px', color: '#b91c1c' }}
                          >
                            <AlertTriangle size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Order Request Modal */}
        {targetListing && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Request Produce: {targetListing.produceName}
                </h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '18px' }}>
                Direct rate: <strong>₹{targetListing.pricePerUnit} / {targetListing.quantityUnit}</strong> • Available stock:{' '}
                <strong>{targetListing.unreservedQuantity} {targetListing.quantityUnit}</strong>
              </p>

              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
              {successMsg && (
                <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSendRequest}>
                <div className="form-group">
                  <label className="form-label">
                    Quantity Needed ({targetListing.quantityUnit}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    max={targetListing.unreservedQuantity}
                    className="form-input"
                    required
                    value={reqQuantity}
                    onChange={(e) => setReqQuantity(e.target.value)}
                    placeholder={`Up to ${targetListing.unreservedQuantity}`}
                  />
                  {reqQuantity > 0 && (
                    <div style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 700, marginTop: '6px' }}>
                      Estimated Order Total: ₹{(Number(reqQuantity) * targetListing.pricePerUnit).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">{t('requiredDate')} *</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={reqDate}
                    onChange={(e) => setReqDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('notes')}</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                    placeholder="e.g. Preferred delivery gate, packaging preference, timing notes..."
                  ></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setTargetListing(null)}
                    disabled={actionLoading}
                  >
                    {t('btnCancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Submitting...' : 'Send Order Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Listing Report / Dispute Modal */}
        <ReportModal
          isOpen={!!reportListing}
          onClose={() => setReportListing(null)}
          targetType="listing"
          targetId={reportListing?._id}
          targetTitle={reportListing ? `${reportListing.produceName} (by ${reportListing.farmer?.profile?.fullName || 'Farmer'})` : ''}
        />
      </div>
    </div>
  );
}
