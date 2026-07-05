"use client";

import { useState } from "react";
import { Folder, Users, Settings, Upload, FileText, Download, Eye, Trash2, ArrowLeft, MoreVertical, Loader2 } from "lucide-react";
import Link from "next/link";
import RoomSettingsModal from "./RoomSettingsModal";
import FilePreviewModal from "./FilePreviewModal";
import { deleteFileAction, updateMemberRole, removeMember, saveFileRecord } from "@/actions/room";
import { useRouter } from "next/navigation";

export default function RoomView({ 
  roomId, 
  roomName, 
  roomDescription, 
  inviteCode, 
  role, 
  files, 
  members,
  currentUserId,
}: any) {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{url: string, name: string} | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError("");

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
      setUploadError("Please select a file to upload.");
      setIsUploading(false);
      return;
    }

    try {
      formData.append("roomId", roomId);

      // Upload file to local storage via API route
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Upload failed");
      }

      // Save file metadata to DB
      const recordRes = await saveFileRecord(roomId, uploadData.fileName, uploadData.fileUrl);
      
      if (recordRes.error) {
        throw new Error(recordRes.error);
      }

      // Reset form on success
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setUploadError(err.message || "An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      await deleteFileAction(roomId, fileId);
    }
  };

  const handleRoleChange = async (targetId: string, newRole: 'editor' | 'viewer') => {
    await updateMemberRole(roomId, targetId, newRole);
    setActiveDropdown(null);
  };

  const handleRemoveMember = async (targetId: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      await removeMember(roomId, targetId);
      setActiveDropdown(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <RoomSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        roomId={roomId}
        roomName={roomName}
        members={members}
      />
      
      <FilePreviewModal 
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || null}
        fileName={previewFile?.name || null}
      />

      {/* Header */}
      <div>
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{roomName}</h1>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${
                role === 'owner' ? 'bg-primary/20 text-primary' : 
                role === 'editor' ? 'bg-orange-500/20 text-orange-500' : 
                'bg-muted text-muted-foreground'
              }`}>
                {role}
              </span>
            </div>
            {roomDescription && (
              <p className="text-muted-foreground mt-2 max-w-2xl">{roomDescription}</p>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-4 text-right">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 text-left">Invite Code</p>
              <div className="font-mono text-lg font-bold tracking-widest bg-muted px-3 py-1 rounded-md text-foreground">
                {inviteCode}
              </div>
            </div>
            {role === 'owner' && (
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="mt-6 p-2 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title="Room Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Content (Files) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col gap-4 border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Folder className="w-5 h-5 text-primary" />
                Study Materials
              </h2>
              
              {(role === 'owner' || role === 'editor') && (
                <form onSubmit={handleUpload} className="flex gap-2 items-center">
                  <input 
                    type="file" 
                    name="file" 
                    required
                    disabled={isUploading}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors file:cursor-pointer file:disabled:opacity-50 disabled:opacity-50 cursor-pointer"
                  />
                  <button 
                    type="submit"
                    disabled={isUploading}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? "Uploading..." : "Upload"}
                  </button>
                </form>
              )}
            </div>
            
            {uploadError && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md font-medium">
                {uploadError}
              </div>
            )}
          </div>

          {files && files.length > 0 ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <ul className="divide-y divide-border">
                {files.map((file: any) => (
                  <li key={file.id} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground line-clamp-1">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Uploaded by <span className="font-medium text-foreground">{file.uploaderName}</span> • {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setPreviewFile({ url: file.url, name: file.name })}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-colors inline-flex" 
                        title="Preview in App"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a 
                        href={file.url} 
                        download={file.name}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-background rounded-md transition-colors inline-flex" 
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {(role === 'owner' || (role === 'editor' && file.uploaderId === currentUserId)) && (
                        <button 
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-background rounded-md transition-colors" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-transparent p-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No files uploaded yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {(role === 'owner' || role === 'editor') 
                  ? "Upload study materials, notes, or assignments to share with the room." 
                  : "Wait for the room owner or editors to upload study materials."}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar (Members) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              Members ({members?.length || 0})
            </h3>
            
            <ul className="space-y-4">
              {members?.map((member: any) => (
                <li key={member.userId} className="flex items-center justify-between relative">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-xs shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-semibold tracking-wider ${
                      member.role === 'owner' ? 'text-primary' : 
                      member.role === 'editor' ? 'text-orange-500' : 
                      'text-muted-foreground'
                    }`}>
                      {member.role}
                    </span>

                    {/* Member Options (Owner only, cannot edit themselves here) */}
                    {role === 'owner' && member.userId !== currentUserId && (
                      <div className="relative">
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === member.userId ? null : member.userId)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeDropdown === member.userId && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-md shadow-md z-10 text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            {member.role === 'viewer' ? (
                              <button 
                                onClick={() => handleRoleChange(member.userId, 'editor')}
                                className="w-full text-left px-3 py-2 text-foreground hover:bg-muted transition-colors"
                              >
                                Make Editor
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleRoleChange(member.userId, 'viewer')}
                                className="w-full text-left px-3 py-2 text-foreground hover:bg-muted transition-colors"
                              >
                                Make Viewer
                              </button>
                            )}
                            <button 
                              onClick={() => handleRemoveMember(member.userId)}
                              className="w-full text-left px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
                            >
                              Remove Member
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
