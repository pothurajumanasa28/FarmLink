import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  warningText = '',
  confirmText = '',
  cancelText = '',
  isDanger = false,
  isLoading = false,
  onConfirm,
  onCancel
}) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" role="dialog" aria-modal="true">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          {isDanger && <AlertTriangle color="var(--danger)" size={24} />}
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>{title || t('btnConfirm')}</h3>
        </div>

        <p style={{ color: 'var(--text-main)', marginBottom: '16px', fontSize: '0.95rem' }}>
          {message}
        </p>

        {warningText && (
          <div className="alert alert-warning" style={{ fontSize: '0.85rem' }}>
            <span>{warningText}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText || t('btnCancel')}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? <span className="spinner" style={{ width: '16px', height: '16px' }}></span> : (confirmText || t('btnConfirm'))}
          </button>
        </div>
      </div>
    </div>
  );
}
