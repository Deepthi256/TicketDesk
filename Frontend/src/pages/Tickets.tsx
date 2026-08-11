import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTickets } from "../services/api";
import { useAuth } from "../context/AuthContext";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import TicketTable from "../components/TicketTable";
import Loading from "../components/Loading";
import { AlertCircle, Plus, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Tickets() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [sort, setSort] = useState("newest");

  const { data: tickets, isLoading, isError, error } = useQuery({
    queryKey: ["tickets", { status, category, priority, search, sort, username: isAdmin ? undefined : user?.username }],
    queryFn: () => getTickets({ status, category, priority, search, sort, username: isAdmin ? undefined : user?.username }),
    refetchInterval: 5000
  });

  const categories = useMemo(() => {
    if (!tickets) return ["Hardware", "Software", "Network", "Access & Permissions", "Security", "Infrastructure", "Other"];
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    const arr = Array.from(set);
    return arr.length > 0 ? arr : ["Hardware", "Software", "Network", "Access & Permissions", "Security", "Infrastructure", "Other"];
  }, [tickets]);

  const handleReset = () => {
    setSearch("");
    setStatus("ALL");
    setCategory("ALL");
    setPriority("ALL");
    setSort("newest");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {isAdmin ? "IT Admin Ticket Management" : "My Support Tickets"}
            {isAdmin && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-200 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Admin Scope
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500">
            {isAdmin ? "View and manage support tickets across the organization" : "View and track status of your submitted support requests"}
          </p>
        </div>
        <Link
          to="/create-ticket"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Ticket
        </Link>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      <FilterPanel
        status={status}
        category={category}
        priority={priority}
        sort={sort}
        categories={categories}
        onStatusChange={setStatus}
        onCategoryChange={setCategory}
        onPriorityChange={setPriority}
        onSortChange={setSort}
        onReset={handleReset}
      />

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load tickets. {(error as Error)?.message}</span>
        </div>
      ) : (
        <TicketTable tickets={tickets} />
      )}
    </div>
  );
}