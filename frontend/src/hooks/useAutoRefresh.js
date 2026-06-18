import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from './useSocket';

export function useAutoRefresh(fetchFn, events = []) {
  const { socketService, connected } = useSocket();
  const fetchRef = useRef(fetchFn);
  const eventsRef = useRef(events);

  fetchRef.current = fetchFn;
  eventsRef.current = events;

  const handleEvent = useCallback(() => {
    fetchRef.current();
  }, []);

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket || !connected || eventsRef.current.length === 0) return;

    const currentEvents = eventsRef.current;
    currentEvents.forEach((event) => {
      socket.on(event, handleEvent);
    });

    return () => {
      currentEvents.forEach((event) => {
        socket.off(event, handleEvent);
      });
    };
  }, [socketService.socket, connected, handleEvent]);
}
