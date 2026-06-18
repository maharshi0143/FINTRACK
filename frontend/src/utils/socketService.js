import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  get connected() {
    return this.socket?.connected ?? false;
  }

  // Event handlers
  onTransactionCreated(callback) {
    this.socket?.on('transactionCreated', callback);
  }

  onTransactionUpdated(callback) {
    this.socket?.on('transactionUpdated', callback);
  }

  onTransactionDeleted(callback) {
    this.socket?.on('transactionDeleted', callback);
  }

  onBudgetCreated(callback) {
    this.socket?.on('budgetCreated', callback);
  }

  onBudgetUpdated(callback) {
    this.socket?.on('budgetUpdated', callback);
  }

  onBudgetDeleted(callback) {
    this.socket?.on('budgetDeleted', callback);
  }

  onNotification(callback) {
    this.socket?.on('notification', callback);
  }
}

const socketService = new SocketService();
export default socketService;
