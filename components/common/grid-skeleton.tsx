export function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-[2px]">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="relative aspect-square bg-gray-200 animate-pulse"
        >
          {/* Fake gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-20" />

          {/* Fake content */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="h-4 w-2/3 bg-gray-300 rounded mb-2" />
            <div className="h-3 w-1/2 bg-gray-300 rounded mb-1" />
            <div className="h-3 w-3/4 bg-gray-300 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
