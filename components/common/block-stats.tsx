interface StatItemProps {
  value: number;
  label: string;
}

interface BlockStatsProps {
  stats: StatItemProps[];
  className?: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <span className="text-gray-500 dark:text-gray-400">
      {value?.toLocaleString()} {label}
    </span>
  );
}

export default function BlockStats({ stats, className = "" }: BlockStatsProps) {
  return (
    <div className={`flex items-center mt-4 text-sm ${className}`}>
      {stats.map((stat, index) => (
        <div key={stat.label} className="flex items-center">
          <StatItem value={stat.value} label={stat.label} />
          {index < stats.length - 1 && (
            <span className="mx-3 text-gray-400 dark:text-gray-500">•</span>
          )}
        </div>
      ))}
    </div>
  );
}