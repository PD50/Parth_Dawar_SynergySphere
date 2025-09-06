"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, User } from "lucide-react";
import { Task } from "@/stores/taskStore";
import { cn } from "@/lib/utils";

const taskFormSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.date().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  task?: Task;
  projectMembers?: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  }>;
  isLoading?: boolean;
}

const priorityConfig = {
  LOW: { label: "Low", className: "bg-blue-100 text-blue-800" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-800" },
  HIGH: { label: "High", className: "bg-orange-100 text-orange-800" },
  URGENT: { label: "Urgent", className: "bg-red-100 text-red-800" },
};

const statusConfig = {
  TODO: { label: "To Do", className: "bg-gray-100 text-gray-800" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-800" },
  DONE: { label: "Done", className: "bg-green-100 text-green-800" },
};

export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  task,
  projectMembers = [],
  isLoading = false,
}: TaskModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
    },
  });

  const watchedAssigneeId = watch("assigneeId");
  const watchedStatus = watch("status");
  const watchedPriority = watch("priority");

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || "",
        assigneeId: task.assigneeId || "",
        status: task.status,
        priority: task.priority,
      });
      setSelectedDate(task.dueDate ? new Date(task.dueDate) : undefined);
    } else {
      reset({
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
      });
      setSelectedDate(undefined);
    }
  }, [task, reset]);

  useEffect(() => {
    setValue("dueDate", selectedDate);
  }, [selectedDate, setValue]);

  const handleFormSubmit = async (data: TaskFormData) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Error submitting task:", error);
    }
  };

  const selectedAssignee = projectMembers.find(member => member.id === watchedAssigneeId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              {...register("title")}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description (optional)"
              className="min-h-20"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watchedStatus}
                onValueChange={(value: Task["status"]) => setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", config.className)}
                        >
                          {config.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={watchedPriority}
                onValueChange={(value: Task["priority"]) => setValue("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs", config.className)}
                        >
                          {config.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select
              value={watchedAssigneeId || "unassigned"}
              onValueChange={(value) => setValue("assigneeId", value === "unassigned" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue>
                  {selectedAssignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={selectedAssignee.avatarUrl} alt={selectedAssignee.name} />
                        <AvatarFallback className="text-xs">
                          {selectedAssignee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{selectedAssignee.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Unassigned</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Unassigned</span>
                  </div>
                </SelectItem>
                {projectMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                        <AvatarFallback className="text-xs">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <DatePicker
              date={selectedDate}
              onDateChange={setSelectedDate}
              placeholder="Select due date (optional)"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {task ? "Updating..." : "Creating..."}
                </>
              ) : (
                task ? "Update Task" : "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}