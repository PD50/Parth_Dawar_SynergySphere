"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AtSign, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  isOnline?: boolean;
}

interface MentionAutocompleteProps {
  query: string;
  onSelect: (user: User) => void;
  onClose: () => void;
  projectId?: string;
  maxResults?: number;
  className?: string;
}

// Mock users data - replace with actual API call
const mockUsers: User[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@synergysphere.com",
    avatarUrl: "",
    role: "Owner",
    isOnline: true,
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@synergysphere.com",
    avatarUrl: "",
    role: "Admin",
    isOnline: true,
  },
  {
    id: "3",
    name: "Carol Davis",
    email: "carol@synergysphere.com",
    avatarUrl: "",
    role: "Member",
    isOnline: false,
  },
  {
    id: "4",
    name: "David Wilson",
    email: "david@synergysphere.com",
    avatarUrl: "",
    role: "Member",
    isOnline: true,
  },
  {
    id: "5",
    name: "Eve Martinez",
    email: "eve@synergysphere.com",
    avatarUrl: "",
    role: "Member",
    isOnline: false,
  },
];

async function searchUsers(query: string, projectId?: string): Promise<User[]> {
  // In a real app, this would make an API call
  // const response = await fetch(`/api/projects/${projectId}/members/search?q=${query}`);
  // return response.json();
  
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
  
  if (!query.trim()) {
    return mockUsers.slice(0, 5); // Return recent users
  }
  
  return mockUsers.filter(user =>
    user.name.toLowerCase().includes(query.toLowerCase()) ||
    user.email.toLowerCase().includes(query.toLowerCase())
  );
}

export function MentionAutocomplete({
  query,
  onSelect,
  onClose,
  projectId,
  maxResults = 8,
  className
}: MentionAutocompleteProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Search for users when query changes
  useEffect(() => {
    const searchForUsers = async () => {
      setIsLoading(true);
      try {
        const results = await searchUsers(query, projectId);
        setUsers(results.slice(0, maxResults));
        setSelectedIndex(0);
      } catch (error) {
        console.error('Failed to search users:', error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchForUsers();
  }, [query, projectId, maxResults]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (users.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % users.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (users[selectedIndex]) {
            onSelect(users[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [users, selectedIndex, onSelect, onClose]);

  if (users.length === 0 && !isLoading) {
    return (
      <div className={cn(
        "bg-popover border rounded-lg shadow-md p-3 min-w-[250px]",
        className
      )}>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Search className="h-4 w-4" />
          <span className="text-sm">
            {query ? `No users found for "${query}"` : "Start typing to search..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-popover border rounded-lg shadow-lg min-w-[280px] max-w-[320px] overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="px-3 py-2 border-b bg-muted/20">
        <div className="flex items-center space-x-2 text-sm font-medium">
          <AtSign className="h-4 w-4" />
          <span>Mention someone</span>
        </div>
      </div>

      {/* User list */}
      <ScrollArea className="max-h-[200px]">
        {isLoading ? (
          <div className="p-3 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="text-sm">Searching...</span>
            </div>
          </div>
        ) : (
          <div className="py-1">
            {users.map((user, index) => (
              <div
                key={user.id}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 cursor-pointer transition-colors",
                  index === selectedIndex 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent/50"
                )}
                onClick={() => onSelect(user)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {user.isOnline && (
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm truncate">
                      {user.name}
                    </span>
                    {user.role && (
                      <Badge variant="secondary" className="text-xs">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>

                {index === selectedIndex && (
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 bg-primary rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 py-2 border-t bg-muted/10">
        <p className="text-xs text-muted-foreground">
          Use ↑↓ to navigate, Enter to select, Esc to close
        </p>
      </div>
    </div>
  );
}