import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { socketAuthMiddleware } from './socketAuth.js';
import { FamilyGroup } from '../models/FamilyGroup.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

let io = null;

export function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [
        env.CLIENT_URL,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000'
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id}`, { user: socket.user });

    // Join family group room with strict membership check
    socket.on(SOCKET_EVENTS.JOIN_FAMILY, async (data) => {
      try {
        const familyGroupId = typeof data === 'string' ? data : data?.familyGroupId;
        if (!familyGroupId) {
          return socket.emit(SOCKET_EVENTS.ERROR, { message: 'familyGroupId is required to join room' });
        }

        const isMember = await FamilyGroup.exists({
          _id: familyGroupId,
          members: socket.user._id
        });

        if (!isMember) {
          logger.warn(`Unauthorized room join attempt: User ${socket.user._id} attempted to join family ${familyGroupId}`);
          return socket.emit(SOCKET_EVENTS.ERROR, {
            code: 'FORBIDDEN',
            message: 'You are not authorized to join this family group room'
          });
        }

        const roomName = `family:${familyGroupId}`;
        socket.join(roomName);
        logger.info(`Socket ${socket.id} (User: ${socket.user.name}) joined room ${roomName}`);

        socket.emit(SOCKET_EVENTS.JOINED_FAMILY, {
          familyGroupId,
          room: roomName,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        logger.error('Error in socket join:family', err);
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Internal socket room error' });
      }
    });

    // Leave family room
    socket.on(SOCKET_EVENTS.LEAVE_FAMILY, (data) => {
      const familyGroupId = typeof data === 'string' ? data : data?.familyGroupId;
      if (familyGroupId) {
        const roomName = `family:${familyGroupId}`;
        socket.leave(roomName);
        logger.info(`Socket ${socket.id} left room ${roomName}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}`, { reason });
    });
  });

  return io;
}

export function getIO() {
  return io;
}
