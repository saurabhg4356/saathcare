import { io } from 'socket.io-client';
import { getStoredAccessToken } from '../services/api.js';

let socket = null;

export function getSocket() {
  return socket;
}

export function connectSocket() {
  if (socket && socket.connected) {
    return socket;
  }

  const token = getStoredAccessToken();
  if (!token) return null;

  // In dev, Vite proxies /socket.io to backend :5000
  socket = io('/', {
    auth: { token },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('[Socket.io] Connected to SaathCare real-time gateway:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket.io] Disconnected:', reason);
  });

  socket.on('error', (err) => {
    console.warn('[Socket.io] Server error:', err);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinFamilyRoom(familyGroupId) {
  if (!socket || !familyGroupId) return;
  socket.emit('family:join', { familyGroupId });
}

export function leaveFamilyRoom(familyGroupId) {
  if (!socket || !familyGroupId) return;
  socket.emit('family:leave', { familyGroupId });
}
