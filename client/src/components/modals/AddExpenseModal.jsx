import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.jsx';
import { expenseService } from '../../services/expenseService.js';
import { useFamily } from '../../context/FamilyContext.jsx';
import { EXPENSE_CATEGORIES, SPLIT_TYPE } from '../../utils/constants.js';
import { rupeesToPaise, formatPaiseToINR } from '../../utils/currency.js';

export function AddExpenseModal({ isOpen, onClose, onExpenseLogged }) {
  const { activeGroup } = useFamily();
  const members = activeGroup?.members || [];

  const [rupees, setRupees] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES.MEDICINE);
  const [splitType, setSplitType] = useState(SPLIT_TYPE.EQUAL);

  // Equal split participants (default all checked)
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  // Custom split values: { [userId]: rupeesString }
  const [customAmounts, setCustomAmounts] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize participants on open or members change
  useEffect(() => {
    if (members.length > 0) {
      setSelectedParticipants(members.map(m => m._id));
      const initialCustom = {};
      members.forEach(m => {
        initialCustom[m._id] = '';
      });
      setCustomAmounts(initialCustom);
    }
  }, [members, isOpen]);

  const toggleParticipant = (userId) => {
    if (selectedParticipants.includes(userId)) {
      if (selectedParticipants.length === 1) {
        setError('At least one member must be selected in split');
        return;
      }
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const handleCustomAmountChange = (userId, val) => {
    setCustomAmounts(prev => ({ ...prev, [userId]: val }));
  };

  // Calculate live split summaries
  const totalPaise = rupeesToPaise(rupees);
  let customSumPaise = 0;
  if (splitType === SPLIT_TYPE.CUSTOM) {
    customSumPaise = Object.values(customAmounts).reduce((acc, curr) => acc + rupeesToPaise(curr || 0), 0);
  }
  const remainingPaise = totalPaise - customSumPaise;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Expense description is required');
      return;
    }
    if (totalPaise <= 0) {
      setError('Please enter a valid expense amount greater than zero');
      return;
    }

    if (splitType === SPLIT_TYPE.CUSTOM && remainingPaise !== 0) {
      setError(`Custom split amounts must equal total expense. Difference: ${formatPaiseToINR(Math.abs(remainingPaise))}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        amountPaise: totalPaise,
        description: description.trim(),
        category,
        splitType
      };

      if (splitType === SPLIT_TYPE.EQUAL) {
        payload.participantIds = selectedParticipants;
      } else {
        payload.customSplits = members
          .map(m => ({
            userId: m._id,
            amountPaise: rupeesToPaise(customAmounts[m._id] || 0)
          }))
          .filter(s => s.amountPaise > 0);
      }

      const entry = await expenseService.recordExpense(activeGroup._id, payload);

      setRupees('');
      setDescription('');
      onExpenseLogged?.(entry);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Care Expense in Ledger" maxWidth="600px">
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Total Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-control"
              placeholder="e.g. 2500.00"
              value={rupees}
              onChange={(e) => setRupees(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Expense Category *</label>
            <select
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {Object.entries(EXPENSE_CATEGORIES).map(([key, val]) => (
                <option key={key} value={val}>{val}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description / Receipt Notes *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Apollo Pharmacy — Monthly BP & Diabetes meds"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Split Type Selector */}
        <div style={{ margin: '1.25rem 0' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Split Calculation Method
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              background: splitType === SPLIT_TYPE.EQUAL ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-tertiary)',
              border: `1px solid ${splitType === SPLIT_TYPE.EQUAL ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer'
            }}>
              <input
                type="radio"
                name="splitType"
                checked={splitType === SPLIT_TYPE.EQUAL}
                onChange={() => setSplitType(SPLIT_TYPE.EQUAL)}
              />
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Equal Split</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Divided equally across selected members</div>
              </div>
            </label>

            <label style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              background: splitType === SPLIT_TYPE.CUSTOM ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-tertiary)',
              border: `1px solid ${splitType === SPLIT_TYPE.CUSTOM ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer'
            }}>
              <input
                type="radio"
                name="splitType"
                checked={splitType === SPLIT_TYPE.CUSTOM}
                onChange={() => setSplitType(SPLIT_TYPE.CUSTOM)}
              />
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Custom Split</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Specify exact share per family member</div>
              </div>
            </label>
          </div>
        </div>

        {/* Member breakdown configuration */}
        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            {splitType === SPLIT_TYPE.EQUAL ? 'Select Included Family Members' : 'Allocate Share Per Member'}
          </div>

          {splitType === SPLIT_TYPE.EQUAL ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {members.map(m => {
                const isSelected = selectedParticipants.includes(m._id);
                const sharePaise = isSelected && selectedParticipants.length > 0 ? Math.floor(totalPaise / selectedParticipants.length) : 0;
                return (
                  <label key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleParticipant(m._id)}
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{m.name}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {isSelected ? formatPaiseToINR(sharePaise) : 'Excluded'}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {members.map(m => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', minWidth: '140px' }}>{m.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                    <span style={{ color: 'var(--text-muted)' }}>₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      placeholder="0.00"
                      value={customAmounts[m._id] || ''}
                      onChange={(e) => handleCustomAmountChange(m._id, e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>Allocated: {formatPaiseToINR(customSumPaise)}</span>
                <span style={{ color: remainingPaise === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: '600' }}>
                  {remainingPaise === 0 ? '✓ Balanced' : `Remaining: ${formatPaiseToINR(remainingPaise)}`}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ padding: '1.25rem 0 0 0', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading || (splitType === SPLIT_TYPE.CUSTOM && remainingPaise !== 0)}>
            {loading ? 'Recording...' : 'Append to Ledger'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
