"use client";

import { useState, useEffect } from "react";
import { Folder, Users, Settings, Upload, FileText, Download, Eye, Trash2, ArrowLeft, MoreVertical, Loader2, Copy, Check, BrainCircuit, Sparkles, Layers, Play, Pause, Square, Headphones } from "lucide-react";
import Link from "next/link";
import RoomSettingsModal from "./RoomSettingsModal";
import FilePreviewModal from "./FilePreviewModal";
import QuizModal from "./QuizModal";
import FlashcardModal from "./FlashcardModal";
import RoomChatSidebar from "./RoomChatSidebar";
import { Tooltip } from "./Tooltip";
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
  const [activeFileDropdown, setActiveFileDropdown] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{url: string, name: string} | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setActiveDropdown(null);
        setActiveFileDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<any[] | null>(null);
  const [quizFileName, setQuizFileName] = useState("");
  const [generatingQuizId, setGeneratingQuizId] = useState<string | null>(null);
  const [quizError, setQuizError] = useState("");
  
  // Flashcards state
  const [activeFlashcards, setActiveFlashcards] = useState<any[] | null>(null);
  const [flashcardsFileName, setFlashcardsFileName] = useState("");
  const [generatingFlashcardsId, setGeneratingFlashcardsId] = useState<string | null>(null);
  const [flashcardsError, setFlashcardsError] = useState("");

  // Podcast state
  const [playingPodcastId, setPlayingPodcastId] = useState<string | null>(null);
  const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);
  const [generatingPodcastId, setGeneratingPodcastId] = useState<string | null>(null);
  const [podcastScript, setPodcastScript] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
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

  const handlePlayPodcast = (script: string, fileId: string) => {
    if (playingPodcastId === fileId && isPodcastPlaying) {
      window.speechSynthesis.pause();
      setIsPodcastPlaying(false);
      return;
    } else if (playingPodcastId === fileId && !isPodcastPlaying) {
      window.speechSynthesis.resume();
      setIsPodcastPlaying(true);
      return;
    }
    
    // Stop any existing playing podcast
    window.speechSynthesis.cancel();
    
    setPlayingPodcastId(fileId);
    setPodcastScript(script);
    setIsPodcastPlaying(true);
    
    const utterance = new SpeechSynthesisUtterance(script);
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Natural") || v.lang === "en-US") || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 0.9;
    
    utterance.onend = () => {
      setIsPodcastPlaying(false);
      setPlayingPodcastId(null);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const handleGeneratePodcast = async (fileUrl: string, fileName: string, fileId: string) => {
    try {
      setGeneratingPodcastId(fileId);
      const res = await fetch("/api/ai/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl, fileName, fileId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate podcast");
      
      handlePlayPodcast(data.script, fileId);
    } catch (error) {
      console.error(error);
      alert("Error generating podcast");
    } finally {
      setGeneratingPodcastId(null);
    }
  };
  
  const handleStopPodcast = () => {
    window.speechSynthesis.cancel();
    setIsPodcastPlaying(false);
    setPlayingPodcastId(null);
  };

  const handleGenerateQuiz = async (fileUrl: string, fileName: string, fileId: string) => {
    try {
      setGeneratingQuizId(fileId);
      setQuizError("");
      
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl, fileName })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz");
      
      setActiveQuiz(data.quiz);
      setQuizFileName(fileName);
    } catch (err: any) {
      setQuizError(err.message || "An unexpected error occurred");
      console.error(err);
    } finally {
      setGeneratingQuizId(null);
    }
  };

  const handleGenerateFlashcards = async (fileUrl: string, fileName: string, fileId: string) => {
    try {
      setGeneratingFlashcardsId(fileId);
      setFlashcardsError("");
      
      const res = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl, fileName })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to generate flashcards");
      
      setActiveFlashcards(data.flashcards);
      setFlashcardsFileName(fileName);
    } catch (err: any) {
      setFlashcardsError(err.message || "Failed to generate flashcards");
      console.error(err);
    } finally {
      setGeneratingFlashcardsId(null);
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

      <RoomChatSidebar 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        roomId={roomId}
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
            {quizError && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md font-medium mt-2">
                Quiz Error: {quizError}
              </div>
            )}
            {flashcardsError && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md font-medium mt-2">
                Flashcards Error: {flashcardsError}
              </div>
            )}
          </div>

          {files && files.length > 0 ? (
            <div className="rounded-xl border border-border bg-card">
              <ul className="divide-y divide-border">
                {files.map((file: any) => (
                  <li key={file.id} className="p-4 hover:bg-muted/50 first:rounded-t-xl last:rounded-b-xl transition-colors flex items-center justify-between group">
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
                    
                    <div className="flex items-center gap-2">
                      <Tooltip content="Preview in App">
                        <button 
                          onClick={() => setPreviewFile({ url: file.url, name: file.name })}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-colors inline-flex" 
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      
                      <div className="relative dropdown-container">
                        <Tooltip content="More Actions">
                          <button
                            onClick={() => setActiveFileDropdown(activeFileDropdown === file.id ? null : file.id)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-colors inline-flex"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        
                        {activeFileDropdown === file.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-md z-20 text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1">
                            <button 
                              onClick={() => {
                                handleGenerateQuiz(file.url, file.name, file.id);
                                setActiveFileDropdown(null);
                              }}
                              disabled={generatingQuizId === file.id}
                              className="flex items-center gap-2 w-full px-3 py-2 text-left text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-sm transition-colors disabled:opacity-50" 
                            >
                              {generatingQuizId === file.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <BrainCircuit className="w-4 h-4" />
                              )}
                              <span>Generate Quiz</span>
                            </button>

                            <button 
                              onClick={() => {
                                handleGenerateFlashcards(file.url, file.name, file.id);
                                setActiveFileDropdown(null);
                              }}
                              disabled={generatingFlashcardsId === file.id}
                              className="flex items-center gap-2 w-full px-3 py-2 text-left text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-sm transition-colors disabled:opacity-50" 
                            >
                              {generatingFlashcardsId === file.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Layers className="w-4 h-4" />
                              )}
                              <span>Generate Flashcards</span>
                            </button>

                            <button 
                              onClick={() => {
                                if (file.podcastScript) {
                                  handlePlayPodcast(file.podcastScript, file.id);
                                } else {
                                  handleGeneratePodcast(file.url, file.name, file.id);
                                }
                                setActiveFileDropdown(null);
                              }}
                              disabled={generatingPodcastId === file.id}
                              className="flex items-center gap-2 w-full px-3 py-2 text-left text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-sm transition-colors disabled:opacity-50" 
                            >
                              {generatingPodcastId === file.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Headphones className="w-4 h-4" />
                              )}
                              <span>{file.podcastScript ? 'Play Podcast' : 'Generate Podcast'}</span>
                            </button>

                            <a 
                              href={file.url} 
                              download={file.name}
                              onClick={() => setActiveFileDropdown(null)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-left text-muted-foreground hover:text-primary hover:bg-background rounded-sm transition-colors" 
                            >
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </a>
                            
                            {(role === 'owner' || (role === 'editor' && file.uploaderId === currentUserId)) && (
                              <button 
                                onClick={() => {
                                  handleDeleteFile(file.id);
                                  setActiveFileDropdown(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-left text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm transition-colors" 
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
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
                      <div className="relative dropdown-container">
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

      <QuizModal 
        isOpen={!!activeQuiz} 
        onClose={() => setActiveQuiz(null)} 
        quiz={activeQuiz || []} 
        fileName={quizFileName} 
      />

      <FlashcardModal 
        isOpen={!!activeFlashcards} 
        onClose={() => setActiveFlashcards(null)} 
        flashcards={activeFlashcards || []} 
        fileName={flashcardsFileName} 
      />

      {/* Sticky Audio Player */}
      {playingPodcastId && podcastScript && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-2xl z-50 flex items-center justify-between animate-in slide-in-from-bottom-full duration-300">
          <div className="flex items-center gap-4 w-full max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate">AI Audio Summary</h4>
              <p className="text-xs text-muted-foreground truncate">
                {files?.find((f: any) => f.id === playingPodcastId)?.name || "Playing document"}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={() => handlePlayPodcast(podcastScript, playingPodcastId)}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                {isPodcastPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
              <button 
                onClick={handleStopPodcast}
                className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for Chat */}
      <Tooltip content="Chat with Room AI">
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </Tooltip>

    </div>
  );
}
