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

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

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
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

  // Filter tasks to only show current project's tasks
  const projectTasks = useMemo(() => {
    return getFilteredTasks().filter(task => task.projectId === projectId);
  }, [tasks, filters, projectId, getFilteredTasks]);

  useEffect(() => {
    loadTasks();
    loadProjectMembers();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/tasks`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Transform tasks with proper date parsing
      const transformedTasks = result.tasks.map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }));
      
      setTasks(transformedTasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load tasks";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`);
      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.statusText}`);
      }
      
      const result = await response.json();
      setProjectMembers(result.members || []);
    } catch (err) {
      console.error('Failed to load project members:', err);
      // Don't show error for members - just continue with empty array
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
      // Handle "unassigned" value from UI
      const payload = {
        ...taskData,
        assigneeId: taskData.assigneeId === "unassigned" ? undefined : taskData.assigneeId,
        dueDate: taskData.dueDate?.toISOString(),
      };

      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create task');
      }

      const newTaskData = await response.json();
      const newTask: Task = {
        ...newTaskData,
        dueDate: newTaskData.dueDate ? new Date(newTaskData.dueDate) : undefined,
        createdAt: new Date(newTaskData.createdAt),
        updatedAt: new Date(newTaskData.updatedAt),
      };

      addTask(newTask);
      toast.success("Task created successfully");
      setIsCreateModalOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create task";
      toast.error(errorMessage);
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
      // Handle "unassigned" value from UI
      const payload = {
        ...taskData,
        assigneeId: taskData.assigneeId === "unassigned" ? undefined : taskData.assigneeId,
        dueDate: taskData.dueDate?.toISOString(),
      };

      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update task');
      }

      const updatedTaskData = await response.json();
      const updatedTask: Partial<Task> = {
        ...updatedTaskData,
        dueDate: updatedTaskData.dueDate ? new Date(updatedTaskData.dueDate) : undefined,
        updatedAt: new Date(updatedTaskData.updatedAt),
      };

      updateTask(editingTask.id, updatedTask);
      toast.success("Task updated successfully");
      setIsEditModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update task";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${task.id}`, { 
        method: 'DELETE' 
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete task');
      }
      
      removeTask(task.id);
      toast.success("Task deleted successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete task";
      toast.error(errorMessage);
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move task');
      }
      
      moveTask(taskId, newStatus);
      toast.success("Task moved successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to move task";
      toast.error(errorMessage);
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
        projectMembers={projectMembers}
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
        projectMembers={projectMembers}
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
          projectMembers={projectMembers}
        />
      )}
    </div>
  );
}