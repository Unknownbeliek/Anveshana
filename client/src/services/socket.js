import { io } from 'socket.io-client';

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    // Try current origin, fallback to http://localhost:5000 directly
    const socketUrl = window.location.hostname === 'localhost' && window.location.port !== '5000'
      ? 'http://localhost:5000'
      : window.location.origin;

    socketInstance = io(socketUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('⚡ [Socket.io] Connected to Anveshana Real-Time Server. Socket ID:', socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 [Socket.io] Disconnected:', reason);
    });
  }
  return socketInstance;
}
