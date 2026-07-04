"use client";

import { Folder, Clock, FileText, ChevronRight, MoreHorizontal, Activity } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/lib/auth-client";

export default function Dashboard() {
  const { data: session } = useSession();

  // Data will be fetched from Supabase in the future
  const [subjects, setSubjects] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
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
        
        {/* Left Column (Subjects & Activity) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Enrolled Subjects */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Folder className="h-5 w-5 text-primary" />
                Enrolled Subjects
              </h2>
              {subjects.length > 0 && (
                <a href="#" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center">
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.length === 0 ? (
                <div className="sm:col-span-2 rounded-xl border border-dashed border-border bg-transparent p-8 flex flex-col items-center justify-center text-center">
                  <Folder className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground font-medium mb-1">No subjects yet</p>
                  <p className="text-sm text-muted-foreground mb-4">You haven't enrolled in any subjects.</p>
                  <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm">
                    Join a Subject
                  </button>
                </div>
              ) : (
                subjects.map((subject) => (
                  <div key={subject.id} className="group relative rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Folder className="h-5 w-5" />
                      </div>
                      <button className="text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-card-foreground line-clamp-1">{subject.name}</h3>
                    <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                      <span>{subject.members} members</span>
                      {subject.unread > 0 && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {subject.unread} new
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              
              {/* Add New Subject Card (Only show alongside existing subjects) */}
              {subjects.length > 0 && (
                <div className="rounded-xl border border-dashed border-border bg-transparent p-5 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all cursor-pointer min-h-[140px]">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-2">
                    <span className="text-lg font-medium">+</span>
                  </div>
                  <span className="font-medium text-sm">Join Subject</span>
                </div>
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
