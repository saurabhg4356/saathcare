import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { expenseService } from '../../services/expenseService.js';
import { useFamily } from '../../context/FamilyContext.jsx';
import { formatPaiseToINR } from '../../utils/currency.js';
import { AlertTriangle } from 'lucide-react';

export function ReverseExpenseModal({ isOpen, onClose, expense, onExpenseReversed }) {
  const { activeGroup } = useFamily();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!expense) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for reversing this expense entry');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reversal = await expenseService.reverseExpense(
        activeGroup._id,
        expense._id,
        reason.trim()
      );
      setReason('');
      onExpenseReversed?.(reversal);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reverse expense entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reverse Ledger Entry">
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          marginBottom: '1.25rem'
        }}>
          <AlertTriangle size={20} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.825rem', color: '#fef3c7', lineHeight: '1.5' }}>
            <strong>Append-Only Accounting Rule:</strong> This entry will not be deleted or edited. Instead, a permanent offsetting reversal will be written to the ledger to zero out the balance and maintain an immutable audit trail.
          </div>
        </div>

        <div style={{ background: 'var(--bg-tertiary)', padding: '0.9rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Entry:</div>
          <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0.2rem 0' }}>
            {expense.description}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Paid by: {expense.paidById?.name || 'Member'}</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
              {formatPaiseToINR(expense.amountPaise)}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Reason for Reversal *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Duplicate receipt logged; pharmacist refunded bill"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="modal-footer" style={{ padding: '1rem 0 0 0', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-danger" disabled={loading}>
            {loading ? 'Reversing...' : 'Confirm Reversal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
