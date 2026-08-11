import { Inbox } from "lucide-react";

export default function EmptyState({ message = "No data available" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-xl border border-slate-200">
      <Inbox className="w-12 h-12 mb-3 text-slate-300 stroke-1" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}