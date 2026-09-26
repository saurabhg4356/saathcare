import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { familyService } from '../../services/familyService.js';
import { useFamily } from '../../context/FamilyContext.jsx';
import { Copy, Check, Mail, Loader2 } from 'lucide-react';
import { generateUUID } from '../../utils/uuid.js';

export function InviteMemberModal({ isOpen, onClose, onInviteSent }) {
  const { activeGroup } = useFamily();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copied, setCopied] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(generateUUID());
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const invite = await familyService.createInvite(activeGroup._id, email.trim(), idempotencyKey);
      setGeneratedInvite(invite);
      onInviteSent?.(invite);
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const inviteUrl = generatedInvite ? `${window.location.origin}/accept-invite/${generatedInvite.token}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    setEmail('');
    setGeneratedInvite(null);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Family Member">
      {!generatedInvite ? (
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: '1.6' }}>
            Invite siblings or family members to join the care team for <strong>{activeGroup?.careRecipientName}</strong>. They will be able to share duties, view healthcare expenses, and settle balances.
          </p>

          <div className="form-group">
            <label className="form-label">Family Member Email Address *</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. brother.rohit@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Mail size={16} />
              {loading ? 'Generating...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: '700', color: 'var(--accent-emerald)', marginBottom: '0.25rem' }}>
              ✓ Invitation Generated!
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              An invitation was dispatched to <strong>{generatedInvite.email}</strong>. It remains valid for 7 days.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Direct Onboarding Link</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                readOnly
                className="form-control"
                value={inviteUrl}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCopy}
                style={{ whiteSpace: 'nowrap' }}
              >
                {copied ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-primary" onClick={handleClose}>
              Done
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
