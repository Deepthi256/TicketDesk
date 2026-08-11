import { Priority } from "../types";

const priorityStyles: Record<string, string> = {
  HIGH: "bg-rose-100 text-rose-800 border-rose-200",
  MEDIUM: "bg-orange-100 text-orange-800 border-orange-200",
  LOW: "bg-sky-100 text-sky-800 border-sky-200"
};

export default function PriorityBadge({ priority }: { priority: Priority | string }) {
  const style = priorityStyles[priority] || "bg-gray-100 text-gray-800 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {priority}
    </span>
  );
}