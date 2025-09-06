"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { Task } from "@/stores/taskStore";
import { cn } from "@/lib/utils";
import React from "react";

interface KanbanColumnProps {
  title: string;
  status: Task["status"];
  tasks: Task[];
  onAddTask?: () => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onAssignTask?: (task: Task) => void;
  isDragOver?: boolean;
  isDropDisabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const statusConfig = {
  TODO: { 
    title: "To Do", 
    color: "bg-slate-100 border-slate-200",
    headerColor: "text-slate-700",
    count: "bg-slate-500"
  },
  IN_PROGRESS: { 
    title: "In Progress", 
    color: "bg-blue-50 border-blue-200",
    headerColor: "text-blue-700",
    count: "bg-blue-500"
  },
  DONE: { 
    title: "Done", 
    color: "bg-green-50 border-green-200",
    headerColor: "text-green-700",
    count: "bg-green-500"
  },
};

export function KanbanColumn({
  title,
  status,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onAssignTask,
  isDragOver = false,
  isDropDisabled = false,
  className,
  children,
}: KanbanColumnProps) {
  const config = statusConfig[status];

  return (
    <Card 
      className={cn(
        "flex flex-col h-full transition-all duration-200",
        config.color,
        isDragOver && !isDropDisabled && "ring-2 ring-blue-500 ring-opacity-50",
        isDropDisabled && isDragOver && "ring-2 ring-red-500 ring-opacity-50",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-sm font-medium", config.headerColor)}>
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={cn("text-xs text-white", config.count)}
            >
              {tasks.length}
            </Badge>
            {onAddTask && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onAddTask}
                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pt-0">
        <div className="space-y-2 min-h-24">
          {children || (
            <>
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="text-muted-foreground text-sm mb-2">
                    No tasks in {title.toLowerCase()}
                  </div>
                  {onAddTask && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={onAddTask}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Task
                    </Button>
                  )}
                </div>
              ) : (
                tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onAssign={onAssignTask}
                  />
                ))
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}