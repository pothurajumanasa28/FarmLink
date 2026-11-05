import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationBell from './NotificationBell';
import { Sprout, Menu, X, User, LogOut, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Platform utility banner */}
      <div style={{ background: 'var(--primary)', color: '#fff', padding: '5px 16px', fontSize: '0.8rem', textAlign: 'center', fontWeight: 500, letterSpacing: '0.02em' }}>
        {t('tagline')}
      </div>

      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ background: 'var(--primary-light)', padding: '9px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sprout size={24} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              Farm<span style={{ color: 'var(--primary)' }}>Link</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {t('appSubtitle')}
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }} className="desktop-nav">
          <Link to="/" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
            {t('navHome')}
          </Link>
          <Link to="/browse" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
            {t('navBrowse')}
          </Link>

          {isAuthenticated && user?.role === 'farmer' && (
            <>
              <Link to="/farmer/dashboard" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
                {t('navDashboard')}
              </Link>
              <Link to="/farmer/listings" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
                {t('navMyListings')}
              </Link>
              <Link to="/farmer/orders" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
                {t('navMyOrders')}
              </Link>
              <Link to="/farmer/bulk-offers" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
                {t('navRequirements')}
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === 'institution' && (
            <>
              <Link to="/institution/dashboard" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
                {t('navDashboard')}
              </Link>
              <Link to="/institution/browse" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
                {t('navBrowse')}
              </Link>
              <Link to="/institution/requirements" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
                {t('navRequirements')}
              </Link>
              <Link to="/institution/orders" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
                {t('navMyOrders')}
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === 'admin' && (
            <>
              <Link to="/admin/dashboard" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
                {t('navAdmin')}
              </Link>
              <Link to="/admin/users" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
                User Governance
              </Link>
              <Link to="/admin/complaints" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
                Complaints & Disputes
              </Link>
            </>
          )}

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: '12px' }}>
            <LanguageSwitcher />

            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Link
                  to="/profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#f1f5f9'
                  }}
                >
                  <User size={16} />
                  <span>{user.role}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px'
                  }}
                  title={t('navLogout')}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  {t('navLogin')}
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  {t('navRegister')}
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile menu toggle */}
        <div style={{ display: 'none' }} className="mobile-toggle">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'none', border: 'none', padding: '8px' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>{t('navHome')}</Link>
            <Link to="/browse" onClick={() => setMobileMenuOpen(false)}>{t('navBrowse')}</Link>
            {isAuthenticated && user?.role === 'farmer' && (
              <>
                <Link to="/farmer/dashboard" onClick={() => setMobileMenuOpen(false)}>{t('navDashboard')}</Link>
                <Link to="/farmer/listings" onClick={() => setMobileMenuOpen(false)}>{t('navMyListings')}</Link>
                <Link to="/farmer/orders" onClick={() => setMobileMenuOpen(false)}>{t('navMyOrders')}</Link>
                <Link to="/farmer/bulk-offers" onClick={() => setMobileMenuOpen(false)}>{t('navRequirements')}</Link>
              </>
            )}
            {isAuthenticated && user?.role === 'institution' && (
              <>
                <Link to="/institution/dashboard" onClick={() => setMobileMenuOpen(false)}>{t('navDashboard')}</Link>
                <Link to="/institution/browse" onClick={() => setMobileMenuOpen(false)}>{t('navBrowse')}</Link>
                <Link to="/institution/requirements" onClick={() => setMobileMenuOpen(false)}>{t('navRequirements')}</Link>
                <Link to="/institution/orders" onClick={() => setMobileMenuOpen(false)}>{t('navMyOrders')}</Link>
              </>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <>
                <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>{t('navAdmin')}</Link>
                <Link to="/admin/users" onClick={() => setMobileMenuOpen(false)}>User Governance</Link>
                <Link to="/admin/complaints" onClick={() => setMobileMenuOpen(false)}>Complaints & Disputes</Link>
              </>
            )}
            <hr style={{ border: 0, borderTop: '1px solid var(--border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <LanguageSwitcher />
              {isAuthenticated ? (
                <button type="button" onClick={handleLogout} className="btn btn-secondary btn-sm">
                  {t('navLogout')}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to="/login" className="btn btn-secondary btn-sm" onClick={() => setMobileMenuOpen(false)}>{t('navLogin')}</Link>
                  <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMobileMenuOpen(false)}>{t('navRegister')}</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </header>
  );
}
