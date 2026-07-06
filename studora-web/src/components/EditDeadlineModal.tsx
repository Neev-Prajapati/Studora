"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Calendar } from "lucide-react";
import { updateAssignmentDeadlineAction } from "@/actions/assignment";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  assignment: any;
};

export default function EditDeadlineModal({ isOpen, onClose, roomId, assignment }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (isOpen && assignment) {
      // Format the existing deadline for the datetime-local input
      const date = new Date(assignment.deadline);
      // Get local time string format "YYYY-MM-DDThh:mm"
      const offset = date.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
      setDeadline(localISOTime);
      setError("");
    }
  }, [isOpen, assignment]);

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!deadline) {
      setError("Please select a valid deadline.");
      setLoading(false);
      return;
    }

    try {
      const res = await updateAssignmentDeadlineAction(
        assignment.id,
        roomId,
        new Date(deadline).toISOString()
      );

      if (res.error) {
        throw new Error(res.error);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-lg relative overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Edit Deadline</h2>
          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg border border-border mb-2">
            <p className="text-sm font-medium text-foreground line-clamp-1">{assignment.title}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">New Deadline <span className="text-destructive">*</span></label>
            <input 
              name="deadline" 
              type="datetime-local" 
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-muted text-foreground rounded-md font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
              {loading ? "Updating..." : "Update Date"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
