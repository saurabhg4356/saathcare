import { getIO } from './socketServer.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { logger } from '../config/logger.js';

export class SocketEmitter {
  static getRoomName(familyGroupId) {
    return `family:${familyGroupId.toString()}`;
  }

  static emitToFamily(familyGroupId, eventName, payload) {
    const io = getIO();
    if (!io) {
      logger.debug(`Socket.io not initialized; skipping emit for event ${eventName}`);
      return;
    }
    const room = this.getRoomName(familyGroupId);
    io.to(room).emit(eventName, payload);
    logger.debug(`Broadcasted ${eventName} to room ${room}`, { payloadSummary: typeof payload });
  }

  static emitTaskCreated(familyGroupId, task) {
    this.emitToFamily(familyGroupId, SOCKET_EVENTS.TASK_CREATED, { task });
  }

  static emitTaskCompleted(familyGroupId, task) {
    this.emitToFamily(familyGroupId, SOCKET_EVENTS.TASK_COMPLETED, { task });
  }

  static emitTaskMissed(familyGroupId, task) {
    this.emitToFamily(familyGroupId, SOCKET_EVENTS.TASK_MISSED, { task });
  }

  static emitExpenseAdded(familyGroupId, entry) {
    this.emitToFamily(familyGroupId, SOCKET_EVENTS.EXPENSE_ADDED, { entry });
  }

  static emitExpenseReversed(familyGroupId, reversal) {
    this.emitToFamily(familyGroupId, SOCKET_EVENTS.EXPENSE_REVERSED, { reversal });
  }

  static emitMemberJoined(familyGroupId, member) {
    this.emitToFamily(familyGroupId, SOCKET_EVENTS.MEMBER_JOINED, { member });
  }
}
