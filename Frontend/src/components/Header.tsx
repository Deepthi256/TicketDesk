import { useAuth } from "../context/AuthContext";
import { LogOut, User as UserIcon, ShieldCheck } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        IT Support Ticket Tracking System
      </h2>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 text-xs">
              <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold text-slate-800">{user.username}</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                {user.role}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            AWS Cloud Active
          </div>
        )}

      </div>
    </header>
  );
}