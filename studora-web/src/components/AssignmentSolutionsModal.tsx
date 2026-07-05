"use client";

import { useState, useEffect } from "react";
import { X, FileText, Download, Eye, Loader2 } from "lucide-react";
import { getAssignmentSubmissions } from "@/actions/assignment";
import FilePreviewModal from "./FilePreviewModal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
};

export default function AssignmentSolutionsModal({ isOpen, onClose, assignment }: Props) {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [error, setError] = useState("");
  
  const [previewFile, setPreviewFile] = useState<{url: string, name: string} | null>(null);

  useEffect(() => {
    if (isOpen && assignment) {
      setLoading(true);
      getAssignmentSubmissions(assignment.id)
        .then((res) => {
          if (res.success && res.submissions) {
            setSubmissions(res.submissions);
          } else {
            setError(res.error || "Failed to load submissions");
          }
        })
        .catch(() => setError("An error occurred"))
        .finally(() => setLoading(false));
    }
  }, [isOpen, assignment]);

  if (!isOpen || !assignment) return null;

  return (
    <>
      <FilePreviewModal 
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || null}
        fileName={previewFile?.name || null}
      />

      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-3xl bg-card border border-border rounded-xl shadow-lg relative flex flex-col h-[600px] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
            <div>
              <h2 className="text-xl font-bold text-foreground">Submissions</h2>
              <p className="text-sm text-muted-foreground mt-1">{assignment.title}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p>Loading submissions...</p>
              </div>
            ) : error ? (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md text-center">
                {error}
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">No submissions yet</h3>
                <p className="text-sm">Be the first to submit a solution!</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {submissions.map((sub) => (
                  <li key={sub.id} className="rounded-xl border border-border bg-background p-4 flex items-center justify-between group hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {sub.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{sub.userName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                            {sub.fileName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setPreviewFile({ url: sub.fileUrl, name: sub.fileName })}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" 
                        title="Preview Solution"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <a 
                        href={sub.fileUrl} 
                        download={sub.fileName}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" 
                        title="Download Solution"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
