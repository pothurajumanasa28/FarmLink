import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { lang, changeLanguage } = useLanguage();
  const { isAuthenticated } = useAuth();

  const handleToggle = async (newLang) => {
    changeLanguage(newLang);
    if (isAuthenticated) {
      try {
        await apiRequest('/api/auth/language', {
          method: 'PATCH',
          body: { languagePreference: newLang }
        });
      } catch (err) {
        // silent fail on background preference save
      }
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <Globe size={16} color="var(--primary)" />
      <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => handleToggle('en')}
          style={{
            padding: '4px 8px',
            fontSize: '0.8rem',
            border: 'none',
            background: lang === 'en' ? 'var(--primary)' : '#fff',
            color: lang === 'en' ? '#fff' : 'var(--text-main)',
            fontWeight: lang === 'en' ? '600' : '400',
            cursor: 'pointer'
          }}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => handleToggle('te')}
          style={{
            padding: '4px 8px',
            fontSize: '0.8rem',
            border: 'none',
            background: lang === 'te' ? 'var(--primary)' : '#fff',
            color: lang === 'te' ? '#fff' : 'var(--text-main)',
            fontWeight: lang === 'te' ? '600' : '400',
            cursor: 'pointer'
          }}
        >
          తెలుగు
        </button>
      </div>
    </div>
  );
}
