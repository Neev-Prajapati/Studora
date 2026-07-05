"use client";

import { Bell, User, LogOut } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { useState } from "react";

export default function TopNav() {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="h-16 flex-shrink-0 bg-background border-b border-border flex items-center justify-between px-6">
      <div className="flex-1 flex items-center">
        {/* Removed Search Bar */}
      </div>
      <div className="ml-4 flex items-center gap-4">
        <button className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
          <span className="sr-only">View notifications</span>
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-destructive ring-2 ring-background"></span>
        </button>
        
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
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate">
                  {session?.user?.name ? ((session.user as any).username ? `@${(session.user as any).username}` : session.user.name.split(" ")[0]) : "User"}
                </p>
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
  );
}
