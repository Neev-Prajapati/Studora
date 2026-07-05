"use client";

import { Home, CheckSquare, Settings, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <BookOpen className="h-6 w-6 text-sidebar-primary mr-2" />
        <span className="text-xl font-bold text-sidebar-foreground">Studora</span>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        <Link 
          href="/dashboard" 
          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            pathname === '/dashboard' || pathname.startsWith('/rooms')
              ? 'bg-primary/15 text-primary' 
              : 'text-sidebar-foreground hover:bg-primary/10 hover:text-primary'
          }`}
        >
          <Home className={`h-5 w-5 mr-3 transition-colors ${pathname === '/dashboard' || pathname.startsWith('/rooms') ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
          Dashboard
        </Link>
        <Link 
          href="/assignments" 
          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            pathname.startsWith('/assignments')
              ? 'bg-primary/15 text-primary' 
              : 'text-sidebar-foreground hover:bg-primary/10 hover:text-primary'
          }`}
        >
          <CheckSquare className={`h-5 w-5 mr-3 transition-colors ${pathname.startsWith('/assignments') ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
          Assignments
        </Link>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <Link 
          href="/settings" 
          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            pathname.startsWith('/settings')
              ? 'bg-primary/15 text-primary' 
              : 'text-sidebar-foreground hover:bg-primary/10 hover:text-primary'
          }`}
        >
          <Settings className={`h-5 w-5 mr-3 transition-colors ${pathname.startsWith('/settings') ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
