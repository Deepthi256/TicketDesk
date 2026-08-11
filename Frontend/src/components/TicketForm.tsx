import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { createTicket, uploadAttachment } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES } from "../types";
import { AlertCircle, Loader2, Paperclip, Send } from "lucide-react";

interface TicketFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
}

export default function TicketForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<TicketFormData>({
    defaultValues: {
      priority: "HIGH",
      category: "Network"
    }
  });

  const onSubmit = async (data: TicketFormData) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const createdTicket = await createTicket({
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category.trim(),
        priority: data.priority,
        created_by: user?.username || "User"
      });

      if (file && createdTicket?.id) {
        await uploadAttachment(createdTicket.id, file);
      }

      navigate(`/tickets/${createdTicket.id}`);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || "Failed to create ticket. Please check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-2xl space-y-6"
    >
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Ticket Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          className={`w-full bg-slate-50 border ${
            errors.title ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:ring-indigo-500"
          } rounded-lg p-3 text-sm focus:outline-none focus:ring-2`}
          placeholder="e.g. VPN not working"
          {...register("title", {
            required: "Title is required",
            maxLength: { value: 255, message: "Maximum 255 characters allowed" }
          })}
        />
        {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Description <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={4}
          className={`w-full bg-slate-50 border ${
            errors.description ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:ring-indigo-500"
          } rounded-lg p-3 text-sm focus:outline-none focus:ring-2`}
          placeholder="e.g. Unable to connect to office VPN"
          {...register("description", { required: "Description is required" })}
        />
        {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            className={`w-full bg-slate-50 border ${
              errors.category ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:ring-indigo-500"
            } rounded-lg p-3 text-sm focus:outline-none focus:ring-2`}
            {...register("category", { required: "Category is required" })}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Priority <span className="text-rose-500">*</span>
          </label>
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("priority")}
          >
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Attachment (Optional, max 10MB)
        </label>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <Paperclip className="w-5 h-5 text-slate-400" />
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.pdf"
            className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
              }
            }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">Supported file formats: PNG, JPG, JPEG, PDF</p>
      </div>

      <div className="pt-3 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Ticket...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Create Ticket
            </>
          )}
        </button>
      </div>
    </form>
  );
}