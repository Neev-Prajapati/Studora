export default function Loading() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-64 bg-muted rounded mb-2"></div>
          <div className="h-4 w-96 bg-muted rounded"></div>
        </div>
        <div className="h-10 w-32 bg-muted rounded-md"></div>
      </div>
      <div className="h-[400px] w-full bg-card border border-border rounded-xl"></div>
    </div>
  );
}
