import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAttachments, uploadAttachment } from "../services/api";
import { Paperclip, Upload, Download, FileText, Loader2, AlertCircle, Eye, ShieldCheck } from "lucide-react";

interface AttachmentUploadProps {
  ticketId: string;
  isAdmin?: boolean;
}

export default function AttachmentUpload({ ticketId, isAdmin = false }: AttachmentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ["attachments", ticketId],
    queryFn: () => getAttachments(ticketId),
    retry: false
  });

  const uploadMutation = useMutation({
    mutationFn: (selectedFile: File) => uploadAttachment(ticketId, selectedFile),
    onSuccess: () => {
      setFile(null);
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ["attachments", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["attachment", ticketId] });
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.detail || "Failed to upload file");
    }
  });

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate(file);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-indigo-600" />
          Attachments ({attachments.length})
        </h2>
        {isAdmin && (
          <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Eye className="w-3 h-3" /> View & Download Only
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* List of all uploaded attachments */}
      {isLoading ? (
        <div className="text-xs text-slate-400">Loading attachments...</div>
      ) : attachments.length > 0 ? (
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate" title={att.file_name}>
                    {att.file_name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Uploaded {new Date(att.uploaded_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <a
                href={`http://localhost:8000/api/attachments/${att.id}/file`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">No attachments uploaded yet.</p>
      )}

      {/* Upload box for Users (any number of attachments allowed) */}
      {isAdmin ? (
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span>Admin can view and download all user attachments. Admins cannot edit or delete user files.</span>
        </div>
      ) : (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Upload Attachment / Photo (PNG, JPG, JPEG, PDF, TXT — max 10 MB each)
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf,.txt"
              className="flex-1 text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const selected = e.target.files[0];
                  if (selected.size > 10 * 1024 * 1024) {
                    setErrorMsg("File size must not exceed 10 MB.");
                    return;
                  }
                  setFile(selected);
                  setErrorMsg(null);
                }
              }}
            />
            {file && (
              <button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400">
            You can upload any number of photos or files to document initial or follow-up details for this ticket.
          </p>
        </div>
      )}
    </div>
  );
}