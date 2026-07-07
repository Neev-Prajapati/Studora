"use client";

import { Folder, Clock, FileText, ChevronRight, MoreHorizontal, Activity, Plus, Copy, Check } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { getUserRooms, getRecentActivity } from "@/actions/room";
import { getUpcomingDeadlines } from "@/actions/assignment";
import RoomModals from "@/components/RoomModals";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/components/PreferencesProvider";
import { Tooltip } from "@/components/Tooltip";

// Global in-memory cache for instant navigation (stale-while-revalidate)
let cachedRooms: any[] | null = null;
let cachedActivity: any[] | null = null;
let cachedDeadlines: any[] | null = null;

export default function Dashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const preferences = usePreferences();

  const [rooms, setRooms] = useState<any[]>(cachedRooms || []);
  const [deadlines, setDeadlines] = useState<any[]>(cachedDeadlines || []);
  const [recentActivity, setRecentActivity] = useState<any[]>(cachedActivity || []);
  const [isRoomsLoading, setIsRoomsLoading] = useState(!cachedRooms);
  const [isActivityLoading, setIsActivityLoading] = useState(!cachedActivity);
  const [isDeadlinesLoading, setIsDeadlinesLoading] = useState(!cachedDeadlines);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "join" | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const fetchRoomsData = useCallback(async () => {
    if (!cachedRooms) setIsRoomsLoading(true);
    const res = await getUserRooms();
    if (res.success && res.rooms) {
      setRooms(res.rooms);
      cachedRooms = res.rooms;
    }
    setIsRoomsLoading(false);
  }, []);

  const fetchDashboardData = useCallback(() => {
    fetchRoomsData();
    
    (async () => {
      if (!cachedActivity) setIsActivityLoading(true);
      const actRes = await getRecentActivity();
      if (actRes.success && actRes.activities) {
        const formattedActivities = actRes.activities.map((a: any) => ({
          id: a.id,
          user: a.username ? a.username : (a.user ? a.user.split(" ")[0] : "User"),
          action: a.action,
          target: a.target || "",
          time: new Date(a.createdAt).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
          subject: a.roomName,
        }));
        setRecentActivity(formattedActivities);
        cachedActivity = formattedActivities;
      }
      setIsActivityLoading(false);
    })();
    
    (async () => {
      if (!cachedDeadlines) setIsDeadlinesLoading(true);
      const dlRes = await getUpcomingDeadlines();
      if (dlRes.success && dlRes.deadlines) {
        const now = new Date();
        const formattedDeadlines = dlRes.deadlines.map((dl: any) => {
          const deadlineDate = new Date(dl.deadline);
          const hoursDiff = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          let status = 'green';
          if (hoursDiff <= 4) {
            status = 'red';
          } else if (hoursDiff <= 24) {
            status = 'yellow';
          }

          return {
            id: dl.id,
            task: dl.title,
            subject: dl.roomName,
            status,
            due: deadlineDate.toLocaleString(undefined, {
              timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })
          };
        });
        setDeadlines(formattedDeadlines);
        cachedDeadlines = formattedDeadlines;
      }
      setIsDeadlinesLoading(false);
    })();
  }, [fetchRoomsData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
        onSuccess={fetchRoomsData} 
      />

      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-1">Here is an overview of your academic workspace.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Rooms & Activity) */}
        <div className={`space-y-8 ${preferences.showUpcomingDeadlines ? "lg:col-span-2" : "lg:col-span-3"}`}>
          
          {/* Study Rooms */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Folder className="h-5 w-5 text-primary" />
                Your Subjects
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => openModal('join')}
                  className="text-sm font-medium text-foreground hover:bg-muted px-3 py-1.5 rounded-md transition-colors"
                >
                  Join Subject
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
              {isRoomsLoading ? (
                <>
                  {[1, 2].map((i) => (
                    <div key={i} className="group relative rounded-2xl glass-card p-5 animate-pulse">
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-10 w-10 rounded-lg bg-muted"></div>
                        <div className="h-4 w-12 bg-muted rounded-sm"></div>
                      </div>
                      <div className="h-5 w-3/4 bg-muted rounded mb-2"></div>
                      <div className="h-3 w-1/2 bg-muted rounded mb-4"></div>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <div className="h-4 w-16 bg-muted rounded"></div>
                        <div className="h-4 w-16 bg-muted rounded"></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : rooms.length === 0 ? (
                <div className="sm:col-span-2 rounded-xl border border-dashed border-border bg-transparent p-8 flex flex-col items-center justify-center text-center">
                  <Folder className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-foreground font-medium mb-1">No rooms yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Create or join a room to start collaborating.</p>
                  <div className="flex gap-3">
                    <button onClick={() => openModal('create')} className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm">
                      Create Subject
                    </button>
                    <button onClick={() => openModal('join')} className="bg-muted text-foreground hover:bg-muted/80 px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm">
                      Join via Code
                    </button>
                  </div>
                </div>
              ) : (
                rooms.map((room) => (
                  <div key={room.id} onClick={() => router.push(`/rooms/${room.id}`)} className="group relative rounded-2xl glass-card p-5 hover:-translate-y-1 transition-all cursor-pointer">
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
                        <Tooltip content="Copy Code">
                          <button 
                            onClick={(e) => copyCode(room.inviteCode, e)}
                            className="font-mono text-xs bg-muted px-2 py-1 rounded-md text-foreground mr-2 hover:bg-muted/80 transition-colors flex items-center gap-1" 
                          >
                            {room.inviteCode}
                            {copiedCode === room.inviteCode ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                          </button>
                        </Tooltip>
                      </div>
                      <Link href={`/rooms/${room.id}`} onClick={(e) => e.stopPropagation()} className="text-primary text-xs font-medium hover:underline">
                        Open
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Recent Activity */}
          {preferences.showRecentActivity && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </h2>
              </div>
              <div className="rounded-2xl glass-card overflow-y-auto max-h-[380px] custom-scrollbar">
                {isActivityLoading ? (
                  <div className="divide-y divide-border">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 animate-pulse">
                        <div className="flex space-x-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="h-4 w-1/2 bg-muted rounded"></div>
                              <div className="h-3 w-16 bg-muted rounded"></div>
                            </div>
                            <div className="h-3 w-1/3 bg-muted rounded mt-2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length === 0 ? (
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
          )}

        </div>

        {/* Right Column (Upcoming Deadlines) */}
        {preferences.showUpcomingDeadlines && (
          <div className="lg:col-span-1 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Upcoming Deadlines
              </h2>
            </div>
            
            {isDeadlinesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl glass-card p-4 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="flex justify-between items-start mb-1">
                        <div className="h-3 w-1/3 bg-muted rounded"></div>
                        <div className="h-4 w-12 bg-muted rounded-sm"></div>
                      </div>
                      <div className="h-4 w-3/4 bg-muted rounded"></div>
                      <div className="h-3 w-1/2 bg-muted rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : deadlines.length === 0 ? (
               <div className="rounded-2xl glass-card p-8 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">No upcoming deadlines.</p>
               </div>
            ) : (
              <div className="space-y-4">
                {deadlines.map((deadline) => (
                  <div key={deadline.id} onClick={() => router.push(`/assignments`)} className="rounded-2xl glass-card p-4 relative overflow-hidden group hover:-translate-y-1 transition-all cursor-pointer">
                    {deadline.status === 'red' && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                    )}
                    {deadline.status === 'yellow' && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
                    )}
                    {deadline.status === 'green' && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                    )}
                    <div className="pl-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{deadline.subject}</span>
                        {deadline.status === 'red' && (
                          <span className="inline-flex items-center rounded-sm bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                            Urgent
                          </span>
                        )}
                        {deadline.status === 'yellow' && (
                          <span className="inline-flex items-center rounded-sm bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-500">
                            Soon
                          </span>
                        )}
                        {deadline.status === 'green' && (
                          <span className="inline-flex items-center rounded-sm bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-500">
                            Upcoming
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
        )}

      </div>
    </div>
  );
}
