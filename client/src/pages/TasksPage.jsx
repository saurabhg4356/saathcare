import React, { useState, useEffect, useCallback } from 'react';
import { useFamily } from '../context/FamilyContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { taskService } from '../services/taskService.js';
import { formatDateTime, getRelativeDueLabel } from '../utils/date.js';
import { TASK_STATUS } from '../utils/constants.js';
import { CheckSquare, Plus, CheckCircle2, AlertCircle, Clock, Filter, User } from 'lucide-react';
import { CreateTaskModal } from '../components/modals/CreateTaskModal.jsx';
import { generateUUID } from '../utils/uuid.js';

export function TasksPage() {
  const { activeGroup } = useFamily();
  const { subscribe } = useSocket();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!activeGroup?._id) return;
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (assigneeFilter) params.assigneeId = assigneeFilter;

      const res = await taskService.getTasks(activeGroup._id, params);
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  }, [activeGroup?._id, statusFilter, assigneeFilter]);

  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    fetchTasks();

    // Refetch on network reconnect
    const handleOnline = () => {
      fetchTasks();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchTasks]);

  // Real-time socket event updates & reconnect sync
  useEffect(() => {
    if (!activeGroup?._id) return;

    const unsubs = [
      subscribe('task:created', () => fetchTasks()),
      subscribe('task:completed', () => fetchTasks()),
      subscribe('task:missed', () => fetchTasks()),
      subscribe('connect', () => fetchTasks())
    ];

    return () => {
      unsubs.forEach(unsub => unsub?.());
    };
  }, [activeGroup?._id, subscribe, fetchTasks]);

  const handleComplete = async (taskId) => {
    setCompletingId(taskId);
    try {
      const idempotencyKey = generateUUID();
      await taskService.completeTask(activeGroup._id, taskId, idempotencyKey);
      fetchTasks();
    } catch (err) {
      alert(err.message || 'Failed to complete task');
    } finally {
      setCompletingId(null);
    }
  };

  const members = activeGroup?.members || [];

  return (
    <div>
      {/* Header & Create Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem' }}>
            Care Duties & Task Roster
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Coordinate and track care responsibilities for {activeGroup?.careRecipientName}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={16} />
          Assign New Duty
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('')}
          >
            All Duties
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === TASK_STATUS.PENDING ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(TASK_STATUS.PENDING)}
          >
            Pending
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === TASK_STATUS.COMPLETED ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(TASK_STATUS.COMPLETED)}
          >
            Completed
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === TASK_STATUS.MISSED ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(TASK_STATUS.MISSED)}
          >
            Missed
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={16} color="var(--text-muted)" />
          <select
            className="form-control"
            style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="">All Family Members</option>
            {members.map(m => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List / Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="live-pulse" style={{ width: '12px', height: '12px', marginBottom: '1rem' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading care duties...</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
          <CheckSquare size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No Tasks Found</h3>
          <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
            No care duties match the selected filter. Assign duties to ensure elder care is coordinated smoothly.
          </p>
          <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Assign First Duty
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {tasks.map(task => {
            const isPending = task.status === TASK_STATUS.PENDING;
            const isCompleted = task.status === TASK_STATUS.COMPLETED;
            const isMissed = task.status === TASK_STATUS.MISSED;

            return (
              <div
                key={task._id}
                className="card card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: isPending ? '4px solid var(--accent-amber)' : isCompleted ? '4px solid var(--accent-emerald)' : '4px solid var(--accent-rose)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem' }}>
                    <span className={`badge ${isPending ? 'badge-pending' : isCompleted ? 'badge-completed' : 'badge-missed'}`}>
                      {task.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      🕒 {formatDateTime(task.dueAt)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                    {task.title}
                  </h3>

                  {task.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
                      {task.description}
                    </p>
                  )}
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isPending ? '0.75rem' : '0' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Assigned to: <strong style={{ color: 'var(--text-primary)' }}>{task.assigneeId?.name || 'Caregiver'}</strong>
                    </div>

                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: isMissed ? 'var(--accent-rose)' : isPending ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                      {getRelativeDueLabel(task.dueAt, task.status)}
                    </span>
                  </div>

                  {isCompleted && task.completedBy && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>
                      ✓ Completed by {task.completedBy.name} ({formatDateTime(task.completedAt)})
                    </div>
                  )}

                  {isPending && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{
                        width: '100%',
                        color: 'var(--accent-emerald)',
                        borderColor: 'rgba(16, 185, 129, 0.3)',
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      disabled={completingId === task._id}
                      onClick={() => handleComplete(task._id)}
                    >
                      <CheckCircle2 size={16} />
                      {completingId === task._id ? 'Completing...' : 'Mark as Completed'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={() => fetchTasks()}
      />
    </div>
  );
}
