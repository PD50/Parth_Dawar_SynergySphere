import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  projectId?: string;
  onTaskUpdate?: (task: any) => void;
  onTaskCreate?: (task: any) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskMove?: (taskId: string, newStatus: string) => void;
}

export function useSocket({
  projectId,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  onTaskMove,
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    if (typeof window !== 'undefined' && projectId) {
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

      // Handle connection events
      socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [projectId, onTaskUpdate, onTaskCreate, onTaskDelete, onTaskMove]);

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

  return {
    socket: socketRef.current,
    emitTaskUpdate,
    emitTaskCreate,
    emitTaskDelete,
    emitTaskMove,
  };
}