import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../services/api";
import { useAuth } from "../context/AuthContext";
import DashboardCards from "../components/DashboardCards";
import RecentTickets from "../components/RecentTickets";
import Loading from "../components/Loading";
import { Link } from "react-router-dom";
import { AlertCircle, Flame, ShieldAlert, Zap, PlusCircle, Shield, UserCheck } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard", isAdmin ? "admin" : user?.username],
    queryFn: () => getDashboard(isAdmin ? undefined : user?.username),
    refetchInterval: 5000
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <span>Failed to load dashboard statistics. {(error as Error)?.message}</span>
      </div>
    );
  }

  const priority = data?.priority_summary ?? { high: 0, medium: 0, low: 0 };
  const totalPriority = priority.high + priority.medium + priority.low || 1;

  return (
    <div className="space-y-8">
      {/* Dynamic Header Banner based on Role */}
      {isAdmin ? (
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-800/40">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" />
                IT Admin Command Center
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">System-Wide Operations Dashboard</h1>
            <p className="text-xs text-indigo-200 mt-1">
              Organization-wide view across all departments, users, and ticket lifecycles.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">Global Admin Mode Active</span>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                Employee Support Portal
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">My Support Desk</h1>
            <p className="text-xs text-slate-300 mt-1">
              Welcome back, <strong className="text-white">{user?.username}</strong>! Track your submitted support requests and status.
            </p>
          </div>

          <Link
            to="/create-ticket"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Submit New Ticket
          </Link>
        </div>
      )}

      {/* Summary Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          {isAdmin ? "Global Ticket Overview" : "My Ticket Overview"}
        </h2>
        <DashboardCards data={data} />
      </div>

      {/* Priority Summary Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          {isAdmin ? "System Priority Breakdown" : "My Ticket Priority Breakdown"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-rose-700 tracking-wider">High Priority</span>
              <p className="text-2xl font-extrabold text-rose-900 mt-1">{priority.high}</p>
            </div>
            <div className="p-3 bg-rose-100 rounded-full text-rose-600">
              <Flame className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-orange-700 tracking-wider">Medium Priority</span>
              <p className="text-2xl font-extrabold text-orange-900 mt-1">{priority.medium}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full text-orange-600">
              <Zap className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-sky-700 tracking-wider">Low Priority</span>
              <p className="text-2xl font-extrabold text-sky-900 mt-1">{priority.low}</p>
            </div>
            <div className="p-3 bg-sky-100 rounded-full text-sky-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Priority distribution bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-slate-500 font-medium mb-2">
            <span>Priority Distribution</span>
            <span>{data?.total ?? 0} {isAdmin ? "Total System Tickets" : "My Total Tickets"}</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${(priority.high / totalPriority) * 100}%` }}
              className="bg-rose-500 transition-all duration-500"
              title={`High: ${priority.high}`}
            />
            <div
              style={{ width: `${(priority.medium / totalPriority) * 100}%` }}
              className="bg-orange-400 transition-all duration-500"
              title={`Medium: ${priority.medium}`}
            />
            <div
              style={{ width: `${(priority.low / totalPriority) * 100}%` }}
              className="bg-sky-400 transition-all duration-500"
              title={`Low: ${priority.low}`}
            />
          </div>
        </div>
      </div>

      <RecentTickets tickets={data?.recent_tickets} />
    </div>
  );
}