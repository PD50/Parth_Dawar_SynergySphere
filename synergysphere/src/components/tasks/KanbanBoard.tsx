"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { Task, useTaskStore } from "@/stores/taskStore";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  tasks: Task[];
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onAssignTask?: (task: Task) => void;
  onAddTask?: (status: Task["status"]) => void;
  onMoveTask?: (taskId: string, newStatus: Task["status"]) => void;
  className?: string;
}

const COLUMN_STATUS: Task["status"][] = ["TODO", "IN_PROGRESS", "DONE"];

const COLUMN_CONFIG = {
  TODO: { title: "To Do", id: "TODO" },
  IN_PROGRESS: { title: "In Progress", id: "IN_PROGRESS" },
  DONE: { title: "Done", id: "DONE" },
};

interface SortableTaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onAssign?: (task: Task) => void;
}

function SortableTaskCard({ task, onEdit, onDelete, onAssign }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TaskCard
      ref={setNodeRef}
      task={task}
      onEdit={onEdit}
      onDelete={onDelete}
      onAssign={onAssign}
      isDragging={isDragging}
      style={style}
      className={isDragging ? "opacity-50" : ""}
      {...attributes}
      {...listeners}
    />
  );
}

interface DroppableColumnProps {
  status: Task["status"];
  title: string;
  tasks: Task[];
  onAddTask?: () => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onAssignTask?: (task: Task) => void;
}

function DroppableColumn({
  status,
  title,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onAssignTask,
}: DroppableColumnProps) {
  const {
    setNodeRef,
    isOver,
    active,
  } = useSortable({
    id: status,
    data: {
      type: "column",
      status,
    },
  });

  const taskIds = useMemo(() => tasks.map(task => task.id), [tasks]);

  return (
    <div ref={setNodeRef} className="flex-1 min-w-80">
      <KanbanColumn
        title={title}
        status={status}
        tasks={tasks}
        onAddTask={onAddTask}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onAssignTask={onAssignTask}
        isDragOver={isOver && active?.data.current?.type === "task"}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onAssign={onAssignTask}
              />
            ))}
          </div>
        </SortableContext>
      </KanbanColumn>
    </div>
  );
}

export function KanbanBoard({
  tasks,
  onEditTask,
  onDeleteTask,
  onAssignTask,
  onAddTask,
  onMoveTask,
  className,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { startDrag, endDrag, setDragTarget } = useTaskStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    return COLUMN_STATUS.reduce((acc, status) => {
      acc[status] = tasks.filter(task => task.status === status);
      return acc;
    }, {} as Record<Task["status"], Task[]>);
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    if (active.data.current?.type === "task") {
      const task = active.data.current.task as Task;
      setActiveTask(task);
      startDrag(task.id, task.status);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Dragging a task over a column
    if (activeType === "task" && overType === "column") {
      const overStatus = over.data.current?.status as Task["status"];
      setDragTarget(overStatus);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !activeTask) {
      setActiveTask(null);
      endDrag();
      return;
    }

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Task dropped on a column
    if (activeType === "task" && overType === "column") {
      const newStatus = over.data.current?.status as Task["status"];
      
      if (activeTask.status !== newStatus) {
        onMoveTask?.(activeTask.id, newStatus);
      }
    }

    // Task dropped on another task (same column reordering)
    if (activeType === "task" && overType === "task") {
      // For now, we'll just handle status changes
      // Advanced reordering within columns can be added later
      const overTask = over.data.current?.task as Task;
      if (activeTask.status !== overTask.status) {
        onMoveTask?.(activeTask.id, overTask.status);
      }
    }

    setActiveTask(null);
    endDrag();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("flex gap-6 p-6 overflow-x-auto min-h-96", className)}>
        <SortableContext 
          items={COLUMN_STATUS} 
          strategy={verticalListSortingStrategy}
        >
          {COLUMN_STATUS.map((status) => (
            <DroppableColumn
              key={status}
              status={status}
              title={COLUMN_CONFIG[status].title}
              tasks={tasksByStatus[status]}
              onAddTask={() => onAddTask?.(status)}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onAssignTask={onAssignTask}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              isDragging={true}
              className="rotate-3 shadow-lg"
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}