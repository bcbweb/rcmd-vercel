import { RCMD } from "@/types";

interface RCMDPickerProps {
  rcmds: RCMD[];
  selectedIds: string[];
  onSelect: (id: string) => void;
}

export default function RCMDPicker({
  rcmds,
  selectedIds,
  onSelect,
}: RCMDPickerProps) {
  return (
    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
      {rcmds.length === 0 ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          No RCMDs found
        </div>
      ) : (
        rcmds.map((rcmd) => (
          <div
            key={rcmd.id}
            onClick={() => onSelect(rcmd.id)}
            className={`p-3 border rounded-md cursor-pointer transition-colors ${
              selectedIds.includes(rcmd.id)
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
            }`}
          >
            <h3 className="font-medium">{rcmd.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {rcmd.description}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
