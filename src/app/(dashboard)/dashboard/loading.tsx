export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-pulse space-y-4 w-full max-w-2xl">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="space-y-3 mt-6">
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
