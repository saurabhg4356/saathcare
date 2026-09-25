import { useState, useEffect, useCallback } from 'react';
import { expenseService } from '../services/expenseService.js';
import { useFamily } from '../context/FamilyContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

export function useExpenses(params = {}) {
  const { activeGroup } = useFamily();
  const { subscribe } = useSocket();

  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState({ balances: [], settlements: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLedgerAndSettlements = useCallback(async () => {
    if (!activeGroup?._id) {
      setExpenses([]);
      setSettlements({ balances: [], settlements: [] });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [ledgerRes, settlementsRes] = await Promise.all([
        expenseService.getLedger(activeGroup._id, params),
        expenseService.getSettlements(activeGroup._id)
      ]);

      setExpenses(ledgerRes.data || []);
      setSettlements(settlementsRes || { balances: [], settlements: [] });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  }, [activeGroup?._id, JSON.stringify(params)]);

  useEffect(() => {
    fetchLedgerAndSettlements();
  }, [fetchLedgerAndSettlements]);

  // Live WebSocket updates
  useEffect(() => {
    if (!activeGroup?._id) return;

    const unsubs = [
      subscribe('expense:added', () => fetchLedgerAndSettlements()),
      subscribe('expense:reversed', () => fetchLedgerAndSettlements())
    ];

    return () => {
      unsubs.forEach(unsub => unsub?.());
    };
  }, [activeGroup?._id, subscribe, fetchLedgerAndSettlements]);

  const recordExpense = async (expenseData) => {
    const entry = await expenseService.recordExpense(activeGroup._id, expenseData);
    await fetchLedgerAndSettlements();
    return entry;
  };

  const reverseExpense = async (expenseId, reason) => {
    const reversal = await expenseService.reverseExpense(activeGroup._id, expenseId, reason);
    await fetchLedgerAndSettlements();
    return reversal;
  };

  return {
    expenses,
    settlements,
    loading,
    error,
    refreshExpenses: fetchLedgerAndSettlements,
    recordExpense,
    reverseExpense
  };
}
