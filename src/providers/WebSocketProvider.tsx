import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import type { WebSocketMessage, WebSocketState, RealTimeEvent } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface WebSocketContextType {
  state: WebSocketState;
  subscribe: (eventType: RealTimeEvent, callback: (data: any) => void) => void;
  unsubscribe: (
    eventType: RealTimeEvent,
    callback?: (data: any) => void
  ) => void;
  send: (message: Omit<WebSocketMessage, 'timestamp'>) => void;
  connect: () => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url = 'ws://localhost:8080/ws',
}) => {
  const { user } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<Map<RealTimeEvent, Set<(data: any) => void>>>(
    new Map()
  );
  const messageQueueRef = useRef<WebSocketMessage[]>([]);

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    reconnecting: false,
    lastPing: new Date(),
    messageQueue: [],
    subscriptions: new Set(),
  });

  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const processMessageQueue = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    while (messageQueueRef.current.length > 0) {
      const message = messageQueueRef.current.shift();
      if (message) {
        wsRef.current.send(JSON.stringify(message));
      }
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // Handle ping/pong for connection health
      if (message.type === 'ping') {
        setState(prev => ({ ...prev, lastPing: new Date() }));
        send({ type: 'pong', data: null });
        return;
      }

      // Dispatch message to subscribers
      const callbacks = subscriptionsRef.current.get(
        message.type as RealTimeEvent
      );
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(message.data);
          } catch (error) {
            console.error('Error in WebSocket callback:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setState(prev => ({ ...prev, reconnecting: true }));

    try {
      const wsUrl = user ? `${url}?token=${user.id}` : url;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({
          ...prev,
          connected: true,
          reconnecting: false,
        }));
        setReconnectAttempts(0);
        processMessageQueue();
      };

      wsRef.current.onclose = event => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setState(prev => ({
          ...prev,
          connected: false,
          reconnecting: false,
        }));

        // Auto-reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = error => {
        console.error('WebSocket error:', error);
        setState(prev => ({ ...prev, reconnecting: false }));
      };

      wsRef.current.onmessage = handleMessage;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setState(prev => ({ ...prev, reconnecting: false }));
      scheduleReconnect();
    }
  }, [url, user, reconnectAttempts, handleMessage, processMessageQueue]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
    console.log(
      `Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts + 1})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      connect();
    }, delay);
  }, [reconnectAttempts, connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      connected: false,
      reconnecting: false,
    }));
  }, []);

  const subscribe = useCallback(
    (eventType: RealTimeEvent, callback: (data: any) => void) => {
      if (!subscriptionsRef.current.has(eventType)) {
        subscriptionsRef.current.set(eventType, new Set());
      }
      subscriptionsRef.current.get(eventType)!.add(callback);

      setState(prev => ({
        ...prev,
        subscriptions: new Set([...prev.subscriptions, eventType]),
      }));
    },
    []
  );

  const unsubscribe = useCallback(
    (eventType: RealTimeEvent, callback?: (data: any) => void) => {
      const callbacks = subscriptionsRef.current.get(eventType);
      if (callbacks) {
        if (callback) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            subscriptionsRef.current.delete(eventType);
          }
        } else {
          subscriptionsRef.current.delete(eventType);
        }
      }

      setState(prev => ({
        ...prev,
        subscriptions: new Set(subscriptionsRef.current.keys()),
      }));
    },
    []
  );

  const send = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: new Date(),
    };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(fullMessage));
    } else {
      // Queue message for later
      messageQueueRef.current.push(fullMessage);
      setState(prev => ({
        ...prev,
        messageQueue: [...messageQueueRef.current],
      }));
    }
  }, []);

  // Auto-connect when user is available
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const contextValue: WebSocketContextType = {
    state,
    subscribe,
    unsubscribe,
    send,
    connect,
    disconnect,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};
