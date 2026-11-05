import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { UserPlus, Sprout, Building2 } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [role, setRole] = useState('farmer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [villageTown, setVillageTown] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Andhra Pradesh');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (role === 'farmer' && !fullName.trim()) {
      setError('Please provide your full name.');
      setLoading(false);
      return;
    }

    if (role === 'institution' && (!institutionName.trim() || !contactPerson.trim())) {
      setError('Please provide the institution name and contact person.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: email.trim(),
        password,
        role,
        languagePreference: lang,
        profile: {
          fullName: fullName.trim(),
          institutionName: institutionName.trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          villageTown: villageTown.trim(),
          district: district.trim(),
          state: state.trim()
        }
      };

      const data = await register(payload);
      if (data && data.success) {
        setSuccessMsg('Account registered successfully! Redirecting to your dashboard...');
        setTimeout(() => {
          if (role === 'farmer') navigate('/farmer/dashboard');
          else navigate('/institution/dashboard');
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={22} color="var(--primary)" /> {t('navRegister')}
          </h2>
          <LanguageSwitcher />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          {/* Role Choice */}
          <div className="form-group">
            <label className="form-label">I am registering as:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRole('farmer')}
                style={{
                  padding: '12px',
                  border: `2px solid ${role === 'farmer' ? 'var(--primary)' : 'var(--border)'}`,
                  background: role === 'farmer' ? 'var(--primary-light)' : '#fff',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Sprout size={18} color="var(--primary)" /> {t('roleFarmer')}
              </button>

              <button
                type="button"
                onClick={() => setRole('institution')}
                style={{
                  padding: '12px',
                  border: `2px solid ${role === 'institution' ? 'var(--primary)' : 'var(--border)'}`,
                  background: role === 'institution' ? 'var(--primary-light)' : '#fff',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Building2 size={18} color="var(--primary)" /> {t('roleInstitution')}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('email')} *</label>
            <input
              type="email"
              className="form-input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('password')} *</label>
            <input
              type="password"
              className="form-input"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          {/* Role specific profile fields */}
          {role === 'farmer' ? (
            <div className="form-group">
              <label className="form-label">{t('fullName')} *</label>
              <input
                type="text"
                className="form-input"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Reddy"
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">{t('institutionName')} *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. Campus Hostel Mess, Community Dining Hall, Hospital"
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('contactPerson')} *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. K. Srinivasa Rao (Manager / Warden)"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">{t('phone')} *</label>
            <input
              type="tel"
              className="form-input"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98480 12345"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">{t('villageTown')} *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. Gudlavalleru"
                value={villageTown}
                onChange={(e) => setVillageTown(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('district')} *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. Krishna"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '14px', padding: '12px' }}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: '18px', height: '18px' }}></span> : t('navRegister')}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.88rem' }}>
          Already registered? <Link to="/login" style={{ fontWeight: 600 }}>{t('navLogin')}</Link>
        </div>
      </div>
    </div>
  );
}
