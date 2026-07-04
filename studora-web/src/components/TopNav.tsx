"use client";

import { Bell, Search, User, LogOut } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";

export default function TopNav() {
  const { data: session } = useSession();

  return (
    <header className="h-16 flex-shrink-0 bg-background border-b border-border flex items-center justify-between px-6">
      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-input rounded-md leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
            placeholder="Search subjects, assignments, or files..."
          />
        </div>
      </div>
      <div className="ml-4 flex items-center gap-4">
        <button className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
          <span className="sr-only">View notifications</span>
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-destructive ring-2 ring-background"></span>
        </button>
        <div className="flex items-center gap-2 cursor-pointer p-1 rounded-md hover:bg-muted transition-colors">
          {session?.user?.image ? (
            <img src={session.user.image} alt="Profile" className="h-8 w-8 rounded-full border border-border" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
              <User className="h-4 w-4" />
            </div>
          )}
          {session?.user?.name && <span className="text-sm font-medium hidden sm:block">{(session.user as any).username ? `@${(session.user as any).username}` : session.user.name.split(" ")[0]}</span>}
        </div>
        <button 
          onClick={async () => {
            await signOut();
            window.location.href = "/login";
          }}
          className="p-1.5 ml-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
