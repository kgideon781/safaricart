export default function VendorLoading() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="mt-6 h-48 rounded-lg bg-muted" />
    </div>
  );
}
