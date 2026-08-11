import { Status } from "../types";

const statusStyles: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 border-blue-200",
  IN_PROGRESS: "bg-amber-100 text-amber-800 border-amber-200",
  RESOLVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CLOSED: "bg-gray-100 text-gray-800 border-gray-200"
};

export default function StatusBadge({ status }: { status: Status | string }) {
  const style = statusStyles[status] || "bg-gray-100 text-gray-800 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {status.replace("_", " ")}
    </span>
  );
}