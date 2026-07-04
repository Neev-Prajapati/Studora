"use client";

import { Folder, Clock, FileText, ChevronRight, MoreHorizontal, Activity, Plus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { getUserRooms } from "@/actions/room";
import RoomModals from "@/components/RoomModals";
import Link from "next/link";

export default function Dashboard() {
  const { data: session } = useSession();

  const [rooms, setRooms] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "join" | null>(null);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    const res = await getUserRooms();
    if (res.success && res.rooms) {
      setRooms(res.rooms);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const openModal = (type: "create" | "join") => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => setModalType(null), 200);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 relative">
      <RoomModals 
        isOpen={modalOpen} 
        type={modalType} 
        onClose={closeModal} 
        onSuccess={fetchRooms} 
      />

      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-1">Here is an overview of your academic workspace.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 ring-1 ring-inset ring-green-500/20">
            Systems Online
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Rooms & Activity) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Study Rooms */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Folder className="h-5 w-5 text-primary" />
                Your Study Rooms
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => openModal('join')}
                  className="text-sm font-medium text-foreground hover:bg-muted px-3 py-1.5 rounded-md transition-colors"
                >
                  Join Room
                </button>
                <button 
                  onClick={() => openModal('create')}
                  className="text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" /> Create
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isLoading ? (
                 <div className="sm:col-span-2 p-8 text-center text-muted-foreground">Loading rooms...</div>
              ) : rooms.length === 0 ? (
                <div className="sm:col-span-2 rounded-xl border border-dashed border-border bg-transparent p-8 flex flex-col items-center justify-center text-center">
                  <Folder className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-foreground font-medium mb-1">No rooms yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Create or join a room to start collaborating.</p>
                  <div className="flex gap-3">
                    <button onClick={() => openModal('create')} className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm">
                      Create Room
                    </button>
                    <button onClick={() => openModal('join')} className="bg-muted text-foreground hover:bg-muted/80 px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm">
                      Join via Code
                    </button>
                  </div>
                </div>
              ) : (
                rooms.map((room) => (
                  <div key={room.id} className="group relative rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Folder className="h-5 w-5" />
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${
                        room.role === 'owner' ? 'bg-primary/20 text-primary' : 
                        room.role === 'editor' ? 'bg-orange-500/20 text-orange-500' : 
                        'bg-muted text-muted-foreground'
                      }`}>
                        {room.role}
                      </span>
                    </div>
                    <h3 className="font-semibold text-card-foreground line-clamp-1">{room.name}</h3>
                    {room.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{room.description}</p>}
                    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground border-t border-border pt-3">
                      <div className="flex items-center">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground mr-2" title="Invite Code">
                          {room.inviteCode}
                        </span>
                      </div>
                      <Link href={`/rooms/${room.id}`} className="text-primary text-xs font-medium hover:underline">
                        Open Room
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </h2>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {recentActivity.length === 0 ? (
                 <div className="p-8 text-center flex flex-col items-center">
                    <Activity className="h-8 w-8 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground text-sm">No recent activity to show.</p>
                 </div>
              ) : (
                <ul className="divide-y divide-border">
                  {recentActivity.map((activity) => (
                    <li key={activity.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex space-x-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-card-foreground">
                              <span className="text-primary mr-1">{activity.user}</span>
                              <span className="text-muted-foreground font-normal">{activity.action}</span>
                              <span className="ml-1 font-semibold">{activity.target}</span>
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center">
                            In <span className="mx-1 font-medium bg-muted px-1.5 rounded-sm">{activity.subject}</span>
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

        </div>

        {/* Right Column (Upcoming Deadlines) */}
        <div className="lg:col-span-1 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Upcoming Deadlines
              </h2>
            </div>
            
            {deadlines.length === 0 ? (
               <div className="rounded-xl border border-border bg-card p-8 text-center flex flex-col items-center">
                  <Clock className="h-8 w-8 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">No upcoming deadlines.</p>
               </div>
            ) : (
              <div className="space-y-4">
                {deadlines.map((deadline) => (
                  <div key={deadline.id} className="rounded-xl border border-border bg-card p-4 relative overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer">
                    {deadline.urgent && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                    )}
                    {!deadline.urgent && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    )}
                    <div className="pl-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{deadline.subject}</span>
                        {deadline.urgent && (
                          <span className="inline-flex items-center rounded-sm bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                            Urgent
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-card-foreground mb-2 group-hover:text-primary transition-colors">{deadline.task}</h3>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        {deadline.due}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}
