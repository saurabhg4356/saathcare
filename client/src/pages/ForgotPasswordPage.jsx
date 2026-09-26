import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { HeartHandshake, Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      // Even if network fails, don't leak account existence
      setError(err.message || 'An unexpected error occurred. Please try again.');
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
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
            <HeartHandshake size={28} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 6px 0' }}>
            Reset Password
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Enter your email and we'll send you a secure recovery link.
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#ccfbf1',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
              Check your inbox
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
              If an account with <strong>{email}</strong> exists, a password reset link has been dispatched.
              The link is valid for 30 minutes.
            </p>
            <Link
              to="/login"
              className="btn btn-secondary"
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '44px'
              }}
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    minHeight: '44px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
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
                  Sending link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: '#64748b',
                  textDecoration: 'none',
                  minHeight: '44px'
                }}
              >
                <ArrowLeft size={14} />
                Return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
