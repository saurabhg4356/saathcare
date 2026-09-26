import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isExpiredOrInvalid, setIsExpiredOrInvalid] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      const msg = err.message || 'Failed to reset password';
      setError(msg);
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setIsExpiredOrInvalid(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ccfbf1',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
              Password Reset Complete
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
              Your password has been successfully updated. All previous active sessions have been invalidated for security.
            </p>
            <Link
              to="/login"
              className="btn btn-primary"
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '44px'
              }}
            >
              Sign In with New Password
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#ccfbf1',
                color: '#0d9488',
                marginBottom: '12px'
              }}>
                <Lock size={26} />
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 6px 0' }}>
                Create New Password
              </h1>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                Enter your new secure password below.
              </p>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p style={{ margin: 0 }}>{error}</p>
                  {isExpiredOrInvalid && (
                    <div style={{ marginTop: '10px' }}>
                      <Link
                        to="/forgot-password"
                        className="btn btn-secondary"
                        style={{
                          fontSize: '12px',
                          padding: '6px 12px',
                          display: 'inline-block',
                          backgroundColor: '#ffffff',
                          color: '#dc2626',
                          borderColor: '#fca5a5'
                        }}
                      >
                        Request a new reset link
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isExpiredOrInvalid && (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    New Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      minHeight: '44px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      minHeight: '44px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: '600'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
