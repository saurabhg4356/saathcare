import React, { useState, useEffect, useCallback } from 'react';
import { useFamily } from '../context/FamilyContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { expenseService } from '../services/expenseService.js';
import { formatPaiseToINR } from '../utils/currency.js';
import { Scale, ArrowRight, CheckCircle2, User, Info, DollarSign } from 'lucide-react';

export function SettlementsPage() {
  const { activeGroup } = useFamily();
  const { subscribe } = useSocket();

  const [settlementData, setSettlementData] = useState({ balances: [], settlements: [] });
  const [loading, setLoading] = useState(true);

  const fetchSettlements = useCallback(async () => {
    if (!activeGroup?._id) return;
    try {
      const data = await expenseService.getSettlements(activeGroup._id);
      setSettlementData(data || { balances: [], settlements: [] });
    } catch (err) {
      console.error('Failed to load settlements', err);
    } finally {
      setLoading(false);
    }
  }, [activeGroup?._id]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // Real-Time Socket.io sync on any expense addition or reversal
  useEffect(() => {
    if (!activeGroup?._id) return;

    const unsubs = [
      subscribe('expense:added', () => fetchSettlements()),
      subscribe('expense:reversed', () => fetchSettlements())
    ];

    return () => {
      unsubs.forEach(unsub => unsub?.());
    };
  }, [activeGroup?._id, subscribe, fetchSettlements]);

  const { balances = [], settlements = [] } = settlementData;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem' }}>
          Settlements & Cost Balances
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Backend-calculated minimal debt transfers and member contribution balances for {activeGroup?.careRecipientName}
        </p>
      </div>

      {/* Algorithmic Integrity Note */}
      <div style={{
        padding: '0.9rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        marginBottom: '2rem'
      }}>
        <Info size={20} color="var(--accent-indigo)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
          <strong style={{ color: 'var(--accent-indigo)' }}>Greedy Debt-Minimization Engine:</strong> Repayments are calculated on the backend using an $O(N \log N)$ greedy algorithm matching the largest debtor with the largest creditor. All financial arithmetic runs in integer paise to eliminate rounding discrepancies.
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="live-pulse" style={{ width: '12px', height: '12px', marginBottom: '1rem' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Calculating balances & settlement matrix...</div>
        </div>
      ) : (
        <>
          {/* Section 1: Recommended Settlement Transfers */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scale size={20} color="var(--accent-cyan)" />
              Recommended Repayment Transfers ({settlements.length})
            </h2>

            {settlements.length === 0 ? (
              <div className="card flex-center" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', flexDirection: 'column' }}>
                <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-emerald)', marginBottom: '0.25rem' }}>All Balances Settled</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  No family member owes any outstanding debt. Everyone has contributed their exact share!
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
                {settlements.map((s, idx) => (
                  <div key={idx} className="card card-interactive" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>
                        Transfer #{idx + 1}
                      </span>
                      <span style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                        {formatPaiseToINR(s.amountPaise)}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-tertiary)',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From (Debtor)</div>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                          {s.fromUser?.name || `User ${s.from.slice(-4)}`}
                        </div>
                      </div>

                      <ArrowRight size={20} color="var(--accent-teal)" />

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To (Creditor)</div>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--accent-emerald)' }}>
                          {s.toUser?.name || `User ${s.to.slice(-4)}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Member Balance Breakdown */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
              Care Team Net Contribution Balances
            </h2>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Family Member</th>
                    <th style={{ textAlign: 'right' }}>Total Paid</th>
                    <th style={{ textAlign: 'right' }}>Total Share Owed</th>
                    <th style={{ textAlign: 'right' }}>Net Balance</th>
                    <th style={{ textAlign: 'center' }}>Position</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map(b => {
                    const isCreditor = b.netPaise > 0;
                    const isDebtor = b.netPaise < 0;

                    return (
                      <tr key={b.userId}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{b.user?.name || 'Member'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.user?.email}</div>
                        </td>

                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          {formatPaiseToINR(b.paidPaise)}
                        </td>

                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          {formatPaiseToINR(b.owedPaise)}
                        </td>

                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                          <span style={{ color: isCreditor ? 'var(--accent-emerald)' : isDebtor ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                            {isCreditor ? '+' : ''}{formatPaiseToINR(b.netPaise)}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          {isCreditor ? (
                            <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>
                              Receives {formatPaiseToINR(b.netPaise)}
                            </span>
                          ) : isDebtor ? (
                            <span className="badge badge-missed" style={{ fontSize: '0.7rem' }}>
                              Owes {formatPaiseToINR(Math.abs(b.netPaise))}
                            </span>
                          ) : (
                            <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                              Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
