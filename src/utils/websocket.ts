import { useCallback, useEffect } from 'react';
import { useWebSocket } from '@/providers/WebSocketProvider';

// Throttle function for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(
        () => {
          func(...args);
          lastExecTime = Date.now();
        },
        delay - (currentTime - lastExecTime)
      );
    }
  };
};

// Hook for throttled WebSocket subscriptions
export const useThrottledWebSocket = (
  eventType: string,
  callback: (data: any) => void,
  delay = 100
) => {
  const { subscribe, unsubscribe } = useWebSocket();
  const throttledCallback = useCallback(throttle(callback, delay), [
    callback,
    delay,
  ]);

  useEffect(() => {
    subscribe(eventType as any, throttledCallback);
    return () => unsubscribe(eventType as any, throttledCallback);
  }, [eventType, throttledCallback, subscribe, unsubscribe]);
};

// Hook for conditional WebSocket subscriptions
export const useConditionalSubscription = (
  eventType: string,
  condition: boolean,
  callback: (data: any) => void
) => {
  const { subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    if (condition) {
      subscribe(eventType as any, callback);
    }

    return () => {
      if (condition) {
        unsubscribe(eventType as any, callback);
      }
    };
  }, [eventType, condition, callback, subscribe, unsubscribe]);
};

// WebSocket connection status utilities
export const getConnectionStatus = (
  connected: boolean,
  reconnecting: boolean
) => {
  if (reconnecting) return 'reconnecting';
  if (connected) return 'connected';
  return 'disconnected';
};

export const getConnectionColor = (status: string) => {
  switch (status) {
    case 'connected':
      return 'text-green-500';
    case 'reconnecting':
      return 'text-yellow-500';
    case 'disconnected':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};
