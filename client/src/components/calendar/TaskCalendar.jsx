import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  User
} from 'lucide-react';
import { TASK_STATUS } from '../../utils/constants.js';
import { formatDateTime } from '../../utils/date.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TaskCalendar({ tasks, onCompleteTask, completingId, onNewDuty }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Month calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Group tasks by "YYYY-MM-DD"
  const tasksByDate = {};
  tasks.forEach(task => {
    if (!task.dueAt) return;
    const d = new Date(task.dueAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!tasksByDate[key]) tasksByDate[key] = [];
    tasksByDate[key].push(task);
  });

  // Selected date key
  const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedTasks = tasksByDate[selectedKey] || [];

  // Generate calendar grid cells
  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateObj = new Date(year, month - 1, day);
    calendarCells.push({
      day,
      dateObj,
      isCurrentMonth: false,
      key: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    calendarCells.push({
      day,
      dateObj,
      isCurrentMonth: true,
      key: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    });
  }

  // Next month leading days to complete grid (up to multiple of 7)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const dateObj = new Date(year, month + 1, day);
    calendarCells.push({
      day,
      dateObj,
      isCurrentMonth: false,
      key: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Calendar Header Controls */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CalendarIcon size={18} color="var(--accent-cyan)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>
            {monthName} {year}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleToday}
          >
            Today
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleNextMonth}
            aria-label="Next month"
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Monthly Grid */}
      <div className="card" style={{ padding: '1rem', overflowX: 'auto' }}>
        <div style={{ minWidth: '600px' }}>
          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px', textAlign: 'center' }}>
            {WEEKDAYS.map(w => (
              <div key={w} style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.4rem 0' }}>
                {w}
              </div>
            ))}
          </div>

          {/* Grid Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {calendarCells.map(cell => {
              const dayTasks = tasksByDate[cell.key] || [];
              const isToday = cell.key === todayStr;
              const isSelected = cell.key === selectedKey;

              return (
                <div
                  key={cell.key}
                  onClick={() => setSelectedDate(cell.dateObj)}
                  style={{
                    minHeight: '85px',
                    padding: '0.4rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected
                      ? 'rgba(56, 189, 248, 0.12)'
                      : cell.isCurrentMonth
                      ? 'var(--bg-tertiary)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected
                      ? '1px solid var(--accent-cyan)'
                      : isToday
                      ? '1px solid var(--accent-teal)'
                      : '1px solid var(--border-subtle)',
                    opacity: cell.isCurrentMonth ? 1 : 0.45,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: isToday || isSelected ? '800' : '600',
                      color: isToday ? 'var(--accent-cyan)' : 'var(--text-primary)'
                    }}>
                      {cell.day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        color: 'var(--text-muted)'
                      }}>
                        {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                      </span>
                    )}
                  </div>

                  {/* Task Indicators */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                    {dayTasks.slice(0, 2).map(t => {
                      const dotColor = t.status === TASK_STATUS.COMPLETED
                        ? 'var(--accent-emerald)'
                        : t.status === TASK_STATUS.MISSED
                        ? 'var(--accent-rose)'
                        : 'var(--accent-amber)';

                      return (
                        <div
                          key={t._id}
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            background: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={`${t.title} (${t.status})`}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, flexShrink: 0 }}></span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.title}
                          </span>
                        </div>
                      );
                    })}

                    {dayTasks.length > 2 && (
                      <span style={{ fontSize: '0.625rem', color: 'var(--accent-cyan)', fontWeight: '600', paddingLeft: '4px' }}>
                        +{dayTasks.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Inspector */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>
              Duties for {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {selectedTasks.length} {selectedTasks.length === 1 ? 'duty' : 'duties'} scheduled
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onNewDuty}
          >
            <Plus size={14} />
            Assign Duty
          </button>
        </div>

        {selectedTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No duties scheduled for this date. Click "Assign Duty" to add a task.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {selectedTasks.map(task => {
              const isPending = task.status === TASK_STATUS.PENDING;
              const isCompleted = task.status === TASK_STATUS.COMPLETED;
              const isMissed = task.status === TASK_STATUS.MISSED;

              return (
                <div
                  key={task._id}
                  style={{
                    padding: '1rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className={`badge ${isPending ? 'badge-pending' : isCompleted ? 'badge-completed' : 'badge-missed'}`}>
                        {task.status}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        🕒 {formatDateTime(task.dueAt)}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                      {task.title}
                    </h4>

                    {task.description && (
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={13} />
                      Assigned to: <strong style={{ color: 'var(--text-primary)' }}>{task.assigneeId?.name || 'Caregiver'}</strong>
                    </div>
                  </div>

                  {isPending && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                      disabled={completingId === task._id}
                      onClick={() => onCompleteTask(task._id)}
                    >
                      <CheckCircle2 size={15} />
                      {completingId === task._id ? 'Saving...' : 'Mark Done'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
