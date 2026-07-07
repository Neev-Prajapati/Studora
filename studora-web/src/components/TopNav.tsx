"use client";

import { User, LogOut, Edit2, Menu, X, Home, CheckSquare, Settings, BookOpen } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import EditUsernameModal from "./EditUsernameModal";
import { Tooltip } from "./Tooltip";

export default function TopNav() {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditUsernameOpen, setIsEditUsernameOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const currentUsername = session?.user?.name ? ((session.user as any).username ? `${(session.user as any).username}` : session.user.name.split(" ")[0]) : "";

  return (
    <>
    <EditUsernameModal 
      isOpen={isEditUsernameOpen} 
      onClose={() => setIsEditUsernameOpen(false)} 
      currentUsername={currentUsername}
    />
    <header className="h-16 flex-shrink-0 glass border-b border-border/50 flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex-1 flex items-center">
        <button 
          className="md:hidden p-2 -ml-2 mr-2 text-foreground hover:bg-muted rounded-md transition-colors"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
        {/* Removed Search Bar */}
      </div>
      <div className="ml-4 flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-muted transition-colors focus:outline-none"
          >
            {session?.user?.image ? (
              <img src={session.user.image} alt="Profile" className="h-8 w-8 rounded-full border border-border" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                <User className="h-4 w-4" />
              </div>
            )}
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-medium text-foreground truncate">
                  {currentUsername ? `@${currentUsername}` : "User"}
                </p>
                <Tooltip content="Edit Username">
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsEditUsernameOpen(true);
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>
              <div className="p-1">
                <button
                  onClick={async () => {
                    await signOut();
                    window.location.href = "/login";
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Mobile Sidebar Overlay */}
    {isMobileMenuOpen && (
      <div className="fixed inset-0 z-[60] flex md:hidden">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className="relative w-64 max-w-sm flex flex-col glass h-full animate-in slide-in-from-left duration-300 shadow-2xl">
          <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border/50">
            <div className="flex items-center">
              <div className="bg-primary/20 p-2 rounded-xl mr-3 border border-primary/30">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Studora</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 -mr-2 text-muted-foreground hover:bg-muted rounded-md">
              <X className="h-5 w-5"/>
            </button>
          </div>
          
          <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
            <Link 
              href="/dashboard" 
              onClick={() => setIsMobileMenuOpen(false)}
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
              onClick={() => setIsMobileMenuOpen(false)}
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

          <div className="p-4 border-t border-sidebar-border/50">
            <Link 
              href="/settings" 
              onClick={() => setIsMobileMenuOpen(false)}
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
        </div>
      </div>
    )}
    </>
  );
}
