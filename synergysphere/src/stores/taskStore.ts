import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assigneeId?: string;
  creatorId: string;
  projectId: string;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TaskFilters {
  status?: "TODO" | "IN_PROGRESS" | "DONE" | "ALL";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "ALL";
  assigneeId?: string | "ALL";
  search?: string;
}

export interface DragState {
  draggedTaskId?: string;
  draggedFromStatus?: string;
  draggedToStatus?: string;
  isDragging: boolean;
}

interface TaskStore {
  // State
  tasks: Task[];
  tasksByStatus: {
    TODO: Task[];
    IN_PROGRESS: Task[];
    DONE: Task[];
  };
  filters: TaskFilters;
  dragState: DragState;
  isLoading: boolean;
  error: string | null;
  realTimeEnabled: boolean;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  moveTask: (taskId: string, newStatus: Task["status"]) => void;
  
  // Drag and Drop
  startDrag: (taskId: string, fromStatus: string) => void;
  endDrag: () => void;
  setDragTarget: (toStatus: string) => void;
  
  // Filters
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  getFilteredTasks: (status?: Task["status"]) => Task[];
  
  // Loading and Error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Real-time updates
  setRealTimeEnabled: (enabled: boolean) => void;
  handleRealTimeTaskUpdate: (task: Task) => void;
  handleRealTimeTaskCreate: (task: Task) => void;
  handleRealTimeTaskDelete: (taskId: string) => void;
  handleRealTimeTaskMove: (taskId: string, newStatus: Task["status"]) => void;
  
  // Batch operations
  batchUpdateTasks: (updates: Array<{ id: string; updates: Partial<Task> }>) => void;
}

const groupTasksByStatus = (tasks: Task[]) => {
  return tasks.reduce(
    (acc, task) => {
      acc[task.status].push(task);
      return acc;
    },
    {
      TODO: [] as Task[],
      IN_PROGRESS: [] as Task[],
      DONE: [] as Task[],
    }
  );
};

const filterTasks = (tasks: Task[], filters: TaskFilters): Task[] => {
  return tasks.filter((task) => {
    // Status filter
    if (filters.status && filters.status !== "ALL" && task.status !== filters.status) {
      return false;
    }

    // Priority filter
    if (filters.priority && filters.priority !== "ALL" && task.priority !== filters.priority) {
      return false;
    }

    // Assignee filter
    if (filters.assigneeId && filters.assigneeId !== "ALL") {
      if (filters.assigneeId === "UNASSIGNED" && task.assigneeId) {
        return false;
      }
      if (filters.assigneeId !== "UNASSIGNED" && task.assigneeId !== filters.assigneeId) {
        return false;
      }
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(searchTerm);
      const descriptionMatch = task.description?.toLowerCase().includes(searchTerm);
      const assigneeMatch = task.assignee?.name.toLowerCase().includes(searchTerm);
      
      if (!titleMatch && !descriptionMatch && !assigneeMatch) {
        return false;
      }
    }

    return true;
  });
};

export const useTaskStore = create<TaskStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      tasks: [],
      tasksByStatus: {
        TODO: [],
        IN_PROGRESS: [],
        DONE: [],
      },
      filters: {},
      dragState: {
        isDragging: false,
      },
      isLoading: false,
      error: null,
      realTimeEnabled: false,

    // Actions
    setTasks: (tasks) => 
      set((state) => {
        state.tasks = tasks;
        state.tasksByStatus = groupTasksByStatus(tasks);
      }),

    addTask: (task) =>
      set((state) => {
        state.tasks.push(task);
        state.tasksByStatus = groupTasksByStatus(state.tasks);
      }),

    updateTask: (taskId, updates) =>
      set((state) => {
        const taskIndex = state.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
          Object.assign(state.tasks[taskIndex], updates);
          state.tasksByStatus = groupTasksByStatus(state.tasks);
        }
      }),

    removeTask: (taskId) =>
      set((state) => {
        state.tasks = state.tasks.filter((task) => task.id !== taskId);
        state.tasksByStatus = groupTasksByStatus(state.tasks);
      }),

    moveTask: (taskId, newStatus) =>
      set((state) => {
        const taskIndex = state.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
          state.tasks[taskIndex].status = newStatus;
          state.tasks[taskIndex].updatedAt = new Date();
          state.tasksByStatus = groupTasksByStatus(state.tasks);
        }
      }),

    // Drag and Drop
    startDrag: (taskId, fromStatus) =>
      set((state) => {
        state.dragState = {
          draggedTaskId: taskId,
          draggedFromStatus: fromStatus,
          isDragging: true,
        };
      }),

    endDrag: () =>
      set((state) => {
        state.dragState = {
          isDragging: false,
        };
      }),

    setDragTarget: (toStatus) =>
      set((state) => {
        if (state.dragState.isDragging) {
          state.dragState.draggedToStatus = toStatus;
        }
      }),

    // Filters
    setFilters: (filters) =>
      set((state) => {
        Object.assign(state.filters, filters);
      }),

    clearFilters: () =>
      set((state) => {
        state.filters = {};
      }),

    getFilteredTasks: (status) => {
      const { tasks, filters } = get();
      const filtered = filterTasks(tasks, filters);
      
      if (status) {
        return filtered.filter((task) => task.status === status);
      }
      
      return filtered;
    },

    // Loading and Error
    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),

    // Real-time updates
    setRealTimeEnabled: (enabled) =>
      set((state) => {
        state.realTimeEnabled = enabled;
      }),

    handleRealTimeTaskUpdate: (task) =>
      set((state) => {
        if (!state.realTimeEnabled) return;
        
        const taskIndex = state.tasks.findIndex((t) => t.id === task.id);
        if (taskIndex !== -1) {
          state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...task };
          state.tasksByStatus = groupTasksByStatus(state.tasks);
        }
      }),

    handleRealTimeTaskCreate: (task) =>
      set((state) => {
        if (!state.realTimeEnabled) return;
        
        const existingTaskIndex = state.tasks.findIndex((t) => t.id === task.id);
        if (existingTaskIndex === -1) {
          state.tasks.push(task);
          state.tasksByStatus = groupTasksByStatus(state.tasks);
        }
      }),

    handleRealTimeTaskDelete: (taskId) =>
      set((state) => {
        if (!state.realTimeEnabled) return;
        
        state.tasks = state.tasks.filter((task) => task.id !== taskId);
        state.tasksByStatus = groupTasksByStatus(state.tasks);
      }),

    handleRealTimeTaskMove: (taskId, newStatus) =>
      set((state) => {
        if (!state.realTimeEnabled) return;
        
        const taskIndex = state.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
          state.tasks[taskIndex].status = newStatus;
          state.tasks[taskIndex].updatedAt = new Date();
          state.tasksByStatus = groupTasksByStatus(state.tasks);
        }
      }),

    // Batch operations
    batchUpdateTasks: (updates) =>
      set((state) => {
        updates.forEach(({ id, updates: taskUpdates }) => {
          const taskIndex = state.tasks.findIndex((task) => task.id === id);
          if (taskIndex !== -1) {
            Object.assign(state.tasks[taskIndex], taskUpdates);
          }
        });
        state.tasksByStatus = groupTasksByStatus(state.tasks);
      }),
    }))
  )
);