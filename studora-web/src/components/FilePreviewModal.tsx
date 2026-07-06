import { X, ExternalLink, Columns } from "lucide-react";
import { useEffect, useState } from "react";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

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
  const [isSplitView, setIsSplitView] = useState(false);

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

  const previewContent = (
    <>
      {loading && !isVideo && !isImage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
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
          className="w-full h-full border-0 relative z-0"
          onLoad={() => setLoading(false)}
        />
      ) : isPdf ? (
        <iframe 
          src={fileUrl}
          className="w-full h-full border-0 relative z-0"
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
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className={`relative z-50 w-full h-full bg-card border border-border shadow-2xl rounded-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-all ${isSplitView ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-6xl max-h-[90vh]'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-foreground truncate mr-4">
            {fileName}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSplitView(!isSplitView)}
              className={`p-2 rounded-md transition-colors inline-flex ${isSplitView ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              title={isSplitView ? "Close Whiteboard" : "Open Scratchpad Whiteboard"}
            >
              <Columns className="w-4 h-4" />
            </button>
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noreferrer"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors inline-flex"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button 
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-muted/10 relative flex overflow-hidden">
          {isSplitView ? (
            <PanelGroup orientation="horizontal">
              <Panel defaultSize={50} minSize={20} className="relative flex flex-col items-center justify-center bg-muted/10">
                {previewContent}
              </Panel>
              <PanelResizeHandle className="w-2 bg-border hover:bg-primary/50 active:bg-primary transition-colors cursor-col-resize flex flex-col items-center justify-center group z-10">
                <div className="w-1 h-8 bg-muted-foreground/30 group-hover:bg-primary/50 rounded-full transition-colors" />
              </PanelResizeHandle>
              <Panel defaultSize={50} minSize={20} className="relative bg-background">
                <Tldraw persistenceKey={fileName ? `studora-board-${fileName}` : 'studora-board-default'} />
              </Panel>
            </PanelGroup>
          ) : (
            <div className="w-full h-full relative flex items-center justify-center">
              {previewContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
