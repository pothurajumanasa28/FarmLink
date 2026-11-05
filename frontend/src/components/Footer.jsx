import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Sprout, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '48px 0 24px 0', marginTop: 'auto', borderTop: '1px solid #1e293b' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
          {/* Brand & Purpose */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(46, 125, 50, 0.2)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                <Sprout size={20} color="#4ade80" />
              </div>
              <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>
                Farm<span style={{ color: '#4ade80' }}>Link</span>
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#cbd5e1', marginBottom: '12px' }}>
              {t('tagline')}
            </p>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#94a3b8' }}>
              {t('appDescription')}
            </p>
          </div>

          {/* Direct Marketplace Links */}
          <div>
            <h5 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Marketplace
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <Link to="/browse" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}>
                {t('navBrowse')}
              </Link>
              <Link to="/register" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                {t('cardFarmerAction')}
              </Link>
              <Link to="/register" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                {t('cardInstitutionAction')}
              </Link>
              <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                {t('navLogin')}
              </Link>
            </div>
          </div>

          {/* Project & College Attribution */}
          <div>
            <h5 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Project Attribution
            </h5>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#cbd5e1', marginBottom: '8px' }}>
              <strong>{t('collegeName')}</strong>
            </p>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.5, color: '#94a3b8', marginBottom: '12px' }}>
              {t('collegeAttribution')}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', color: '#cbd5e1' }}>
              <ShieldCheck size={14} color="#4ade80" /> Strict Zero-Commission Direct Trade
            </div>
          </div>
        </div>

        {/* Bottom Credits & Discreet Admin Access */}
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem' }}>
          <div>
            © {new Date().getFullYear()} FarmLink. Community Service Project (CSP) & Computer Science Engineering.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ color: '#64748b' }}>Currency: INR (₹)</span>
            <Link
              to="/login"
              style={{
                color: '#64748b',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                border: '1px solid #334155',
                padding: '4px 10px',
                borderRadius: '4px'
              }}
              title="Secure Admin Login"
            >
              {t('adminAccessLink')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
