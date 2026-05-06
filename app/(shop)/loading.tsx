export default function ShopLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-4 py-8 md:px-6 md:py-12">
      <div className="h-9 w-64 rounded-md bg-muted" />
      <div className="mt-3 h-4 w-96 max-w-full rounded-md bg-muted" />

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-square rounded-lg bg-muted" />
            <div className="h-4 w-full rounded-md bg-muted" />
            <div className="h-4 w-2/3 rounded-md bg-muted" />
            <div className="h-5 w-1/3 rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
