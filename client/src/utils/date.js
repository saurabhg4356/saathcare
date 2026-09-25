/**
 * Formats ISO date to readable string (e.g. "25 Sep 2026, 02:30 PM")
 */
export function formatDateTime(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats ISO date to short date string (e.g. "25 Sep 2026")
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Calculates human-readable relative time (e.g. "Due in 2 hours", "Overdue by 3 days")
 */
export function getRelativeDueLabel(dueAt, status) {
  if (status === 'COMPLETED') return 'Completed';
  if (!dueAt) return '—';
  
  const now = new Date().getTime();
  const due = new Date(dueAt).getTime();
  const diffMs = due - now;
  const isPast = diffMs < 0;
  const absDiff = Math.abs(diffMs);
  
  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (isPast) {
    if (days > 0) return `Overdue by ${days}d`;
    if (hours > 0) return `Overdue by ${hours}h`;
    return `Overdue by ${minutes}m`;
  } else {
    if (days > 0) return `Due in ${days}d`;
    if (hours > 0) return `Due in ${hours}h`;
    return `Due in ${minutes}m`;
  }
}
