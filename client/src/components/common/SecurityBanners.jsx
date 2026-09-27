import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { authService } from '../../services/authService.js';
import { Mail, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';

export function SecurityBanners() {
  const { user, login } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelStatus, setCancelStatus] = useState(null);

  if (!user) return null;

  const handleResendVerification = async () => {
    setResending(true);
    setResendStatus(null);
    try {
      const res = await authService.resendVerification(user.email);
      setResendStatus({
        success: true,
        message: res?.message || res?.data?.message || 'Verification email dispatched!'
      });
    } catch (err) {
      setResendStatus({
        success: false,
        message: err?.message || 'Failed to resend verification email'
      });
    } finally {
      setResending(false);
    }
  };

  const handleCancelDeletion = async () => {
    setCancelling(true);
    try {
      await authService.cancelDeletion();
      setCancelStatus('Deletion request successfully cancelled.');
      // Refresh user profile
      const updatedUser = await authService.getMe();
      if (updatedUser) {
        user.pendingDeletion = false;
        user.deletionScheduledAt = null;
      }
    } catch (err) {
      setCancelStatus(err.message || 'Failed to cancel deletion');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      {/* 3-Day Grace Period Account Deletion Warning Banner */}
      {user.pendingDeletion && (
        <div style={{
          backgroundColor: '#ef4444',
          color: '#ffffff',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} />
            <span>
              <strong>Action Notice:</strong> Your account is scheduled for permanent anonymization on{' '}
              {user.deletionScheduledAt ? new Date(user.deletionScheduledAt).toLocaleDateString() : 'soon'}.
            </span>
          </div>

          <button
            onClick={handleCancelDeletion}
            disabled={cancelling}
            className="btn"
            style={{
              backgroundColor: '#ffffff',
              color: '#ef4444',
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '40px'
            }}
          >
            <RotateCcw size={14} />
            {cancelling ? 'Cancelling...' : 'Cancel Deletion'}
          </button>
        </div>
      )}

      {/* Unverified Email Warning Banner */}
      {user.isVerified === false && (
        <div style={{
          backgroundColor: '#eff6ff',
          color: '#1e40af',
          borderBottom: '1px solid #bfdbfe',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} color="#2563eb" />
            <span>
              Please verify your email address (<strong>{user.email}</strong>) to activate all notifications.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {resendStatus && (
              <span style={{ fontSize: '13px', color: resendStatus.success ? '#16a34a' : '#dc2626' }}>
                {resendStatus.message}
              </span>
            )}
            <button
              onClick={handleResendVerification}
              disabled={resending}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontWeight: '600',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '13px',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
