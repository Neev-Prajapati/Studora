"use client";

import { useState } from "react";
import { createRoom, joinRoom } from "@/actions/room";
import { X, Loader2 } from "lucide-react";

type RoomModalsProps = {
  isOpen: boolean;
  type: "create" | "join" | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function RoomModals({ isOpen, type, onClose, onSuccess }: RoomModalsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Create Room State
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  
  // Join Room State
  const [inviteCode, setInviteCode] = useState("");

  if (!isOpen || !type) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await createRoom(roomName, description);
    if (res.error) {
      setError(res.error);
    } else {
      setRoomName("");
      setDescription("");
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await joinRoom(inviteCode);
    if (res.error) {
      setError(res.error);
    } else {
      setInviteCode("");
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {type === "create" ? (
          <form onSubmit={handleCreate} className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Create a Subject</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Create a space to share materials with your classmates.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Room Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. CS101"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this room for?"
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !roomName.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Creating..." : "Create Subject"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Join a Subject</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the 6-character invite code provided by the room owner.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Invite Code <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3"
                  className="w-full px-3 py-2 text-center tracking-widest text-lg font-mono uppercase border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || inviteCode.length !== 6}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Joining..." : "Join Subject"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
