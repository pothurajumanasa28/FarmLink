import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  Sprout,
  Building2,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  Sparkles,
  ClipboardList,
  Lock,
  Truck,
  Layers,
  Scale,
  Users
} from 'lucide-react';

export default function Home() {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setLoadError(false);
        const res = await apiRequest('/api/listings/search');
        if (res.success) {
          setFeaturedListings((res.listings || []).slice(0, 4));
        } else {
          setLoadError(true);
        }
      } catch (err) {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="page-wrapper" style={{ paddingTop: 0 }}>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #134e1a 0%, #1e6b27 50%, #2e7d32 100%)',
          color: '#fff',
          padding: '64px 0 72px 0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative background circles */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none'
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center' }} className="hero-grid">
            <div>
              {/* Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(4px)',
                  padding: '6px 16px',
                  borderRadius: '30px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.25)'
                }}
              >
                <Sprout size={16} color="#86efac" />
                <span>{t('tagline')}</span>
              </div>

              {/* Main Headline */}
              <h1
                style={{
                  fontSize: '2.6rem',
                  fontWeight: 800,
                  lineHeight: 1.2,
                  marginBottom: '20px',
                  letterSpacing: '-0.02em'
                }}
              >
                {t('heroHeadline')}
              </h1>

              {/* Subtext */}
              <p
                style={{
                  fontSize: '1.12rem',
                  lineHeight: 1.65,
                  opacity: 0.92,
                  marginBottom: '32px',
                  maxWidth: '560px'
                }}
              >
                {t('heroSubtext')}
              </p>

              {/* Hero Action Buttons */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link
                  to="/browse"
                  className="btn"
                  style={{
                    background: '#fff',
                    color: '#1b5e20',
                    fontWeight: 700,
                    padding: '14px 28px',
                    fontSize: '1.05rem',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <ShoppingBag size={20} /> {t('btnBrowseProduce')}
                </Link>

                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/register"
                      className="btn"
                      style={{
                        background: 'rgba(255, 255, 255, 0.18)',
                        color: '#fff',
                        fontWeight: 600,
                        padding: '14px 24px',
                        fontSize: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <Sprout size={18} /> {t('btnFarmerAction')}
                    </Link>
                    <Link
                      to="/login"
                      className="btn"
                      style={{
                        background: 'transparent',
                        color: '#e2e8f0',
                        padding: '14px 20px',
                        fontSize: '0.95rem'
                      }}
                    >
                      {t('navLogin')}
                    </Link>
                  </>
                ) : (
                  <Link
                    to={
                      user?.role === 'farmer'
                        ? '/farmer/dashboard'
                        : user?.role === 'institution'
                        ? '/institution/dashboard'
                        : '/admin/dashboard'
                    }
                    className="btn"
                    style={{
                      background: 'rgba(255, 255, 255, 0.18)',
                      color: '#fff',
                      fontWeight: 600,
                      padding: '14px 24px',
                      fontSize: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.4)'
                    }}
                  >
                    Go to {user?.role.toUpperCase()} Dashboard <ArrowRight size={18} />
                  </Link>
                )}
              </div>
            </div>

            {/* Farm & Produce Visual Illustration (Crisp, Fast SVG Vector) */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="hero-illustration">
              <svg
                viewBox="0 0 460 360"
                style={{ width: '100%', maxWidth: '420px', height: 'auto', filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.2))' }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#81c784" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id="hill1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#43a047" />
                    <stop offset="100%" stopColor="#2e7d32" />
                  </linearGradient>
                  <linearGradient id="hill2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#66bb6a" />
                    <stop offset="100%" stopColor="#388e3c" />
                  </linearGradient>
                  <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>

                {/* Back card */}
                <rect x="10" y="10" width="440" height="340" rx="24" fill="url(#skyGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />

                {/* Morning Sun */}
                <circle cx="340" cy="80" r="38" fill="url(#sunGrad)" opacity="0.9" />
                <circle cx="340" cy="80" r="48" fill="none" stroke="#fef08a" strokeWidth="2" strokeDasharray="6 6" opacity="0.6" />

                {/* Clouds */}
                <path d="M70 70 q15 -20 35 0 q20 -15 35 0 q15 20 0 20 h-70 q-15 0 0 -20 z" fill="#ffffff" opacity="0.35" />
                <path d="M190 90 q12 -16 28 0 q16 -12 28 0 q12 16 0 16 h-56 q-12 0 0 -16 z" fill="#ffffff" opacity="0.25" />

                {/* Rolling Farm Hills */}
                <path d="M10 260 Q120 180 240 230 T450 210 L450 350 L10 350 Z" fill="url(#hill2)" opacity="0.8" />
                <path d="M10 270 Q160 210 300 270 T450 250 L450 350 L10 350 Z" fill="url(#hill1)" />

                {/* Crop Rows Contour Lines */}
                <path d="M40 330 Q180 275 380 310" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" />
                <path d="M20 305 Q190 250 420 280" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />

                {/* Barn & Silo Silhouette */}
                <rect x="70" y="215" width="45" height="35" rx="3" fill="#ffffff" opacity="0.9" />
                <polygon points="65,215 92,192 120,215" fill="#ef4444" opacity="0.95" />
                <rect x="122" y="200" width="16" height="50" rx="3" fill="#e2e8f0" opacity="0.9" />
                <path d="M122 200 Q130 190 138 200 Z" fill="#94a3b8" />

                {/* Farmer Sprout Vector */}
                <g transform="translate(230, 250)">
                  <circle cx="20" cy="20" r="28" fill="#ffffff" />
                  <path d="M20 38 V20 M20 25 Q10 20 8 10 Q18 10 20 25 M20 22 Q30 18 32 8 Q22 8 20 22" stroke="#16a34a" strokeWidth="3" fill="#86efac" strokeLinecap="round" strokeLinejoin="round" />
                </g>

                {/* Floating Metric Badge */}
                <g transform="translate(240, 140)">
                  <rect x="0" y="0" width="175" height="58" rx="12" fill="#ffffff" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.15))" />
                  <circle cx="26" cy="29" r="16" fill="#e8f5e9" />
                  <path d="M20 29 L24 33 L32 23" stroke="#2e7d32" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <text x="50" y="26" fill="#0f172a" fontSize="12" fontWeight="700" fontFamily="sans-serif">Direct Sourcing</text>
                  <text x="50" y="42" fill="#16a34a" fontSize="11" fontWeight="600" fontFamily="sans-serif">100% Commission-Free</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Two Prominent Feature Cards: Farmer vs Institution */}
      <section className="container" style={{ marginTop: '-36px', marginBottom: '64px', position: 'relative', zIndex: 10 }}>
        <div className="grid grid-cols-2" style={{ gap: '24px' }}>
          {/* Farmer Card */}
          <div
            className="card"
            style={{
              padding: '32px',
              borderTop: '4px solid var(--primary)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#fff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ background: '#e8f5e9', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                  <Sprout size={28} color="var(--primary)" />
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', fontWeight: 700 }}>
                    For Growers
                  </span>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                    {t('cardFarmerTitle')}
                  </h3>
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
                {t('cardFarmerDesc')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="var(--primary)" />
                  <span>Direct connection to verified campus dining halls & messes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="var(--primary)" />
                  <span>Real-time stock reservation prevents accidental double-selling</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="var(--primary)" />
                  <span>Bid on recurring bulk institutional tenders with partial capacity</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="var(--primary)" />
                  <span>Guaranteed fair rates in ₹ without commission cuts</span>
                </div>
              </div>
            </div>

            <div>
              <Link to="/register" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                {t('cardFarmerAction')} <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Institution Card */}
          <div
            className="card"
            style={{
              padding: '32px',
              borderTop: '4px solid #d97706',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#fff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                  <Building2 size={28} color="#d97706" />
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#d97706', fontWeight: 700 }}>
                    For Dining & Canteens
                  </span>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                    {t('cardInstitutionTitle')}
                  </h3>
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
                {t('cardInstitutionDesc')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="#d97706" />
                  <span>Browse live produce by crop, saved location, quantity, and price</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="#d97706" />
                  <span>Post weekly and monthly bulk requirements with real-time bidding</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="#d97706" />
                  <span>Direct producer verification with mutual ratings upon delivery</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="#d97706" />
                  <span>Traceable origin from local regional farm clusters</span>
                </div>
              </div>
            </div>

            <div>
              <Link to="/browse" className="btn btn-secondary" style={{ width: '100%', padding: '12px', border: '1px solid #d97706', color: '#b45309' }}>
                {t('cardInstitutionAction')} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section (3 Simple Steps) */}
      <section style={{ background: '#f8fafc', padding: '60px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '64px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px auto' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Simple & Transparent
            </span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-main)' }}>
              {t('howItWorksTitle')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
              Designed to make agricultural trade between local growers and institutions effortless, direct, and reliable.
            </p>
          </div>

          <div className="grid grid-cols-3" style={{ gap: '28px' }}>
            {/* Step 1 */}
            <div className="card" style={{ padding: '28px', background: '#fff', border: '1px solid var(--border)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-14px', left: '24px', background: 'var(--primary)', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                1
              </div>
              <div style={{ background: 'var(--primary-light)', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', marginTop: '6px' }}>
                <ClipboardList size={24} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>
                {t('step1Title')}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {t('step1Desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="card" style={{ padding: '28px', background: '#fff', border: '1px solid var(--border)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-14px', left: '24px', background: 'var(--primary)', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                2
              </div>
              <div style={{ background: '#fef3c7', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', marginTop: '6px' }}>
                <Lock size={24} color="#d97706" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>
                {t('step2Title')}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {t('step2Desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="card" style={{ padding: '28px', background: '#fff', border: '1px solid var(--border)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-14px', left: '24px', background: 'var(--primary)', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                3
              </div>
              <div style={{ background: '#e0f2fe', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', marginTop: '6px' }}>
                <Truck size={24} color="#0284c7" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>
                {t('step3Title')}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {t('step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Available Produce Section */}
      <section className="container" style={{ marginBottom: '64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Live Marketplace
            </span>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              {t('featuredProduceTitle')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {t('featuredProduceSubtitle')}
            </p>
          </div>
          <Link to="/browse" className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }}>
            {t('btnBrowseProduce')} <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading live marketplace listings...</p>
          </div>
        ) : loadError ? (
          <div className="alert alert-warning" style={{ justifyContent: 'center' }}>
            Unable to fetch live listings right now. Please verify your connection or try again.
          </div>
        ) : featuredListings.length === 0 ? (
          <div className="card empty-state" style={{ background: '#fff' }}>
            <Sprout size={36} color="var(--primary)" />
            <h4 style={{ fontWeight: 600, marginTop: '8px' }}>{t('noListingsFound')}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Check back soon or publish an institutional bulk requirement for farmers to bid on.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4">
            {featuredListings.map((listing) => (
              <div
                key={listing._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px',
                  background: '#fff',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                      {listing.produceName}
                    </h4>
                    <StatusBadge status={listing.status} />
                  </div>

                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px' }}>
                    ₹{listing.pricePerUnit}{' '}
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                      / {listing.quantityUnit}
                    </span>
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      marginBottom: '12px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Available Stock:</span>
                      <strong style={{ color: 'var(--primary)' }}>
                        {listing.unreservedQuantity} {listing.quantityUnit}
                      </strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="#64748b" />
                      <span>{listing.villageTown}, {listing.district}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#64748b" />
                      <span>Available until: {new Date(listing.availabilityDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '18px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <Link to="/browse" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                    <ShoppingBag size={14} /> {t('btnRequestQuantity')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Concise Benefits Section */}
      <section className="container" style={{ marginBottom: '64px' }}>
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 40px auto' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Built for Transparency
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-main)' }}>
            {t('benefitsTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-4">
          <div className="card" style={{ padding: '24px', background: '#fff' }}>
            <div style={{ background: '#e8f5e9', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Sprout size={22} color="var(--primary)" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>
              {t('benefit1Title')}
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.55 }}>
              {t('benefit1Desc')}
            </p>
          </div>

          <div className="card" style={{ padding: '24px', background: '#fff' }}>
            <div style={{ background: '#fef3c7', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Scale size={22} color="#d97706" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>
              {t('benefit2Title')}
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.55 }}>
              {t('benefit2Desc')}
            </p>
          </div>

          <div className="card" style={{ padding: '24px', background: '#fff' }}>
            <div style={{ background: '#e0f2fe', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Layers size={22} color="#0284c7" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>
              {t('benefit3Title')}
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.55 }}>
              {t('benefit3Desc')}
            </p>
          </div>

          <div className="card" style={{ padding: '24px', background: '#fff' }}>
            <div style={{ background: '#f3e8ff', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Users size={22} color="#7e22ce" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>
              {t('benefit4Title')}
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.55 }}>
              {t('benefit4Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Project & Community Context Banner */}
      <section className="container" style={{ marginBottom: '40px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #e8f5e9 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-md)',
            padding: '24px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.88rem' }}>
              <ShieldCheck size={18} /> Community Service Project Initiative
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', marginTop: '4px', maxWidth: '640px' }}>
              {t('collegeAttribution')} — bridging regional agriculture with educational and institutional dining facilities.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/browse" className="btn btn-primary btn-sm">
              {t('btnBrowseProduce')}
            </Link>
          </div>
        </div>
      </section>

      {/* Responsive Style Overrides */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .hero-grid > div:first-child {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hero-illustration {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
