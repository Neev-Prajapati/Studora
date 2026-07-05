"use client";

import { Home, CheckSquare, Settings, BookOpen } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <BookOpen className="h-6 w-6 text-sidebar-primary mr-2" />
        <span className="text-xl font-bold text-sidebar-foreground">Studora</span>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
          <Home className="h-5 w-5 mr-3" />
          Dashboard
        </a>
        <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors">
          <CheckSquare className="h-5 w-5 mr-3 text-muted-foreground" />
          Assignments
        </a>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors">
          <Settings className="h-5 w-5 mr-3 text-muted-foreground" />
          Settings
        </a>
      </div>
    </aside>
  );
}
