import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function StatusBadge({ status }) {
  const { t } = useLanguage();

  if (!status) return null;

  const getStyle = () => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'approved':
      case 'active':
      case 'delivered':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
      case 'pending':
      case 'pending_approval':
      case 'open':
        return { bg: '#fef9c3', color: '#a16207', border: '#fef08a' };
      case 'preparing':
      case 'fully_committed':
        return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
      case 'rejected':
      case 'cancelled':
      case 'suspended':
      case 'unavailable':
      case 'deactivated':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
      case 'expired':
      case 'closed':
      case 'archived':
      case 'withdrawn':
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
    }
  };

  const getLabel = () => {
    switch (status.toLowerCase()) {
      case 'pending': return t('statusPending');
      case 'accepted': return t('statusAccepted');
      case 'rejected': return t('statusRejected');
      case 'preparing': return t('statusPreparing');
      case 'delivered': return t('statusDelivered');
      case 'cancelled': return t('statusCancelled');
      case 'active': return t('statusActive');
      case 'unavailable': return t('statusUnavailable');
      case 'expired': return t('statusExpired');
      case 'open': return t('statusOpen');
      case 'closed': return t('statusClosed');
      case 'fully_committed': return t('statusFullyCommitted');
      case 'approved': return t('statusApproved');
      case 'suspended': return t('statusSuspended');
      case 'pending_approval': return t('statusPendingApproval');
      case 'deactivation_requested': return t('statusDeactivationRequested');
      case 'deactivated': return t('statusDeactivated');
      default: return status;
    }
  };

  const style = getStyle();

  return (
    <span
      className="badge"
      style={{
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '0.78rem',
        fontWeight: 600
      }}
    >
      {getLabel()}
    </span>
  );
}
