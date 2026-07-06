"use client";

import { useState } from "react";
import { Folder, Users, Settings, Upload, FileText, Download, Eye, Trash2, ArrowLeft, MoreVertical, Loader2, Calendar, Copy, Check } from "lucide-react";
import Link from "next/link";
import AssignmentSettingsModal from "./AssignmentSettingsModal";
import FilePreviewModal from "./FilePreviewModal";
import CreateAssignmentModal from "./CreateAssignmentModal";
import SubmitSolutionModal from "./SubmitSolutionModal";
import AssignmentSolutionsModal from "./AssignmentSolutionsModal";
import EditDeadlineModal from "./EditDeadlineModal";
import { deleteAssignmentAction, updateAssignmentMemberRole, removeAssignmentMember } from "@/actions/assignment";

export default function AssignmentRoomView({ 
  roomId, 
  roomName, 
  roomDescription, 
  inviteCode, 
  role, 
  assignments, 
  members,
  currentUserId,
}: any) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{url: string, name: string} | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Submit solution state
  const [activeAssignmentForSubmission, setActiveAssignmentForSubmission] = useState<any>(null);
  
  // View solutions state
  const [activeAssignmentForSolutions, setActiveAssignmentForSolutions] = useState<any>(null);

  // Edit deadline state
  const [activeAssignmentForEdit, setActiveAssignmentForEdit] = useState<any>(null);

  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (confirm("Are you sure you want to delete this assignment and all its submissions?")) {
      await deleteAssignmentAction(assignmentId, roomId);
    }
  };

  const handleRoleChange = async (targetId: string, newRole: 'editor' | 'viewer') => {
    await updateAssignmentMemberRole(roomId, targetId, newRole);
    setActiveDropdown(null);
  };

  const handleRemoveMember = async (targetId: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      await removeAssignmentMember(roomId, targetId);
      setActiveDropdown(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <AssignmentSettingsModal
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

      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        roomId={roomId}
      />

      {activeAssignmentForSubmission && (
        <SubmitSolutionModal
          isOpen={true}
          onClose={() => setActiveAssignmentForSubmission(null)}
          roomId={roomId}
          assignment={activeAssignmentForSubmission}
        />
      )}

      {activeAssignmentForSolutions && (
        <AssignmentSolutionsModal
          isOpen={true}
          onClose={() => setActiveAssignmentForSolutions(null)}
          assignment={activeAssignmentForSolutions}
        />
      )}

      {activeAssignmentForEdit && (
        <EditDeadlineModal
          isOpen={true}
          onClose={() => setActiveAssignmentForEdit(null)}
          roomId={roomId}
          assignment={activeAssignmentForEdit}
        />
      )}

      {/* Header */}
      <div>
        <Link href="/assignments" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Assignments
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
              <button 
                onClick={() => copyCode(inviteCode)}
                className="font-mono text-lg font-bold tracking-widest bg-muted px-3 py-1 rounded-md text-foreground hover:bg-muted/80 transition-colors flex items-center gap-2"
                title="Copy Code"
              >
                {inviteCode}
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
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
        
        {/* Main Content (Assignments) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col gap-4 border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Folder className="w-5 h-5 text-primary" />
                Assignments
              </h2>
              
              {(role === 'owner' || role === 'editor') && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" /> Create Assignment
                </button>
              )}
            </div>
          </div>

          {assignments && assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment: any) => (
                <div key={assignment.id} className="rounded-xl border border-border bg-card p-5 group hover:border-primary/50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{assignment.title}</h3>
                          {assignment.description && <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>}
                        </div>
                        {(role === 'owner' || (role === 'editor' && assignment.createdById === currentUserId)) && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setActiveAssignmentForEdit(assignment)}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md transition-colors" 
                              title="Edit Deadline"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" 
                              title="Delete Assignment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md border border-border/50">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Due: <span className="font-medium text-foreground">{new Date(assignment.deadline).toLocaleString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md border border-border/50">
                          <Users className="w-3.5 h-3.5" />
                          <span>Posted by <span className="font-medium text-foreground">{assignment.createdBy}</span></span>
                        </div>
                      </div>

                      <div className="mt-4 border border-border rounded-lg bg-background p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground line-clamp-1">{assignment.fileName}</p>
                            <p className="text-xs text-muted-foreground">Original Question File</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setPreviewFile({ url: assignment.fileUrl, name: assignment.fileName })}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" 
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a 
                            href={assignment.fileUrl} 
                            download={assignment.fileName}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" 
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-3 items-center justify-between">
                    <button 
                      onClick={() => setActiveAssignmentForSolutions(assignment)}
                      className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" /> View All Submissions
                    </button>
                    
                    <button 
                      onClick={() => setActiveAssignmentForSubmission(assignment)}
                      className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      Submit Solution
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-transparent p-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No assignments posted</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {(role === 'owner' || role === 'editor') 
                  ? "Create an assignment to assign tasks to the members." 
                  : "Wait for the room owner or editors to post assignments."}
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
