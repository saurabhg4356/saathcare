import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal.jsx';
import { expenseService } from '../../services/expenseService.js';
import { useFamily } from '../../context/FamilyContext.jsx';
import { EXPENSE_CATEGORIES, SPLIT_TYPE } from '../../utils/constants.js';
import { rupeesToPaise, formatPaiseToINR } from '../../utils/currency.js';
import { generateUUID } from '../../utils/uuid.js';
import { Upload, FileText, X, Check, Loader2 } from 'lucide-react';

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

  // Receipt attachment state
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptError, setReceiptError] = useState('');

  // Idempotency key preserved across retries for this modal session
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize participants and generate UUID idempotency key on open
  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(generateUUID());
      setError('');
      setReceiptError('');
      setReceiptFile(null);
      if (members.length > 0) {
        const memberIds = members.map(m => (m?._id || m)?.toString()).filter(Boolean);
        setSelectedParticipants(memberIds);
        const initialCustom = {};
        members.forEach(m => {
          const id = (m?._id || m)?.toString();
          if (id) initialCustom[id] = '';
        });
        setCustomAmounts(initialCustom);
      }
    }
  }, [members, isOpen]);

  const toggleParticipant = (userId) => {
    const idStr = (userId?._id || userId)?.toString();
    if (selectedParticipants.includes(idStr)) {
      if (selectedParticipants.length === 1) {
        setError('At least one member must be selected in split');
        return;
      }
      setSelectedParticipants(selectedParticipants.filter(id => id !== idStr));
    } else {
      setSelectedParticipants([...selectedParticipants, idStr]);
    }
  };

  const handleCustomAmountChange = (userId, val) => {
    setCustomAmounts(prev => ({ ...prev, [userId]: val }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setReceiptError('');
    if (!file) {
      setReceiptFile(null);
      return;
    }

    const allowedMime = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    if (!allowedMime.includes(file.type)) {
      setReceiptError('File must be a JPEG, PNG, or PDF');
      setReceiptFile(null);
      return;
    }

    if (file.size > maxSizeBytes) {
      setReceiptError('File size exceeds the 5 MB limit');
      setReceiptFile(null);
      return;
    }

    setReceiptFile(file);
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

    // Optimistic UI protection: lock button immediately
    setLoading(true);
    setError('');

    try {
      let attachmentMetadata = null;

      // 1. Upload receipt first if selected (preserving ledger immutability)
      if (receiptFile) {
        const uploadRes = await expenseService.uploadReceipt(activeGroup._id, receiptFile);
        if (uploadRes?.data) {
          attachmentMetadata = uploadRes.data;
        }
      }

      // 2. Prepare immutable expense payload
      const payload = {
        amountPaise: totalPaise,
        description: description.trim(),
        category,
        splitType,
        attachment: attachmentMetadata
      };

      if (splitType === SPLIT_TYPE.EQUAL) {
        payload.participantIds = selectedParticipants;
      } else {
        payload.customSplits = members
          .map(m => {
            const memberId = (m?._id || m)?.toString();
            return {
              userId: memberId,
              amountPaise: rupeesToPaise(customAmounts[memberId] || 0)
            };
          })
          .filter(s => s.amountPaise > 0);
      }

      // 3. Post to immutable ledger with idempotency key
      const entry = await expenseService.recordExpense(activeGroup._id, payload, idempotencyKey);

      setRupees('');
      setDescription('');
      setReceiptFile(null);
      onExpenseLogged?.(entry);
      onClose();
    } catch (err) {
      // If error occurs, the user can re-click and the same idempotency key is safely sent
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

        <div className="form-row-2col">
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
              {Object.values(EXPENSE_CATEGORIES).map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description / Purpose *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Monthly cardiac medication & doctor consult"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={250}
            required
          />
        </div>

        {/* Receipt / Bill Upload Field */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">Attach Receipt / Invoice (Optional)</label>
          <div style={{
            border: '2px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.4)'
          }}>
            {receiptFile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(56, 189, 248, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{receiptFile.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ({(receiptFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptFile(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div>
                <label style={{ cursor: 'pointer', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <Upload size={22} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                    Click to upload receipt
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Supported formats: JPEG, PNG, PDF (Max 5MB)
                  </span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
            {receiptError && (
              <div style={{ color: 'var(--accent-rose)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                {receiptError}
              </div>
            )}
          </div>
        </div>

        {/* Split Configuration */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <label className="form-label" style={{ margin: 0 }}>Split Type</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${splitType === SPLIT_TYPE.EQUAL ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSplitType(SPLIT_TYPE.EQUAL)}
              >
                Equal Split
              </button>
              <button
                type="button"
                className={`btn btn-sm ${splitType === SPLIT_TYPE.CUSTOM ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSplitType(SPLIT_TYPE.CUSTOM)}
              >
                Custom Amounts
              </button>
            </div>
          </div>

          {splitType === SPLIT_TYPE.EQUAL ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Select family members to split among ({selectedParticipants.length} selected):
              </div>
              {members.map(m => {
                const memberId = (m?._id || m)?.toString();
                const memberName = m.name || `Member ${memberId?.slice(-4) || ''}`;
                const isSelected = selectedParticipants.includes(memberId);
                const sharePaise = isSelected && selectedParticipants.length > 0
                  ? Math.floor(totalPaise / selectedParticipants.length)
                  : 0;

                return (
                  <label
                    key={memberId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      minHeight: '44px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleParticipant(memberId)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: isSelected ? '600' : '400' }}>
                        {memberName}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: '500' }}>
                      {isSelected ? formatPaiseToINR(sharePaise) : 'Excluded'}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {members.map(m => {
                const memberId = (m?._id || m)?.toString();
                const memberName = m.name || `Member ${memberId?.slice(-4) || ''}`;
                return (
                  <div key={memberId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', minWidth: '140px' }}>{memberName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                      <span style={{ color: 'var(--text-muted)' }}>₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        placeholder="0.00"
                        value={customAmounts[memberId] || ''}
                        onChange={(e) => handleCustomAmountChange(memberId, e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}

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
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ minHeight: '44px' }}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || (splitType === SPLIT_TYPE.CUSTOM && remainingPaise !== 0)}
            style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Appending to Ledger...
              </>
            ) : (
              'Append to Ledger'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
