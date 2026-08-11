import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTicket, updateTicket, updateTicketStatus } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES } from "../types";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import CommentSection from "../components/CommentSection";
import AttachmentUpload from "../components/AttachmentUpload";
import Loading from "../components/Loading";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Tag,
  Edit3,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  ChevronRight,
  Shield,
  User as UserIcon
} from "lucide-react";

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);

  const { data: ticket, isLoading, isError, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicket(id!),
    enabled: !!id
  });

  const statusMutation = useMutation({
    mutationFn: (nextStatus: string) => updateTicketStatus(id!, nextStatus),
    onSuccess: () => {
      setStatusError(null);
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      setStatusError(err?.response?.data?.detail || "Invalid status transition");
    }
  });

  const editMutation = useMutation({
    mutationFn: () =>
      updateTicket(id!, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        priority: editPriority
      }),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    }
  });

  if (isLoading) return <Loading />;

  if (isError || !ticket) {
    return (
      <div className="space-y-4">
        <Link to="/tickets" className="inline-flex items-center gap-2 text-sm text-indigo-600 font-medium hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Tickets
        </Link>
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>Ticket not found or error loading ticket details. {(error as Error)?.message}</span>
        </div>
      </div>
    );
  }

  const openEditModal = () => {
    setEditTitle(ticket.title);
    setEditDescription(ticket.description);
    setEditCategory(ticket.category);
    setEditPriority(ticket.priority);
    setIsEditing(true);
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "OPEN":
        return "IN_PROGRESS";
      case "IN_PROGRESS":
        return "RESOLVED";
      case "RESOLVED":
        return "CLOSED";
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus(ticket.status);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back link */}
      <div>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </Link>
      </div>

      {/* Header Info Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md font-semibold">
                ID: {ticket.id}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{ticket.title}</h1>
          </div>

          {(isAdmin || user?.username === ticket.created_by) && (
            <div className="flex items-center gap-2">
              <button
                onClick={openEditModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Ticket
              </button>
            </div>
          )}
        </div>

        {/* Workflow Action Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Workflow Status Lifecycle
            </span>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <span className={ticket.status === "OPEN" ? "font-bold text-blue-600" : ""}>OPEN</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className={ticket.status === "IN_PROGRESS" ? "font-bold text-amber-600" : ""}>IN_PROGRESS</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className={ticket.status === "RESOLVED" ? "font-bold text-emerald-600" : ""}>RESOLVED</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className={ticket.status === "CLOSED" ? "font-bold text-slate-600" : ""}>CLOSED</span>
            </div>
          </div>

          {isAdmin ? (
            nextStatus ? (
              <button
                onClick={() => statusMutation.mutate(nextStatus)}
                disabled={statusMutation.isPending}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                {statusMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                [Admin] Advance Status to {nextStatus.replace("_", " ")}
              </button>
            ) : (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                Ticket Lifecycle Complete (CLOSED)
              </span>
            )
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              Status updates managed by IT Admin
            </div>
          )}
        </div>

        {statusError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{statusError}</span>
          </div>
        )}

        {/* Metadata Details */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-slate-400" />
            <span>Submitted By: <strong className="text-slate-700">{ticket.created_by || "User"}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <span>Category: <strong className="text-slate-700">{ticket.category}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Created: <strong className="text-slate-700">{new Date(ticket.created_at).toLocaleString()}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Last Updated: <strong className="text-slate-700">{new Date(ticket.updated_at).toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Description */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
          <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">
            {ticket.description}
          </p>
        </div>
      </div>

      {/* Grid layout for Attachment and Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AttachmentUpload ticketId={ticket.id} isAdmin={isAdmin} />
        <CommentSection ticketId={ticket.id} />
      </div>

      {/* Edit Ticket Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Edit Ticket Information</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => editMutation.mutate()}
                disabled={editMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                {editMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}