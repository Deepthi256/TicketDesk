import { Link } from "react-router-dom";
import { Ticket } from "../types";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import EmptyState from "./EmptyState";
import { ExternalLink } from "lucide-react";

export default function TicketTable({ tickets }: { tickets?: Ticket[] }) {
  if (!tickets || tickets.length === 0) {
    return <EmptyState message="No tickets found matching your criteria" />;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
              <th className="py-3.5 px-4">Title</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Created Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-4 px-4 font-medium text-slate-900">
                  <Link to={`/tickets/${ticket.id}`} className="hover:text-indigo-600 transition-colors">
                    {ticket.title}
                  </Link>
                </td>
                <td className="py-4 px-4 text-slate-600">{ticket.category}</td>
                <td className="py-4 px-4">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="py-4 px-4">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="py-4 px-4 text-slate-500 text-xs">
                  {new Date(ticket.created_at).toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right">
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    View Details
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