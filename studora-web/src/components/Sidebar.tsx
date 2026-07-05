"use client";

import { Home, CheckSquare, Settings, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="w-64 flex-shrink-0 glass border-r border-sidebar-border hidden md:flex flex-col h-full z-10">
      <div 
        onClick={() => window.location.reload()}
        className="h-16 flex items-center px-6 border-b border-sidebar-border/50 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="bg-primary/20 p-2 rounded-xl mr-3 border border-primary/30">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Studora</span>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        <Link 
          href="/dashboard" 
          className={`group flex items-center px-4 py-2.5 my-1 text-sm font-medium rounded-full transition-all duration-300 ${
            pathname === "/dashboard" 
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          }`}
        >
          <Home className={`h-5 w-5 mr-3 transition-colors ${pathname === '/dashboard' ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`} />
          Dashboard
        </Link>
        <Link 
          href="/assignments" 
          className={`group flex items-center px-4 py-2.5 my-1 text-sm font-medium rounded-full transition-all duration-300 ${
            pathname.startsWith('/assignments')
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
          }`}
        >
          <CheckSquare className={`h-5 w-5 mr-3 transition-colors ${pathname.startsWith('/assignments') ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`} />
          Assignments
        </Link>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <Link 
          href="/settings" 
          className={`group flex items-center px-4 py-2.5 my-1 text-sm font-medium rounded-full transition-all duration-300 ${
            pathname.startsWith('/settings')
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
          }`}
        >
          <Settings className={`h-5 w-5 mr-3 transition-colors ${pathname.startsWith('/settings') ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
