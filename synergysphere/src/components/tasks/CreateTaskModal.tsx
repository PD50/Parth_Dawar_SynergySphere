"use client";

import { useState } from "react";
import { TaskModal } from "./TaskModal";
import { Task } from "@/stores/taskStore";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (taskData: {
    title: string;
    description?: string;
    assigneeId?: string;
    status: Task["status"];
    priority: Task["priority"];
    dueDate?: Date;
  }) => Promise<void>;
  defaultStatus?: Task["status"];
  projectMembers?: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  }>;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onCreateTask,
  defaultStatus = "TODO",
  projectMembers = [],
}: CreateTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: {
    title: string;
    description?: string;
    assigneeId?: string;
    status: Task["status"];
    priority: Task["priority"];
    dueDate?: Date;
  }) => {
    setIsLoading(true);
    try {
      await onCreateTask({
        ...data,
        status: data.status || defaultStatus,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TaskModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      projectMembers={projectMembers}
      isLoading={isLoading}
    />
  );
}