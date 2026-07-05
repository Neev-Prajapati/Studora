"use client";

import { useState } from "react";
import { X, Loader2, Upload } from "lucide-react";
import { createAssignmentRecord } from "@/actions/assignment";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
};

export default function CreateAssignmentModal({ isOpen, onClose, roomId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const deadline = formData.get("deadline") as string;
    const file = formData.get("file") as File;

    if (!title || !deadline || !file || file.size === 0) {
      setError("Please fill in all required fields and select a file.");
      setLoading(false);
      return;
    }

    try {
      // Re-using the /api/upload route that works with S3
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("roomId", roomId);
      uploadData.append("roomType", "assignment");
      uploadData.append("uploadType", "assignment");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadJson.error || "Failed to upload file");
      }

      const res = await createAssignmentRecord(
        roomId,
        title,
        description,
        uploadJson.fileUrl,
        uploadJson.fileName,
        deadline
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
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-lg relative overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Create Assignment</h2>
          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title <span className="text-destructive">*</span></label>
            <input 
              name="title" 
              type="text" 
              required 
              placeholder="e.g. Chapter 4 Homework"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea 
              name="description" 
              rows={3} 
              placeholder="Optional instructions..."
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Deadline <span className="text-destructive">*</span></label>
            <input 
              name="deadline" 
              type="datetime-local" 
              required 
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Question File <span className="text-destructive">*</span></label>
            <input 
              name="file" 
              type="file" 
              required 
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {loading ? "Creating..." : "Create Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
