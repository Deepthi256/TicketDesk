import { Link } from "react-router-dom";
import { Ticket } from "../types";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import EmptyState from "./EmptyState";
import { ExternalLink } from "lucide-react";

export default function RecentTickets({ tickets }: { tickets?: Ticket[] }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Tickets</h2>
        <EmptyState message="No recent tickets available" />
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Recent Tickets</h2>
        <span className="text-xs text-slate-500 font-medium">Top {tickets.length} Latest</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-900">{t.title}</td>
                <td className="py-3.5 px-4 text-slate-600">{t.category}</td>
                <td className="py-3.5 px-4">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status={t.status} />
                </td>
                <td className="py-3.5 px-4 text-slate-500 text-xs">
                  {new Date(t.created_at).toLocaleDateString()}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Link
                    to={`/tickets/${t.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    View
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}