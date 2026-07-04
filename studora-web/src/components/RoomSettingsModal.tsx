"use client";

import { useState } from "react";
import { renameRoomAction, transferOwnership, deleteRoomAction } from "@/actions/room";
import { X, AlertTriangle, Key, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";

type Member = {
  userId: string;
  name: string;
  role: string;
};

type RoomSettingsProps = {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  members: Member[];
};

export default function RoomSettingsModal({ isOpen, onClose, roomId, roomName, members }: RoomSettingsProps) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Tabs: 'general' | 'transfer' | 'danger'
  const [activeTab, setActiveTab] = useState<"general" | "transfer" | "danger">("general");

  // State
  const [newName, setNewName] = useState(roomName);
  const [targetUserId, setTargetUserId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");

  if (!isOpen) return null;

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newName !== roomName) {
      const res = await renameRoomAction(roomId, newName);
      if (res.error) setError(res.error);
      else onClose();
    }
    setLoading(false);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!targetUserId) {
      setError("Please select a member");
      setLoading(false);
      return;
    }

    const res = await transferOwnership(roomId, targetUserId);
    if (res.error) setError(res.error);
    else onClose(); // Closing will show they are now an editor
    setLoading(false);
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (confirmDelete !== roomName) {
      setError("Room name does not match");
      setLoading(false);
      return;
    }

    const res = await deleteRoomAction(roomId);
    if (res.error) setError(res.error);
    else {
      // The server action already revalidated /dashboard, but we are on /rooms/[id], so we must push
      router.push("/dashboard");
    }
    setLoading(false);
  };

  // Filter out the current owner from the transfer list
  const transferCandidates = members.filter(m => m.role !== 'owner');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg relative overflow-hidden flex flex-col h-[500px]">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Room Settings</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-border bg-muted/30 p-2 space-y-1">
            <button
              onClick={() => { setActiveTab("general"); setError(""); }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === "general" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Edit3 className="w-4 h-4" /> General
            </button>
            <button
              onClick={() => { setActiveTab("transfer"); setError(""); }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === "transfer" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Key className="w-4 h-4" /> Transfer
            </button>
            <button
              onClick={() => { setActiveTab("danger"); setError(""); }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === "danger" ? "bg-destructive text-destructive-foreground" : "text-destructive hover:bg-destructive/10"}`}
            >
              <AlertTriangle className="w-4 h-4" /> Delete
            </button>
          </div>

          {/* Content */}
          <div className="w-2/3 p-6 overflow-y-auto">
            {activeTab === "general" && (
              <form onSubmit={handleRename} className="space-y-4">
                <h3 className="font-semibold text-foreground mb-4">General Settings</h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Room Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || newName === roomName}
                  className="w-full px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            )}

            {activeTab === "transfer" && (
              <form onSubmit={handleTransfer} className="space-y-4">
                <h3 className="font-semibold text-foreground mb-4">Transfer Ownership</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Transferring ownership will instantly downgrade you to an Editor. This action cannot be undone unless the new owner transfers it back.
                </p>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Select New Owner</label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    required
                  >
                    <option value="" disabled>Select a member...</option>
                    {transferCandidates.map(m => (
                      <option key={m.userId} value={m.userId}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !targetUserId}
                  className="w-full px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
                >
                  {loading ? "Transferring..." : "Transfer Ownership"}
                </button>
              </form>
            )}

            {activeTab === "danger" && (
              <form onSubmit={handleDelete} className="space-y-4">
                <h3 className="font-semibold text-destructive mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Delete Room
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  This will permanently delete the room, remove all members, and destroy all uploaded files. This action cannot be undone.
                </p>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Type <strong>{roomName}</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    required
                    value={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.value)}
                    className="w-full px-3 py-2 border border-destructive/50 focus:border-destructive rounded-md bg-background text-foreground"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || confirmDelete !== roomName}
                  className="w-full px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md transition-colors disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Permanently Delete Room"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
