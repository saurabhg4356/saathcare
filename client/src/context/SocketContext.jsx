import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useFamily } from './FamilyContext.jsx';
import { connectSocket, disconnectSocket, joinFamilyRoom, leaveFamilyRoom, getSocket } from '../socket/socketClient.js';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { activeGroup } = useFamily();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setIsConnected(false);
      return;
    }

    const socket = connectSocket();
    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [isAuthenticated]);

  // Join family room when activeGroup changes
  useEffect(() => {
    if (!isAuthenticated || !activeGroup?._id) return;

    joinFamilyRoom(activeGroup._id);

    return () => {
      leaveFamilyRoom(activeGroup._id);
    };
  }, [isAuthenticated, activeGroup?._id]);

  const subscribe = useCallback((event, handler) => {
    const socket = getSocket();
    if (!socket) return () => {};

    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, subscribe, socket: getSocket() }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
