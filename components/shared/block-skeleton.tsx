interface BlockSkeletonProps {
  hasImage?: boolean;
  lines?: number;
  imageDimensions?: {
    width?: string;
    height?: string;
  };
  className?: string;
}

export default function BlockSkeleton({
  hasImage = false,
  lines = 2,
  imageDimensions = { height: "12rem" },
  className = "",
}: BlockSkeletonProps) {
  return (
    <div className={`relative rounded-lg border p-4 animate-pulse ${className}`}>
      {hasImage && (
        <div
          className={`bg-gray-200 dark:bg-gray-700 rounded-md mb-4`}
          style={{
            height: imageDimensions.height,
            width: imageDimensions.width || "100%"
          }}
        ></div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 dark:bg-gray-700 rounded mt-2`}
          style={{
            width: `${Math.max(30, 80 - (i * 15))}%`
          }}
        ></div>
      ))}
    </div>
  );
}