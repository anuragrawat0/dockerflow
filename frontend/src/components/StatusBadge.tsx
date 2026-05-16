const STATUS_COLORS: Record<string, string> = {
  queued: "bg-gray-100 text-gray-700",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  finalized: "bg-purple-100 text-purple-700",
};

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100"}`}>
      {status}
    </span>
  );
}