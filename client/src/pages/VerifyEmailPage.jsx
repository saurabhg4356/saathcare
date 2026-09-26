import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function verify() {
      try {
        const res = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(res.message || 'Your email address has been verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'This verification link is invalid or has expired.');
      }
    }

    if (token) {
      verify();
    } else {
      setStatus('error');
      setMessage('No verification token provided in the URL.');
    }
  }, [token]);

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
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        {status === 'verifying' && (
          <div>
            <Loader2 size={48} className="animate-spin" style={{ color: '#0d9488', margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
              Verifying your email...
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Please wait while we validate your secure token.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
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
              Email Verified!
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
              {message}
            </p>
            <Link
              to="/dashboard"
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
              Continue to Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <AlertCircle size={36} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
              Verification Failed
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
              {message}
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
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
