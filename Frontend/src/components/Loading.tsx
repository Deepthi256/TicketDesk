import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center p-12 text-slate-500 gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      <span className="font-medium text-sm">Loading ticket data...</span>
    </div>
  );
}