import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getComments, addComment } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { MessageSquare, Send, User as UserIcon, Loader2 } from "lucide-react";

export default function CommentSection({ ticketId }: { ticketId: string }) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();

  const authorName = user?.username || "Admin";

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", ticketId],
    queryFn: () => getComments(ticketId),
    enabled: !!ticketId
  });

  const mutation = useMutation({
    mutationFn: (text: string) => addComment(ticketId, text, authorName),
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["comments", ticketId] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    mutation.mutate(commentText.trim());
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          Comments ({comments?.length ?? 0})
        </h2>
      </div>

      {isLoading ? (
        <div className="py-4 text-xs text-slate-400">Loading comments...</div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {comments.map((c) => (
            <div key={c.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                  {c.created_by}
                </span>
                <span className="text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 py-2">No comments added yet.</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Posting as:</span>
          <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            {authorName}
          </span>
        </div>
        <textarea
          rows={3}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending || !commentText.trim()}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Add Comment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}