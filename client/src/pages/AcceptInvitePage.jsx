import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { familyService } from '../services/familyService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFamily } from '../context/FamilyContext.jsx';
import { HeartHandshake, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

export function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { refreshGroups, selectGroup } = useFamily();

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadPreview() {
      try {
        const inviteData = await familyService.getInvitePreview(token);
        setPreview(inviteData);
      } catch (err) {
        setError(err.message || 'This invitation link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    }
    loadPreview();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError('');

    try {
      const result = await familyService.acceptInvite(token);
      setSuccess(true);
      await refreshGroups(result.familyGroup._id);
      selectGroup(result.familyGroup._id);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to accept invitation');
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="live-pulse" style={{ marginBottom: '1rem', width: '12px', height: '12px' }}></div>
          <div>Validating Care Invitation...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--grad-brand)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <HeartHandshake size={32} color="#ffffff" />
        </div>

        {error ? (
          <div>
            <div style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fda4af',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <AlertCircle size={24} style={{ flexShrink: 0 }} />
              <div style={{ textAlign: 'left', fontSize: '0.875rem' }}>{error}</div>
            </div>
            <Link to="/login" className="btn btn-secondary">
              Go to Login
            </Link>
          </div>
        ) : success ? (
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>
              ✓ Welcome to the Team!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              You have successfully joined the care team for <strong>{preview?.familyGroupId?.careRecipientName}</strong>. Redirecting to your dashboard...
            </p>
          </div>
        ) : (
          <div>
            <span className="badge badge-cyan" style={{ marginBottom: '1rem' }}>
              Family Care Invitation
            </span>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Join Care Team
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
              <strong>{preview?.invitedBy?.name}</strong> has invited you to coordinate elder care for{' '}
              <strong style={{ color: 'var(--accent-cyan)' }}>{preview?.familyGroupId?.careRecipientName}</strong>.
            </p>

            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.75rem', textAlign: 'left', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Care Recipient:</span>
                <span style={{ fontWeight: '600' }}>{preview?.familyGroupId?.careRecipientName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Invited By:</span>
                <span>{preview?.invitedBy?.name} ({preview?.invitedBy?.email})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Invitation To:</span>
                <span style={{ color: 'var(--accent-teal)' }}>{preview?.email}</span>
              </div>
            </div>

            {isAuthenticated ? (
              <div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
                  onClick={handleAccept}
                  disabled={accepting}
                >
                  <UserCheck size={18} />
                  {accepting ? 'Joining Team...' : 'Accept & Join Care Team'}
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Please sign in or create an account to accept this invitation:
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link
                    to="/login"
                    state={{ from: { pathname: `/accept-invite/${token}` } }}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    state={{ from: { pathname: `/accept-invite/${token}` } }}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Register <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
