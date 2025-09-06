import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  projectId?: string;
  onTaskUpdate?: (task: any) => void;
  onTaskCreate?: (task: any) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskMove?: (taskId: string, newStatus: string) => void;
  // Message events
  onMessageCreate?: (message: any) => void;
  onMessageUpdate?: (message: any) => void;
  onMessageDelete?: (messageId: string) => void;
  // Notification events  
  onNotificationCreate?: (notification: any) => void;
  onNotificationUpdate?: (notification: any) => void;
}

export function useSocket({
  projectId,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  onTaskMove,
  onMessageCreate,
  onMessageUpdate, 
  onMessageDelete,
  onNotificationCreate,
  onNotificationUpdate,
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection only if WebSocket server is configured
    if (typeof window !== 'undefined' && projectId && process.env.NEXT_PUBLIC_SOCKET_URL) {
      socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        transports: ['websocket'],
      });

      const socket = socketRef.current;

      // Join project room
      socket.emit('join-project', projectId);

      // Listen for task events
      if (onTaskUpdate) {
        socket.on('task:updated', onTaskUpdate);
      }
      
      if (onTaskCreate) {
        socket.on('task:created', onTaskCreate);
      }
      
      if (onTaskDelete) {
        socket.on('task:deleted', onTaskDelete);
      }
      
      if (onTaskMove) {
        socket.on('task:moved', ({ taskId, newStatus }) => {
          onTaskMove(taskId, newStatus);
        });
      }
      
      // Listen for message events
      if (onMessageCreate) {
        socket.on('message:created', onMessageCreate);
      }
      
      if (onMessageUpdate) {
        socket.on('message:updated', onMessageUpdate);
      }
      
      if (onMessageDelete) {
        socket.on('message:deleted', onMessageDelete);
      }
      
      // Listen for notification events
      if (onNotificationCreate) {
        socket.on('notification:created', onNotificationCreate);
      }
      
      if (onNotificationUpdate) {
        socket.on('notification:updated', onNotificationUpdate);
      }

      // Handle connection events
      socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      socket.on('connect_error', (error) => {
        // Silently fail if WebSocket server is not available
        // This prevents console spam during development
        if (process.env.NODE_ENV === 'development') {
          console.debug('WebSocket server not available (this is normal if not running a Socket.IO server)');
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [projectId, onTaskUpdate, onTaskCreate, onTaskDelete, onTaskMove, onMessageCreate, onMessageUpdate, onMessageDelete, onNotificationCreate, onNotificationUpdate]);

  // Emit task events
  const emitTaskUpdate = (taskId: string, updates: any) => {
    if (socketRef.current) {
      socketRef.current.emit('task:update', { taskId, updates, projectId });
    }
  };

  const emitTaskCreate = (task: any) => {
    if (socketRef.current) {
      socketRef.current.emit('task:create', { task, projectId });
    }
  };

  const emitTaskDelete = (taskId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('task:delete', { taskId, projectId });
    }
  };

  const emitTaskMove = (taskId: string, newStatus: string, oldStatus: string) => {
    if (socketRef.current) {
      socketRef.current.emit('task:move', { 
        taskId, 
        newStatus, 
        oldStatus, 
        projectId 
      });
    }
  };
  
  // Emit message events
  const emitMessageCreate = (message: any) => {
    if (socketRef.current) {
      socketRef.current.emit('message:create', { message, projectId });
    }
  };
  
  const emitMessageUpdate = (messageId: string, updates: any) => {
    if (socketRef.current) {
      socketRef.current.emit('message:update', { messageId, updates, projectId });
    }
  };
  
  const emitMessageDelete = (messageId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('message:delete', { messageId, projectId });
    }
  };
  
  // Emit notification events
  const emitNotificationUpdate = (notificationId: string, updates: any) => {
    if (socketRef.current) {
      socketRef.current.emit('notification:update', { notificationId, updates });
    }
  };

  return {
    socket: socketRef.current,
    emitTaskUpdate,
    emitTaskCreate,
    emitTaskDelete,
    emitTaskMove,
    emitMessageCreate,
    emitMessageUpdate,
    emitMessageDelete,
    emitNotificationUpdate,
  };
}