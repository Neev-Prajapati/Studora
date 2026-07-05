"use client";

import { useEffect, useState } from "react";
import { getUpcomingDeadlines } from "@/actions/assignment";
import { Clock, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeadlinePopup() {
  const [closestDeadline, setClosestDeadline] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only run once per session
    // const hasShown = sessionStorage.getItem("hasShownDeadlinePopup");
    // if (hasShown) return;

    const fetchDeadlines = async () => {
      const res = await getUpcomingDeadlines();
      if (res.success && res.deadlines && res.deadlines.length > 0) {
        // Find the closest deadline that is in the future
        const now = new Date();
        const futureDeadlines = res.deadlines.filter((d: any) => new Date(d.deadline) > now);
        
        if (futureDeadlines.length > 0) {
          setClosestDeadline(futureDeadlines[0]);
          setIsOpen(true);
          // sessionStorage.setItem("hasShownDeadlinePopup", "true");
        }
      }
    };

    fetchDeadlines();
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !closestDeadline) return null;

  const dateObj = new Date(closestDeadline.deadline);
  const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  // Calculate time remaining
  const now = new Date();
  const diffTime = Math.abs(dateObj.getTime() - now.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  let timeRemaining = "";
  if (diffDays > 0) {
    timeRemaining = `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    timeRemaining = `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else {
    timeRemaining = "soon";
  }

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-500 max-w-sm w-full">
      <div className="bg-card border border-border shadow-lg rounded-xl overflow-hidden flex flex-col relative group">
        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
        
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-4 pl-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-sm text-foreground">Upcoming Deadline</h3>
          </div>
          
          <p className="text-foreground font-medium mb-1 pr-6">{closestDeadline.title}</p>
          <p className="text-xs text-muted-foreground mb-3">
            {closestDeadline.roomName} • {timeRemaining}
          </p>
          
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-border">
            <span className="text-xs font-medium text-orange-500">
              {formattedDate} at {formattedTime}
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/assignments");
              }}
              className="text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors"
            >
              View Assignments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
