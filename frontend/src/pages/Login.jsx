import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { LogIn, Sparkles } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(email, password);
      if (data.success && data.user) {
        if (data.user.role === 'farmer') navigate('/farmer/dashboard');
        else if (data.user.role === 'institution') navigate('/institution/dashboard');
        else if (data.user.role === 'admin') navigate('/admin/dashboard');
        else navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogIn size={22} color="var(--primary)" /> {t('navLogin')}
          </h2>
          <LanguageSwitcher />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('email')}</label>
            <input
              type="email"
              className="form-input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. farmer@srgrec.demo"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>{t('password')}</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem' }}>Forgot?</Link>
            </div>
            <input
              type="password"
              className="form-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px', padding: '10px' }}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: '18px', height: '18px' }}></span> : t('navLogin')}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.88rem' }}>
          Don't have an account? <Link to="/register" style={{ fontWeight: 600 }}>{t('navRegister')}</Link>
        </div>

        {/* Demonstration Quick Fill Helper */}
        <div style={{ marginTop: '24px', borderTop: '1px dashed var(--border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
            <Sparkles size={14} color="#d97706" /> Fast Demo Access:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '0.78rem' }}
              onClick={() => fillDemo('farmer.ramesh@srgrec.demo', 'FarmerPass123!')}
            >
              🌱 Demo Farmer: Ramesh Reddy
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '0.78rem' }}
              onClick={() => fillDemo('hostel@srgrec.demo', 'HostelPass123!')}
            >
              🏫 Demo Institution: SRGEC Hostel Mess
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '0.78rem' }}
              onClick={() => fillDemo('admin@srgrec.edu.in', 'AdminSecurePass123!')}
            >
              🛡️ Demo Administrator: SRGEC Admin Officer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
