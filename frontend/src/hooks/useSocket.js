import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import socketService from '../utils/socketService';

export function useSocket() {
  const { isAuthenticated, token } = useAuth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
      setConnected(socketService.socket?.connected ?? false);

      const onConnect = () => setConnected(true);
      const onDisconnect = () => setConnected(false);

      socketService.socket?.on('connect', onConnect);
      socketService.socket?.on('disconnect', onDisconnect);

      return () => {
        socketService.socket?.off('connect', onConnect);
        socketService.socket?.off('disconnect', onDisconnect);
      };
    } else {
      socketService.disconnect();
      setConnected(false);
    }
  }, [isAuthenticated, token]);

  return { socketService, connected };
}
