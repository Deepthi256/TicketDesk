import { RotateCcw } from "lucide-react";
import { CATEGORIES } from "../types";

interface FilterPanelProps {
  status: string;
  category: string;
  priority: string;
  sort: string;
  categories?: string[];
  onStatusChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onPriorityChange: (val: string) => void;
  onSortChange: (val: string) => void;
  onReset: () => void;
}

export default function FilterPanel({
  status,
  category,
  priority,
  sort,
  onStatusChange,
  onCategoryChange,
  onPriorityChange,
  onSortChange,
  onReset
}: FilterPanelProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
        <select
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
        <select
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
        >
          <option value="ALL">All Priorities</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>
      </div>

      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</label>
        <select
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="ALL">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sort Order</label>
        <select
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      <div className="self-end">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          title="Reset Filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}