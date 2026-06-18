import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from './useSocket';

export function useAutoRefresh(fetchFn, events = []) {
  const { socketService, connected } = useSocket();
  const fetchRef = useRef(fetchFn);

  fetchRef.current = fetchFn;

  const handleEvent = useCallback(() => {
    fetchRef.current();
  }, []);

  useEffect(() => {
    if (!socketService.socket || !connected || events.length === 0) return;

    events.forEach((event) => {
      socketService.socket?.on(event, handleEvent);
    });

    return () => {
      events.forEach((event) => {
        socketService.socket?.off(event, handleEvent);
      });
    };
  }, [socketService.socket, connected, handleEvent, events.join(',')]);
}
