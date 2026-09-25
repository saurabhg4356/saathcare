export const SOCKET_EVENTS = Object.freeze({
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_FAMILY: 'family:join',
  LEAVE_FAMILY: 'family:leave',
  JOINED_FAMILY: 'family:joined',
  ERROR: 'error',
  
  // Real-time broadcasts
  TASK_CREATED: 'task:created',
  TASK_COMPLETED: 'task:completed',
  TASK_MISSED: 'task:missed',
  EXPENSE_ADDED: 'expense:added',
  EXPENSE_REVERSED: 'expense:reversed',
  MEMBER_JOINED: 'member:joined'
});
