"use client";

import { useState, useEffect } from "react";
import { Folder, Users, Settings, Upload, FileText, Download, Eye, Trash2, ArrowLeft, MoreVertical, Loader2, Calendar, Copy, Check, GripVertical, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AssignmentSettingsModal from "./AssignmentSettingsModal";
import FilePreviewModal from "./FilePreviewModal";
import CreateAssignmentModal from "./CreateAssignmentModal";
import SubmitSolutionModal from "./SubmitSolutionModal";
import AssignmentSolutionsModal from "./AssignmentSolutionsModal";
import EditDeadlineModal from "./EditDeadlineModal";
import { deleteAssignmentAction, updateAssignmentMemberRole, removeAssignmentMember } from "@/actions/assignment";
import { Tooltip } from "./Tooltip";

export default function AssignmentRoomView({ 
  roomId, 
  roomName, 
  roomDescription, 
  inviteCode, 
  role, 
  assignments, 
  members,
  currentUserId,
  submittedAssignmentIds = []
}: any) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{url: string, name: string} | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [activeAssignmentForSubmission, setActiveAssignmentForSubmission] = useState<any>(null);
  const [activeAssignmentForSolutions, setActiveAssignmentForSolutions] = useState<any>(null);
  const [activeAssignmentForEdit, setActiveAssignmentForEdit] = useState<any>(null);

  const [copied, setCopied] = useState(false);
  
  // Kanban State
  const [inProgressIds, setInProgressIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (currentUserId) {
      const stored = localStorage.getItem(`kanban_${roomId}_${currentUserId}`);
      if (stored) {
        try { setInProgressIds(JSON.parse(stored)); } catch(e){}
      }
    }
  }, [roomId, currentUserId]);

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

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, assignmentId: string) => {
    e.dataTransfer.setData("assignmentId", assignmentId);
    e.dataTransfer.effectAllowed = "move";
    
    // Add a slight transparency to the dragged item
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = "0.5";
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = "1";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: "todo" | "in_progress" | "completed") => {
    e.preventDefault();
    const assignmentId = e.dataTransfer.getData("assignmentId");
    if (!assignmentId) return;

    if (status === "todo") {
      const newIds = inProgressIds.filter(id => id !== assignmentId);
      setInProgressIds(newIds);
      if (currentUserId) localStorage.setItem(`kanban_${roomId}_${currentUserId}`, JSON.stringify(newIds));
    } else if (status === "in_progress") {
      if (!inProgressIds.includes(assignmentId)) {
        const newIds = [...inProgressIds, assignmentId];
        setInProgressIds(newIds);
        if (currentUserId) localStorage.setItem(`kanban_${roomId}_${currentUserId}`, JSON.stringify(newIds));
      }
    } else if (status === "completed") {
      const assignment = assignments.find((a: any) => a.id === assignmentId);
      if (assignment && !submittedAssignmentIds.includes(assignmentId)) {
        setActiveAssignmentForSubmission(assignment);
      }
    }
  };

  if (!mounted) return null; // Prevent hydration mismatch

  const safeAssignments = assignments || [];
  
  const todoAssignments = safeAssignments.filter((a: any) => !submittedAssignmentIds.includes(a.id) && !inProgressIds.includes(a.id));
  const inProgressAssignments = safeAssignments.filter((a: any) => !submittedAssignmentIds.includes(a.id) && inProgressIds.includes(a.id));
  const completedAssignments = safeAssignments.filter((a: any) => submittedAssignmentIds.includes(a.id));

  const renderKanbanCard = (assignment: any, status: "todo" | "in_progress" | "completed") => {
    const isCompleted = status === "completed";
    
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        draggable={!isCompleted}
        onDragStart={(e: any) => handleDragStart(e, assignment.id)}
        onDragEnd={(e: any) => handleDragEnd(e)}
        className={`rounded-xl border border-border bg-card p-4 group transition-colors shadow-sm mb-4
          ${!isCompleted ? "cursor-grab active:cursor-grabbing hover:border-primary/50" : "opacity-80"}`}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              {!isCompleted && (
                <div className="mt-1 text-muted-foreground/40 cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4" />
                </div>
              )}
              {isCompleted && (
                <div className="mt-1 text-green-500">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              <div>
                <h3 className={`font-semibold text-foreground ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                  {assignment.title}
                </h3>
                {assignment.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{assignment.description}</p>}
              </div>
            </div>
            {(role === 'owner' || (role === 'editor' && assignment.createdById === currentUserId)) && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip content="Edit Deadline">
                  <button 
                    onClick={() => setActiveAssignmentForEdit(assignment)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md transition-colors" 
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                <Tooltip content="Delete Assignment">
                  <button 
                    onClick={() => handleDeleteAssignment(assignment.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" 
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between w-full">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(assignment.deadline).toLocaleString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-border flex flex-col gap-2">
            <button 
              onClick={() => setPreviewFile({ url: assignment.fileUrl, name: assignment.fileName })}
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors text-left w-full"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" /> 
              <span className="truncate">{assignment.fileName}</span>
            </button>
            <div className="flex items-center gap-2 w-full mt-1">
              <button 
                onClick={() => setActiveAssignmentForSolutions(assignment)}
                className="text-xs font-medium text-primary hover:underline flex-1 text-center bg-primary/5 py-1.5 rounded transition-colors hover:bg-primary/10"
              >
                Submissions
              </button>
              {!isCompleted && (
                <button 
                  onClick={() => setActiveAssignmentForSubmission(assignment)}
                  className="text-xs font-medium bg-primary text-primary-foreground flex-1 py-1.5 rounded hover:bg-primary/90 transition-colors"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-4 lg:p-8 w-full max-w-full space-y-8 overflow-hidden">
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
      <div className="max-w-7xl mx-auto">
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
              <Tooltip content="Copy Code">
                <button 
                  onClick={() => copyCode(inviteCode)}
                  className="font-mono text-lg font-bold tracking-widest bg-muted px-3 py-1 rounded-md text-foreground hover:bg-muted/80 transition-colors flex items-center gap-2"
                >
                  {inviteCode}
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </Tooltip>
            </div>
            {role === 'owner' && (
              <Tooltip content="Room Settings">
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="mt-6 p-2 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto">
        
        {/* Kanban Board */}
        <div className="flex-1 w-full flex flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Folder className="w-5 h-5 text-primary" />
              Assignment Board
            </h2>
            
            {(role === 'owner' || role === 'editor') && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" /> New
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-start">
            {/* To Do Column */}
            <div 
              className="flex flex-col gap-4 bg-muted/30 p-4 rounded-2xl border border-border min-h-[500px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "todo")}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400" /> To Do
                </h3>
                <span className="text-xs font-medium bg-muted px-2 py-1 rounded-md text-muted-foreground">{todoAssignments.length}</span>
              </div>
              <AnimatePresence>
                {todoAssignments.map((a: any) => <div key={a.id}>{renderKanbanCard(a, "todo")}</div>)}
              </AnimatePresence>
              {todoAssignments.length === 0 && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-8 text-center">
                  <p className="text-sm text-muted-foreground">No assignments to do.</p>
                </div>
              )}
            </div>

            {/* In Progress Column */}
            <div 
              className="flex flex-col gap-4 bg-muted/30 p-4 rounded-2xl border border-border min-h-[500px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "in_progress")}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" /> In Progress
                </h3>
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md">{inProgressAssignments.length}</span>
              </div>
              <AnimatePresence>
                {inProgressAssignments.map((a: any) => <div key={a.id}>{renderKanbanCard(a, "in_progress")}</div>)}
              </AnimatePresence>
              {inProgressAssignments.length === 0 && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-8 text-center">
                  <p className="text-sm text-muted-foreground">Drop assignments here when working.</p>
                </div>
              )}
            </div>

            {/* Completed Column */}
            <div 
              className="flex flex-col gap-4 bg-muted/30 p-4 rounded-2xl border border-border min-h-[500px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "completed")}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-green-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> Completed
                </h3>
                <span className="text-xs font-medium bg-green-500/10 text-green-500 px-2 py-1 rounded-md">{completedAssignments.length}</span>
              </div>
              <AnimatePresence>
                {completedAssignments.map((a: any) => <div key={a.id}>{renderKanbanCard(a, "completed")}</div>)}
              </AnimatePresence>
              {completedAssignments.length === 0 && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-8 text-center">
                  <p className="text-sm text-muted-foreground">Drop here to submit solution.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar (Members) */}
        <div className="w-full xl:w-72 shrink-0 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
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
