import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import StarRating from './StarRating';
import { apiRequest } from '../services/api';

export default function FeedbackModal({ isOpen, order, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/api/feedback', {
        method: 'POST',
        body: {
          orderId: order._id,
          rating,
          comment
        }
      });

      if (data.success) {
        onSuccess && onSuccess(data.feedback);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '6px' }}>
          {t('feedbackTitle')}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
          {order.produceName} ({order.quantity} {order.quantityUnit})
        </p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('ratingLabel')}</label>
            <div style={{ padding: '8px 0' }}>
              <StarRating rating={rating} onChange={setRating} size={28} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('commentLabel')}</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share quality, timely delivery, and coordination feedback..."
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {t('btnCancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : t('btnSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
