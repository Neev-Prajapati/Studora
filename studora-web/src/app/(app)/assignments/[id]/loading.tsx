export default function Loading() {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-pulse p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-64 bg-muted rounded mb-2"></div>
          <div className="h-4 w-96 bg-muted rounded"></div>
        </div>
        <div className="h-10 w-32 bg-muted rounded-md"></div>
      </div>
      
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Kanban Column Skeletons */}
        <div className="w-[350px] shrink-0 flex flex-col">
          <div className="h-12 w-full bg-muted/50 rounded-t-xl"></div>
          <div className="flex-1 bg-muted/20 border-x border-b border-border/50 rounded-b-xl p-4 space-y-4">
            <div className="h-32 w-full bg-muted/40 rounded-xl"></div>
            <div className="h-32 w-full bg-muted/40 rounded-xl"></div>
          </div>
        </div>
        <div className="w-[350px] shrink-0 flex flex-col">
          <div className="h-12 w-full bg-muted/50 rounded-t-xl"></div>
          <div className="flex-1 bg-muted/20 border-x border-b border-border/50 rounded-b-xl p-4 space-y-4">
            <div className="h-32 w-full bg-muted/40 rounded-xl"></div>
          </div>
        </div>
        <div className="w-[350px] shrink-0 flex flex-col">
          <div className="h-12 w-full bg-muted/50 rounded-t-xl"></div>
          <div className="flex-1 bg-muted/20 border-x border-b border-border/50 rounded-b-xl p-4 space-y-4">
          </div>
        </div>
      </div>
    </div>
  );
}
