"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Filter, X, User } from "lucide-react";
import { Task, TaskFilters as TaskFiltersType } from "@/stores/taskStore";
import { cn } from "@/lib/utils";

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFiltersChange: (filters: Partial<TaskFiltersType>) => void;
  onClearFilters: () => void;
  projectMembers?: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  }>;
  className?: string;
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

export function TaskFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  projectMembers = [],
  className,
}: TaskFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.search || "");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFiltersChange({ search: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ 
      status: value === "ALL" ? undefined : value as Task["status"] 
    });
  };

  const handlePriorityChange = (value: string) => {
    onFiltersChange({ 
      priority: value === "ALL" ? undefined : value as Task["priority"] 
    });
  };

  const handleAssigneeChange = (value: string) => {
    onFiltersChange({ 
      assigneeId: value === "ALL" ? undefined : value 
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.priority) count++;
    if (filters.assigneeId) count++;
    if (filters.search) count++;
    return count;
  };

  const selectedAssignee = projectMembers.find(member => member.id === filters.assigneeId);
  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || "ALL"}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
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
                  value={filters.priority || "ALL"}
                  onValueChange={handlePriorityChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Priorities</SelectItem>
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

              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select
                  value={filters.assigneeId || "ALL"}
                  onValueChange={handleAssigneeChange}
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
                      ) : filters.assigneeId === "UNASSIGNED" ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Unassigned</span>
                        </div>
                      ) : (
                        "All Assignees"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Assignees</SelectItem>
                    <SelectItem value="UNASSIGNED">
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
            </div>
          </PopoverContent>
        </Popover>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}