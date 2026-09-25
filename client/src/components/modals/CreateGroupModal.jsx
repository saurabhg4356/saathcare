import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { useFamily } from '../../context/FamilyContext.jsx';

export function CreateGroupModal({ isOpen, onClose }) {
  const { createGroup } = useFamily();
  const [careRecipientName, setCareRecipientName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!careRecipientName.trim()) {
      setError('Please provide the name of the elderly parent/care recipient');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createGroup({
        careRecipientName: careRecipientName.trim(),
        groupName: groupName.trim() || undefined
      });
      setCareRecipientName('');
      setGroupName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create care group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start a New Care Team">
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Elder / Care Recipient Name *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Dad (Shri Ramesh Sharma)"
            value={careRecipientName}
            onChange={(e) => setCareRecipientName(e.target.value)}
            required
            autoFocus
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            The elderly person being cared for (not a login user).
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Team / Group Name (Optional)</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Sharma Family Care Team"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        <div className="modal-footer" style={{ padding: '1rem 0 0 0', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Care Team'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
