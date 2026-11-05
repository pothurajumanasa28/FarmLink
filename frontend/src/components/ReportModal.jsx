import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, targetType, targetId, targetTitle }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || !description.trim()) {
      setError('Please provide both a reason and a detailed description.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiRequest('/api/complaints', {
        method: 'POST',
        body: {
          targetType,
          targetId,
          reason: reason.trim(),
          description: description.trim()
        }
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setReason('');
          setDescription('');
          onClose();
        }, 1800);
      } else {
        setError(res.message || 'Failed to submit report.');
      }
    } catch (err) {
      setError(err.message || 'Error submitting report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c' }}>
            <AlertTriangle size={20} /> Report {targetType}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {targetTitle && (
          <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.85rem' }}>
            <strong>Target:</strong> {targetTitle}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <CheckCircle2 size={44} color="#16a34a" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontWeight: 600, color: '#16a34a', marginBottom: '6px' }}>Report Submitted</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Thank you. Platform administrators have received your report and will investigate.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Reason for Report *</label>
              <select
                className="form-select"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Select a reason...</option>
                <option value="Misleading Information or Pricing">Misleading Information or Pricing</option>
                <option value="Unfulfilled or Violated Commitment">Unfulfilled or Violated Commitment</option>
                <option value="Substandard Produce Quality">Substandard Produce Quality</option>
                <option value="Inappropriate or Abusive Conduct">Inappropriate or Abusive Conduct</option>
                <option value="Suspected Fraud or Impersonation">Suspected Fraud or Impersonation</option>
                <option value="Other Policy Violation">Other Policy Violation</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Explanation *</label>
              <textarea
                className="form-textarea"
                rows={4}
                required
                placeholder="Please describe the issue clearly with relevant facts..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-danger"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
