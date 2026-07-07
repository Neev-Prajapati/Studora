import { X, ExternalLink, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import Whiteboard from "./Whiteboard";
import { Tooltip } from "./Tooltip";

export default function FilePreviewModal({ 
  isOpen, 
  onClose, 
  fileUrl, 
  fileName 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  fileUrl: string | null; 
  fileName: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !fileUrl) return null;

  // Determine file type
  const ext = fileName?.split('.').pop()?.toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '');
  const isPdf = ext === 'pdf';
  const isVideo = ['mp4', 'webm', 'ogg'].includes(ext || '');
  
  // For office docs, use Google Docs Viewer
  const isOfficeDoc = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext || '');
  const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative z-50 w-full max-w-6xl h-full max-h-[90vh] bg-card border border-border shadow-2xl rounded-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-foreground truncate mr-4">
            {fileName}
          </h3>
          <div className="flex items-center gap-2">
            <Tooltip content="Open in new tab">
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noreferrer"
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors inline-flex"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </Tooltip>
            <Tooltip content="Toggle Whiteboard">
              <button 
                onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
                className={`p-2 rounded-md transition-colors ${isWhiteboardOpen ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                <Palette className="w-4 h-4" />
              </button>
            </Tooltip>
            <button 
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Preview */}
          <div className={`relative flex items-center justify-center bg-muted/10 transition-all ${isWhiteboardOpen ? 'w-1/2 border-r border-border' : 'w-full'}`}>
            {loading && !isVideo && !isImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {isImage ? (
              <img 
                src={fileUrl} 
                alt={fileName || "Preview"} 
                className="max-w-full max-h-full object-contain"
                onLoad={() => setLoading(false)}
              />
            ) : isVideo ? (
              <video 
                src={fileUrl} 
                controls 
                className="max-w-full max-h-full"
                onLoadedData={() => setLoading(false)}
              />
            ) : isOfficeDoc ? (
              <iframe 
                src={googleDocsViewerUrl}
                className="w-full h-full border-0"
                onLoad={() => setLoading(false)}
              />
            ) : isPdf ? (
              <iframe 
                src={fileUrl}
                className="w-full h-full border-0"
                onLoad={() => setLoading(false)}
              />
            ) : (
              <div className="text-center p-8">
                <p className="text-muted-foreground mb-4">No preview available for this file type.</p>
                <a 
                  href={fileUrl}
                  download
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
          
          {/* Whiteboard */}
          {isWhiteboardOpen && (
            <div className="w-1/2 p-4 bg-muted/5">
              <Whiteboard fileUrl={fileUrl} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
