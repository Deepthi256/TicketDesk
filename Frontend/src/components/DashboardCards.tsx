import { DashboardData } from "../types";
import { Ticket, Clock, CheckCircle2, AlertCircle, Archive } from "lucide-react";

export default function DashboardCards({ data }: { data?: DashboardData }) {
  const cards = [
    {
      title: "Total Tickets",
      value: data?.total ?? 0,
      icon: Ticket,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100"
    },
    {
      title: "Open",
      value: data?.open ?? 0,
      icon: AlertCircle,
      color: "text-blue-600 bg-blue-50 border-blue-100"
    },
    {
      title: "In Progress",
      value: data?.in_progress ?? 0,
      icon: Clock,
      color: "text-amber-600 bg-amber-50 border-amber-100"
    },
    {
      title: "Resolved",
      value: data?.resolved ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100"
    },
    {
      title: "Closed",
      value: data?.closed ?? 0,
      icon: Archive,
      color: "text-slate-600 bg-slate-50 border-slate-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.title}</span>
              <div className={`p-2 rounded-lg border ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-3">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}