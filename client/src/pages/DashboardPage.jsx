import React, { useState, useEffect, useCallback } from 'react';
import { useFamily } from '../context/FamilyContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { taskService } from '../services/taskService.js';
import { expenseService } from '../services/expenseService.js';
import { formatPaiseToINR } from '../utils/currency.js';
import { formatDateTime, getRelativeDueLabel } from '../utils/date.js';
import { TASK_STATUS } from '../utils/constants.js';
import {
  CheckSquare,
  Receipt,
  Scale,
  Users,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CreateTaskModal } from '../components/modals/CreateTaskModal.jsx';
import { AddExpenseModal } from '../components/modals/AddExpenseModal.jsx';
import { InviteMemberModal } from '../components/modals/InviteMemberModal.jsx';
import { OnboardingTour } from '../components/common/OnboardingTour.jsx';
import { CareInfoCard } from '../components/dashboard/CareInfoCard.jsx';
import { CategoryExpenseAnalytics } from '../components/dashboard/CategoryExpenseAnalytics.jsx';

export function DashboardPage() {
  const { activeGroup, refreshGroups } = useFamily();
  const { user } = useAuth();
  const { subscribe } = useSocket();

  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlementData, setSettlementData] = useState({ balances: [], settlements: [] });
  const [loading, setLoading] = useState(true);

  // Modals & Tour
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    if (user && user.hasSeenOnboarding === false) {
      setIsOnboardingOpen(true);
    }
  }, [user]);

  const loadDashboardData = useCallback(async () => {
    if (!activeGroup?._id) return;
    try {
      const [tasksRes, expensesRes, settlementsRes] = await Promise.all([
        taskService.getTasks(activeGroup._id, { limit: 10 }),
        expenseService.getLedger(activeGroup._id, { limit: 5 }),
        expenseService.getSettlements(activeGroup._id)
      ]);

      setTasks(tasksRes.data || []);
      setExpenses(expensesRes.data || []);
      setSettlementData(settlementsRes || { balances: [], settlements: [] });
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, [activeGroup?._id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Real-Time Socket.io Subscriptions
  useEffect(() => {
    if (!activeGroup?._id) return;

    const unsubs = [
      subscribe('task:created', () => loadDashboardData()),
      subscribe('task:completed', () => loadDashboardData()),
      subscribe('task:missed', () => loadDashboardData()),
      subscribe('expense:added', () => loadDashboardData()),
      subscribe('expense:reversed', () => loadDashboardData()),
      subscribe('member:joined', () => loadDashboardData())
    ];

    return () => {
      unsubs.forEach(unsub => unsub?.());
    };
  }, [activeGroup?._id, subscribe, loadDashboardData]);

  const handleCompleteTask = async (taskId) => {
    try {
      await taskService.completeTask(activeGroup._id, taskId);
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to complete task');
    }
  };

  // Metrics computation
  const pendingTasks = tasks.filter(t => t.status === TASK_STATUS.PENDING);
  const completedTasks = tasks.filter(t => t.status === TASK_STATUS.COMPLETED);
  const missedTasks = tasks.filter(t => t.status === TASK_STATUS.MISSED);

  // User's balance from settlement engine
  const userBalance = settlementData.balances.find(b => b.userId === user?._id);
  const userNetPaise = userBalance?.netPaise || 0;

  // Total active expenses in family
  const totalExpensePaise = expenses
    .filter(e => !e.isReversal)
    .reduce((acc, curr) => acc + curr.amountPaise, 0);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div className="live-pulse" style={{ width: '12px', height: '12px', marginBottom: '1rem' }}></div>
        <div style={{ color: 'var(--text-secondary)' }}>Loading family dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Welcome Bar & Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="live-pulse"></span>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Care Dashboard
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>
            {activeGroup?.careRecipientName}’s Care Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {activeGroup?.groupName} • {activeGroup?.members?.length || 1} Caregivers Connected
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="dashboard-quick-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsOnboardingOpen(true)}
            title="Getting Started Guide"
          >
            <HelpCircle size={15} />
            Tour Guide
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsInviteModalOpen(true)}
          >
            <Users size={15} />
            Invite Family
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsTaskModalOpen(true)}
          >
            <Plus size={15} />
            Assign Duty
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsExpenseModalOpen(true)}
          >
            <Receipt size={15} />
            Log Expense
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid-cols-auto" style={{ marginBottom: '2rem' }}>
        {/* Metric 1: Pending Duties */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Pending Duties</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="var(--accent-amber)" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>
            {pendingTasks.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: missedTasks.length > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
            {missedTasks.length > 0 ? `⚠ ${missedTasks.length} duty flagged as missed` : 'All tasks on schedule'}
          </div>
        </div>

        {/* Metric 2: Completed Duties */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Completed Care Duties</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} color="var(--accent-emerald)" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>
            {completedTasks.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Accountability history preserved
          </div>
        </div>

        {/* Metric 3: Total Expenses */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Care Expenses</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={18} color="var(--accent-cyan)" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem' }}>
            {formatPaiseToINR(totalExpensePaise)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {expenses.length} immutable ledger entries
          </div>
        </div>

        {/* Metric 4: User's Net Settlement Balance */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Your Net Balance</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: userNetPaise > 0 ? 'rgba(16, 185, 129, 0.15)' : userNetPaise < 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {userNetPaise > 0 ? (
                <ArrowDownLeft size={18} color="var(--accent-emerald)" />
              ) : userNetPaise < 0 ? (
                <ArrowUpRight size={18} color="var(--accent-rose)" />
              ) : (
                <Scale size={18} color="var(--text-muted)" />
              )}
            </div>
          </div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: '800',
            marginBottom: '0.25rem',
            color: userNetPaise > 0 ? 'var(--accent-emerald)' : userNetPaise < 0 ? 'var(--accent-rose)' : 'var(--text-primary)'
          }}>
            {formatPaiseToINR(Math.abs(userNetPaise))}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {userNetPaise > 0 ? 'You are owed this amount' : userNetPaise < 0 ? 'You owe this amount' : 'All balances settled'}
          </div>
        </div>
      </div>

      {/* Care Recipient & Important Emergency Info */}
      <CareInfoCard
        familyGroup={activeGroup}
        onCareInfoUpdated={() => refreshGroups(activeGroup?._id)}
      />

      {/* Expense Spending Analytics */}
      <CategoryExpenseAnalytics expenses={expenses} />

      {/* Two Column Layout: Urgent Duties & Recent Ledger */}
      <div className="dashboard-two-col" style={{ marginBottom: '2rem' }}>
        {/* Column 1: Duties Checklist */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckSquare size={18} color="var(--accent-teal)" />
              <h2 style={{ fontSize: '1.15rem' }}>Care Duties Checklist</h2>
            </div>
            <Link to="/tasks" style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>

          {pendingTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              ✓ No pending duties. All scheduled tasks are complete!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingTasks.slice(0, 5).map(task => (
                <div
                  key={task._id}
                  style={{
                    padding: '0.85rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                      <span>👤 {task.assigneeId?.name || 'Caregiver'}</span>
                      <span style={{ color: 'var(--accent-amber)' }}>
                        🕒 {getRelativeDueLabel(task.dueAt, task.status)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--accent-emerald)' }}
                    onClick={() => handleCompleteTask(task._id)}
                    title="Mark Done"
                  >
                    <CheckCircle2 size={14} />
                    Done
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Recent Ledger Activity */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={18} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '1.15rem' }}>Recent Ledger Entries</h2>
            </div>
            <Link to="/expenses" style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Full Ledger <ChevronRight size={14} />
            </Link>
          </div>

          {expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No expenses recorded yet. Log your first medical or care bill.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {expenses.map(entry => (
                <div
                  key={entry._id}
                  style={{
                    padding: '0.85rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: entry.isReversal ? 0.6 : 1
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                      {entry.description}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Paid by {entry.paidById?.name || 'Member'} • {formatDateTime(entry.createdAt)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: entry.isReversal ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
                      {entry.isReversal ? '-' : ''}{formatPaiseToINR(entry.amountPaise)}
                    </div>
                    <span className={`badge ${entry.isReversal ? 'badge-missed' : 'badge-completed'}`} style={{ fontSize: '0.65rem' }}>
                      {entry.isReversal ? 'Reversal' : entry.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreated={() => loadDashboardData()}
      />
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onExpenseLogged={() => loadDashboardData()}
      />
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      <OnboardingTour
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}
