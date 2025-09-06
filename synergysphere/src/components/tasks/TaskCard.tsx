"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Clock, MoreVertical, User, AlertCircle, Tag } from "lucide-react";
import { Task } from "@/stores/taskStore";
import { cn } from "@/lib/utils";
import { format, isAfter, isBefore, subDays } from "date-fns";

interface TaskCardProps {
  task: Task & {
    tags?: {
      category: string;
      type: string;
      color?: string;
    }[];
  };
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onAssign?: (task: Task) => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const priorityConfig = {
  LOW: { label: "Low", className: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" },
  HIGH: { label: "High", className: "bg-orange-100 text-orange-800 hover:bg-orange-200" },
  URGENT: { label: "Urgent", className: "bg-red-100 text-red-800 hover:bg-red-200" },
};

const statusConfig = {
  TODO: { label: "To Do", className: "bg-gray-100 text-gray-800" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-800" },
  DONE: { label: "Done", className: "bg-green-100 text-green-800" },
};

export const TaskCard = React.forwardRef<HTMLDivElement, TaskCardProps>(({
  task,
  onEdit,
  onDelete,
  onAssign,
  isDragging = false,
  style,
  className,
  ...props
}, ref) => {
  const priorityInfo = priorityConfig[task.priority];
  const statusInfo = statusConfig[task.status];

  const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), new Date());
  const isDueSoon = task.dueDate && isAfter(new Date(task.dueDate), new Date()) && 
                   isBefore(new Date(task.dueDate), subDays(new Date(), -2));

  return (
    <Card 
      ref={ref}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md",
        isDragging && "opacity-50 rotate-3 scale-105 shadow-lg",
        isOverdue && "border-l-4 border-l-red-500",
        isDueSoon && "border-l-4 border-l-yellow-500",
        className
      )}
      style={style}
      {...props}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-medium text-sm line-clamp-2 flex-1">
                {task.title}
              </h3>
              {/* Prominent Assignee Avatar */}
              {task.assignee && (
                <Avatar className="h-7 w-7 ml-2 flex-shrink-0">
                  <AvatarImage src={(task.assignee as any).avatarUrl} alt={task.assignee.name} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                {task.description}
              </p>
            )}
            
            {/* Enhanced Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {task.tags.map((tag, index) => (
                  <Badge 
                    key={index}
                    variant="outline" 
                    className="text-xs py-0 px-1"
                    style={{ borderColor: tag.color, color: tag.color }}
                  >
                    <Tag className="h-2 w-2 mr-1" />
                    {tag.category}/{tag.type}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  Edit Task
                </DropdownMenuItem>
              )}
              {onAssign && (
                <DropdownMenuItem onClick={() => onAssign(task)}>
                  Assign Task
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(task)}
                  className="text-destructive"
                >
                  Delete Task
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 flex-wrap">
            <Badge 
              variant="secondary" 
              className={cn("text-xs py-0 px-2", priorityInfo.className)}
            >
              {priorityInfo.label}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn("text-xs py-0 px-2", statusInfo.className)}
            >
              {statusInfo.label}
            </Badge>
          </div>
          
          {(isOverdue || isDueSoon) && (
            <div className="flex items-center">
              <AlertCircle 
                className={cn(
                  "h-3 w-3",
                  isOverdue ? "text-red-500" : "text-yellow-500"
                )}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className={cn(
                  "truncate",
                  isOverdue && "text-red-600 font-medium"
                )}>
                  {format(new Date(task.dueDate), "MMM d")}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="truncate">{format(new Date(task.createdAt), "MMM d")}</span>
            </div>
          </div>

          {!task.assignee && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="text-xs">Unassigned</span>
            </div>
          )}
          
          {task.assignee && (
            <div className="text-xs truncate max-w-20">
              {task.assignee.name.split(' ')[0]}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

TaskCard.displayName = "TaskCard";