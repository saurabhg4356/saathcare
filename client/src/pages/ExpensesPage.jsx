import React, { useState, useEffect, useCallback } from 'react';
import { useFamily } from '../context/FamilyContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { expenseService } from '../services/expenseService.js';
import { formatPaiseToINR } from '../utils/currency.js';
import { formatDateTime } from '../utils/date.js';
import { Receipt, Plus, RotateCcw, AlertTriangle, ShieldCheck, ChevronDown, FileText, Filter } from 'lucide-react';
import { AddExpenseModal } from '../components/modals/AddExpenseModal.jsx';
import { ReverseExpenseModal } from '../components/modals/ReverseExpenseModal.jsx';
import { ReceiptPreviewModal } from '../components/modals/ReceiptPreviewModal.jsx';
import { EXPENSE_CATEGORIES } from '../utils/constants.js';

export function ExpensesPage() {
  const { activeGroup } = useFamily();
  const { subscribe } = useSocket();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals & Preview
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedForReversal, setSelectedForReversal] = useState(null);
  const [previewReceipt, setPreviewReceipt] = useState(null);

  const fetchExpenses = useCallback(async () => {
    if (!activeGroup?._id) return;
    try {
      const res = await expenseService.getLedger(activeGroup._id);
      setExpenses(res.data || []);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  }, [activeGroup?._id]);

  useEffect(() => {
    fetchExpenses();

    // REST refetch on network reconnect
    const handleOnline = () => {
      fetchExpenses();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchExpenses]);

  // Real-Time Socket.io sync
  useEffect(() => {
    if (!activeGroup?._id) return;

    const unsubs = [
      subscribe('expense:added', () => fetchExpenses()),
      subscribe('expense:reversed', () => fetchExpenses()),
      subscribe('connect', () => fetchExpenses())
    ];

    return () => {
      unsubs.forEach(unsub => unsub?.());
    };
  }, [activeGroup?._id, subscribe, fetchExpenses]);

  const handleViewReceipt = async (entry) => {
    try {
      const res = await expenseService.getReceiptUrl(activeGroup._id, entry._id);
      if (res?.data?.signedUrl) {
        setPreviewReceipt({ url: res.data.signedUrl, expense: entry });
      }
    } catch (err) {
      alert(err.message || 'Failed to retrieve receipt URL');
    }
  };

  const activeEntries = expenses.filter(e => !e.isReversal);
  const reversedEntries = expenses.filter(e => e.isReversal);

  // Find set of original IDs that have been reversed
  const reversedOriginalIds = new Set(
    reversedEntries.map(r => r.originalEntryId?.toString() || r.originalEntryId?._id?.toString()).filter(Boolean)
  );

  const totalPaise = activeEntries
    .filter(e => !reversedOriginalIds.has(e._id.toString()))
    .reduce((acc, curr) => acc + curr.amountPaise, 0);

  return (
    <div>
      {/* Header & Log Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem' }}>
            Elder-Care Expense Ledger
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Append-only financial records with paise precision for {activeGroup?.careRecipientName}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={16} />
          Log New Expense
        </button>
      </div>

      {/* Audit Banner */}
      <div style={{
        padding: '0.9rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={20} color="var(--accent-cyan)" />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            <strong>Immutable Financial Policy:</strong> Ledger entries cannot be modified or deleted. Corrections append an offsetting reversing entry.
          </div>
        </div>

        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Active Total: <strong style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>{formatPaiseToINR(totalPaise)}</strong>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <button
          type="button"
          className={`btn btn-sm ${categoryFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCategoryFilter('')}
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
        >
          All Categories ({expenses.length})
        </button>
        {Object.values(EXPENSE_CATEGORIES).map(cat => {
          const count = expenses.filter(e => e.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategoryFilter(cat)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              {cat} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="live-pulse" style={{ width: '12px', height: '12px', marginBottom: '1rem' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading immutable ledger...</div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
          <Receipt size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Financial Ledger Empty</h3>
          <p style={{ fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
            No expenses logged yet. Record medicines, hospital bills, doctor visits, or groceries to maintain clear family financial history.
          </p>
          <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} /> Log First Expense
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Description</th>
                <th>Category</th>
                <th>Paid By</th>
                <th>Split Distribution</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Ledger Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(entry => {
                const isReversed = reversedOriginalIds.has(entry._id.toString());
                const isReversalEntry = entry.isReversal;

                return (
                  <tr
                    key={entry._id}
                    style={{
                      opacity: isReversed || isReversalEntry ? 0.65 : 1,
                      background: isReversalEntry ? 'rgba(244, 63, 94, 0.04)' : undefined
                    }}
                  >
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDateTime(entry.createdAt)}
                    </td>

                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {entry.description}
                      </div>
                      {entry.reversalReason && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', marginTop: '0.2rem' }}>
                          Reason: {entry.reversalReason}
                        </div>
                      )}
                      {entry.attachment?.key && (
                        <div style={{ marginTop: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => handleViewReceipt(entry)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent-cyan)',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <FileText size={12} />
                            View Attached Receipt
                          </button>
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                        {entry.category}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: '500' }}>
                        {entry.paidById?.name || 'Caregiver'}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: '600', color: 'var(--accent-teal)' }}>{entry.splitType}</span>
                        {' '}({entry.splitAmong?.length || 0} members)
                      </div>
                    </td>

                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.95rem' }}>
                      <span style={{ color: isReversalEntry ? 'var(--accent-rose)' : isReversed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        {isReversalEntry ? '-' : ''}{formatPaiseToINR(entry.amountPaise)}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {isReversalEntry ? (
                        <span className="badge badge-missed" style={{ fontSize: '0.7rem' }}>
                          Reversal Entry
                        </span>
                      ) : isReversed ? (
                        <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>
                          Reversed
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: 'var(--accent-rose)' }}
                          onClick={() => setSelectedForReversal(entry)}
                          title="Reverse this entry"
                        >
                          <RotateCcw size={12} /> Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onExpenseLogged={() => fetchExpenses()}
      />
      <ReverseExpenseModal
        isOpen={!!selectedForReversal}
        onClose={() => setSelectedForReversal(null)}
        expense={selectedForReversal}
        onExpenseReversed={() => fetchExpenses()}
      />
      <ReceiptPreviewModal
        isOpen={Boolean(previewReceipt)}
        onClose={() => setPreviewReceipt(null)}
        receiptUrl={previewReceipt?.url}
        expense={previewReceipt?.expense}
      />
    </div>
  );
}
