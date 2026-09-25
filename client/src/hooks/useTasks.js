import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService.js';
import { useFamily } from '../context/FamilyContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

export function useTasks(filters = {}) {
  const { activeGroup } = useFamily();
  const { subscribe } = useSocket();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!activeGroup?._id) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await taskService.getTasks(activeGroup._id, filters);
      setTasks(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [activeGroup?._id, JSON.stringify(filters)]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Live WebSocket updates
  useEffect(() => {
    if (!activeGroup?._id) return;

    const unsubs = [
      subscribe('task:created', () => fetchTasks()),
      subscribe('task:completed', () => fetchTasks()),
      subscribe('task:missed', () => fetchTasks())
    ];

    return () => {
      unsubs.forEach(unsub => unsub?.());
    };
  }, [activeGroup?._id, subscribe, fetchTasks]);

  const createTask = async (taskData) => {
    const task = await taskService.createTask(activeGroup._id, taskData);
    await fetchTasks();
    return task;
  };

  const completeTask = async (taskId) => {
    const task = await taskService.completeTask(activeGroup._id, taskId);
    await fetchTasks();
    return task;
  };

  return {
    tasks,
    loading,
    error,
    refreshTasks: fetchTasks,
    createTask,
    completeTask
  };
}
