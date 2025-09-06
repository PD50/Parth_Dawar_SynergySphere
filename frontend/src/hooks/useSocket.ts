import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketHookOptions = {
  namespace?: string;
  autoConnect?: boolean;
};

type SocketEventHandler = (...args: any[]) => void;

export const useSocket = (options: SocketHookOptions = {}) => {
  const { namespace = '', autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  
  // Initialize socket connection
  const initSocket = useCallback(() => {
    // Get the API URL from environment variables
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const path = namespace ? `${baseUrl}/${namespace}` : baseUrl;

    console.log('[SOCKET] Initializing socket connection');
    console.log('[SOCKET] Base URL:', baseUrl);
    console.log('[SOCKET] Namespace:', namespace);
    console.log('[SOCKET] Path:', path);
    console.log('[SOCKET] AutoConnect:', autoConnect);

    // Create socket instance
    const socket = io(path, {
      autoConnect,
      withCredentials: true,
    });

    socketRef.current = socket;

    // Add connection event listeners for debugging
    socket.on('connect', () => {
      console.log('[SOCKET] Connected to server');
    });

    socket.on('disconnect', (reason) => {
      console.log('[SOCKET] Disconnected from server, reason:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[SOCKET] Connection error:', error);
    });

    return socket;
  }, [namespace, autoConnect]);
  
  // Connect to socket
  const connect = useCallback(() => {
    if (!socketRef.current) {
      initSocket();
    } else if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, [initSocket]);
  
  // Disconnect from socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);
  
  // Subscribe to an event
  const on = useCallback((event: string, handler: SocketEventHandler) => {
    if (!socketRef.current) {
      const socket = initSocket();
      socket.on(event, handler);
    } else {
      socketRef.current.on(event, handler);
    }
  }, [initSocket]);
  
  // Unsubscribe from an event
  const off = useCallback((event: string, handler?: SocketEventHandler) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);
  
  // Emit an event
  const emit = useCallback((event: string, ...args: any[]) => {
    if (!socketRef.current) {
      const socket = initSocket();
      socket.emit(event, ...args);
    } else {
      socketRef.current.emit(event, ...args);
    }
  }, [initSocket]);
  
  // Initialize socket on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      const socket = initSocket();
      
      return () => {
        socket.disconnect();
      };
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [autoConnect, initSocket]);
  
  return {
    socket: socketRef.current,
    connect,
    disconnect,
    on,
    off,
    emit,
  };
};
