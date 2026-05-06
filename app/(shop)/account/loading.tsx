export default function AccountLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-48 rounded-md bg-muted" />
      <div className="mt-3 h-4 w-72 rounded-md bg-muted" />
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
