import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { taskService } from '../../services/taskService.js';
import { useFamily } from '../../context/FamilyContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

import { generateUUID } from '../../utils/uuid.js';

export function CreateTaskModal({ isOpen, onClose, onTaskCreated }) {
  const { activeGroup } = useFamily();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(user?._id || '');
  const [dueAt, setDueAt] = useState(() => {
    // Default to tomorrow 10:00 AM
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate unique idempotency key when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(generateUUID());
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!assigneeId) {
      setError('Please select an assignee from the care team');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const task = await taskService.createTask(
        activeGroup._id,
        {
          title: title.trim(),
          description: description.trim(),
          assigneeId,
          dueAt: new Date(dueAt).toISOString()
        },
        idempotencyKey
      );

      setTitle('');
      setDescription('');
      onTaskCreated?.(task);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const members = activeGroup?.members || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Care Task / Duty">
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Task Title *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Morning Blood Pressure & Sugar Check"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description / Instructions</label>
          <textarea
            className="form-control"
            rows="3"
            placeholder="e.g. Note systolic/diastolic reading in logbook. Inform Dr. Mehta if BP > 140/90."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Assign Duty To *</label>
          <select
            className="form-control"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            required
          >
            <option value="">Select family member</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} ({m.email})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Due Date & Time *</label>
          <input
            type="datetime-local"
            className="form-control"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            required
          />
        </div>

        <div className="modal-footer" style={{ padding: '1rem 0 0 0', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Assigning...' : 'Assign Duty'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
