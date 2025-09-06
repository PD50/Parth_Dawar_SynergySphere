"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus } from "lucide-react";
import { Task, useTaskStore } from "@/stores/taskStore";

// Mock data for development
const mockTasks: Task[] = [
  {
    id: "1",
    title: "Setup project structure",
    description: "Create the basic folder structure and configuration files",
    status: "DONE",
    priority: "HIGH",
    assigneeId: "1",
    creatorId: "1",
    projectId: "1",
    dueDate: new Date("2024-02-01"),
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    assignee: {
      id: "1",
      name: "Alice Johnson",
      email: "alice@synergysphere.com",
    },
    creator: {
      id: "1",
      name: "Alice Johnson",
      email: "alice@synergysphere.com",
    },
  },
  {
    id: "2",
    title: "Implement user authentication",
    description: "Add login and registration functionality with JWT tokens",
    status: "IN_PROGRESS",
    priority: "URGENT",
    assigneeId: "2",
    creatorId: "1",
    projectId: "1",
    dueDate: new Date("2024-02-05"),
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-25"),
    assignee: {
      id: "2",
      name: "Bob Smith",
      email: "bob@synergysphere.com",
    },
    creator: {
      id: "1",
      name: "Alice Johnson",
      email: "alice@synergysphere.com",
    },
  },
  {
    id: "3",
    title: "Design database schema",
    description: "Create comprehensive database design for all entities",
    status: "TODO",
    priority: "MEDIUM",
    assigneeId: "3",
    creatorId: "1",
    projectId: "1",
    dueDate: new Date("2024-02-10"),
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
    assignee: {
      id: "3",
      name: "Carol Davis",
      email: "carol@synergysphere.com",
    },
    creator: {
      id: "1",
      name: "Alice Johnson",
      email: "alice@synergysphere.com",
    },
  },
  {
    id: "4",
    title: "Create API documentation",
    description: "Document all API endpoints with examples",
    status: "TODO",
    priority: "LOW",
    creatorId: "1",
    projectId: "1",
    createdAt: new Date("2024-01-22"),
    updatedAt: new Date("2024-01-22"),
    creator: {
      id: "1",
      name: "Alice Johnson",
      email: "alice@synergysphere.com",
    },
  },
];

const mockProjectMembers = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@synergysphere.com",
    avatarUrl: "",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@synergysphere.com",
    avatarUrl: "",
  },
  {
    id: "3",
    name: "Carol Davis",
    email: "carol@synergysphere.com",
    avatarUrl: "",
  },
  {
    id: "4",
    name: "David Wilson",
    email: "david@synergysphere.com",
    avatarUrl: "",
  },
];

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params.id as string;

  const {
    tasks,
    filters,
    setTasks,
    setFilters,
    clearFilters,
    addTask,
    updateTask,
    removeTask,
    moveTask,
    getFilteredTasks,
    isLoading,
    error,
    setLoading,
    setError,
  } = useTaskStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createModalDefaultStatus, setCreateModalDefaultStatus] = useState<Task["status"]>("TODO");

  // Filter tasks to only show current project's tasks
  const projectTasks = useMemo(() => {
    return getFilteredTasks().filter(task => task.projectId === projectId);
  }, [tasks, filters, projectId, getFilteredTasks]);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would fetch from API:
      // const response = await fetch(`/api/projects/${projectId}/tasks`);
      // const result = await response.json();
      
      setTasks(mockTasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load tasks";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    assigneeId?: string;
    status: Task["status"];
    priority: Task["priority"];
    dueDate?: Date;
  }) => {
    try {
      // In a real app, you would call the API:
      // const response = await fetch(`/api/projects/${projectId}/tasks`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(taskData),
      // });
      // const newTask = await response.json();

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        ...taskData,
        projectId,
        creatorId: "1", // Current user
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: "1",
          name: "Alice Johnson",
          email: "alice@synergysphere.com",
        },
        assignee: taskData.assigneeId 
          ? mockProjectMembers.find(m => m.id === taskData.assigneeId) 
          : undefined,
      };

      addTask(newTask);
      toast.success("Task created successfully");
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.error("Failed to create task");
      throw error;
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async (taskData: {
    title: string;
    description?: string;
    assigneeId?: string;
    status: Task["status"];
    priority: Task["priority"];
    dueDate?: Date;
  }) => {
    if (!editingTask) return;

    try {
      // In a real app, you would call the API:
      // const response = await fetch(`/api/tasks/${editingTask.id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(taskData),
      // });

      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedTask: Partial<Task> = {
        ...taskData,
        updatedAt: new Date(),
        assignee: taskData.assigneeId 
          ? mockProjectMembers.find(m => m.id === taskData.assigneeId) 
          : undefined,
      };

      updateTask(editingTask.id, updatedTask);
      toast.success("Task updated successfully");
      setIsEditModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      toast.error("Failed to update task");
      throw error;
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      // In a real app, you would call the API:
      // await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });

      await new Promise(resolve => setTimeout(resolve, 300));
      
      removeTask(task.id);
      toast.success("Task deleted successfully");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: Task["status"]) => {
    try {
      // In a real app, you would call the API:
      // await fetch(`/api/tasks/${taskId}/status`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus }),
      // });

      await new Promise(resolve => setTimeout(resolve, 200));
      
      moveTask(taskId, newStatus);
      toast.success("Task moved successfully");
    } catch (error) {
      toast.error("Failed to move task");
    }
  };

  const handleAddTaskToColumn = (status: Task["status"]) => {
    setCreateModalDefaultStatus(status);
    setIsCreateModalOpen(true);
  };

  if (isLoading) {
    return <PageLoader message="Loading tasks..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadTasks} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track project tasks
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <TaskFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
        projectMembers={mockProjectMembers}
      />

      {/* Kanban Board */}
      <KanbanBoard
        tasks={projectTasks}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onAddTask={handleAddTaskToColumn}
        onMoveTask={handleMoveTask}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
        defaultStatus={createModalDefaultStatus}
        projectMembers={mockProjectMembers}
      />

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTask(null);
          }}
          onSubmit={handleUpdateTask}
          task={editingTask}
          projectMembers={mockProjectMembers}
        />
      )}
    </div>
  );
}