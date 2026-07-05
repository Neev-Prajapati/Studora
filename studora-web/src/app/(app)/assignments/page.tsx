"use client";

import { Folder, Plus, Copy, Check } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { getAssignmentRooms } from "@/actions/assignment";
import AssignmentModals from "@/components/AssignmentModals";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AssignmentsDashboard() {
  const router = useRouter();
  const { data: session } = useSession();

  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    const res = await getAssignmentRooms();
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
      <AssignmentModals 
        isOpen={modalOpen} 
        type={modalType} 
        onClose={closeModal} 
        onSuccess={fetchRooms} 
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Assignments
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track your assignment submissions here.</p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              Your Assignment Rooms
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
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
              <div className="col-span-full rounded-xl border border-dashed border-border bg-transparent p-8 flex flex-col items-center justify-center text-center">
                <Folder className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-foreground font-medium mb-1">No assignment rooms yet</p>
                <p className="text-sm text-muted-foreground mb-4">Create or join an assignment room to get started.</p>
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
                <div key={room.id} onClick={() => router.push(`/assignments/${room.id}`)} className="group relative rounded-2xl glass-card p-5 hover:-translate-y-1 transition-all cursor-pointer">
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
                      <button 
                        onClick={(e) => copyCode(room.inviteCode, e)}
                        className="font-mono text-xs bg-muted px-2 py-1 rounded-md text-foreground mr-2 hover:bg-muted/80 transition-colors flex items-center gap-1" 
                        title="Copy Code"
                      >
                        {room.inviteCode}
                        {copiedCode === room.inviteCode ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    </div>
                    <Link href={`/assignments/${room.id}`} onClick={(e) => e.stopPropagation()} className="text-primary text-xs font-medium hover:underline">
                      Open
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
