import { NavLink } from "react-router-dom";
import { LayoutDashboard, Ticket, PlusCircle, UserCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col shadow-xl">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
          TD
        </div>
        <span className="text-xl font-bold tracking-tight text-white">TicketDesk</span>
      </div>

      <nav className="space-y-2 flex-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              isActive ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>

        <NavLink
          to="/tickets"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              isActive ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <Ticket className="w-5 h-5" />
          {isAdmin ? "All Tickets" : "My Tickets"}
        </NavLink>

        {/* Only regular Users can create tickets — Admins manage, not create */}
        {!isAdmin && (
          <NavLink
            to="/create-ticket"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <PlusCircle className="w-5 h-5" />
            Create Ticket
          </NavLink>
        )}
      </nav>

      {user && (
        <div className="p-3 mb-4 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center gap-3 text-xs">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
            isAdmin ? "bg-indigo-500/20 text-indigo-400" : "bg-emerald-500/20 text-emerald-400"
          }`}>
            {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-white truncate">{user.username}</p>
            <p className={`text-[10px] truncate font-medium ${isAdmin ? "text-indigo-300" : "text-emerald-400"}`}>
              {isAdmin ? "IT Administrator" : "Employee"}
            </p>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
        TicketDesk v1.0 • Local Dev
      </div>
    </aside>
  );
}