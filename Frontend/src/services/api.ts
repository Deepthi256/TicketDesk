import axios from "axios";
import {
  Ticket,
  Comment,
  Attachment,
  DashboardData,
  TicketFilters,
  CreateTicketInput,
  UpdateTicketInput,
  LoginInput,
  SignupInput,
  AuthResponse
} from "../types";

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || "",
  headers: {
    "Content-Type": "application/json"
  }
});



export const loginUser = async (data: LoginInput): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/api/auth/login", data);
  return response.data;
};

export const signupUser = async (data: SignupInput): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/api/auth/signup", data);
  return response.data;
};

export const getHealth = async () => {
  const response = await api.get<{ status: string }>("/health");
  return response.data;
};

export const getDashboard = async (username?: string): Promise<DashboardData> => {
  const params = new URLSearchParams();
  if (username) params.append("username", username);
  const response = await api.get<DashboardData>(`/api/dashboard?${params.toString()}`);
  return response.data;
};

export const getTickets = async (filters?: TicketFilters & { username?: string }): Promise<Ticket[]> => {
  const params = new URLSearchParams();
  if (filters?.username) params.append("username", filters.username);
  if (filters?.status && filters.status !== "ALL") params.append("status", filters.status);
  if (filters?.category && filters.category !== "ALL") params.append("category", filters.category);
  if (filters?.priority && filters.priority !== "ALL") params.append("priority", filters.priority);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.sort) params.append("sort", filters.sort);

  const response = await api.get<Ticket[]>(`/api/tickets?${params.toString()}`);
  return response.data;
};

export const getTicket = async (id: string): Promise<Ticket> => {
  const response = await api.get<Ticket>(`/api/tickets/${id}`);
  return response.data;
};

export const createTicket = async (data: CreateTicketInput & { created_by?: string }): Promise<Ticket> => {
  const response = await api.post<Ticket>("/api/tickets", data);
  return response.data;
};

export const updateTicket = async (id: string, data: UpdateTicketInput): Promise<Ticket> => {
  const response = await api.put<Ticket>(`/api/tickets/${id}`, data);
  return response.data;
};

export const updateTicketStatus = async (id: string, status: string): Promise<Ticket> => {
  const response = await api.patch<Ticket>(`/api/tickets/${id}/status`, { status });
  return response.data;
};

export const getComments = async (ticketId: string): Promise<Comment[]> => {
  const response = await api.get<Comment[]>(`/api/tickets/${ticketId}/comments`);
  return response.data;
};

export const addComment = async (ticketId: string, comment: string, createdBy: string = "Admin"): Promise<Comment> => {
  const response = await api.post<Comment>(`/api/tickets/${ticketId}/comments`, {
    comment,
    createdBy
  });
  return response.data;
};

export const getAttachments = async (ticketId: string): Promise<Attachment[]> => {
  const response = await api.get<Attachment[] | Attachment>(`/api/tickets/${ticketId}/attachment`);
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data ? [response.data] : [];
};

export const getAttachment = async (ticketId: string): Promise<Attachment> => {
  const response = await api.get<Attachment | Attachment[]>(`/api/tickets/${ticketId}/attachment`);
  if (Array.isArray(response.data)) {
    return response.data[0];
  }
  return response.data;
};

export const uploadAttachment = async (ticketId: string, file: File): Promise<Attachment> => {
  try {
    const encodedFileName = encodeURIComponent(file.name);
    const encodedFileType = encodeURIComponent(file.type || "application/octet-stream");

    // Request presigned S3 upload URL
    const presignedRes = await api.post<{
      upload_mode: string;
      upload_url: string;
      file_key: string;
    }>(`/api/tickets/${ticketId}/presigned-upload?file_name=${encodedFileName}&file_type=${encodedFileType}`);

    if (presignedRes.data && presignedRes.data.upload_mode === "s3_presigned" && presignedRes.data.upload_url) {
      // Direct upload to S3 via presigned URL
      await axios.put(presignedRes.data.upload_url, file, {
        headers: {
          "Content-Type": file.type || "application/octet-stream"
        }
      });

      // Confirm attachment in DB
      const encodedKey = encodeURIComponent(presignedRes.data.file_key);
      const confirmRes = await api.post<Attachment>(
        `/api/tickets/${ticketId}/confirm-attachment?file_name=${encodedFileName}&file_key=${encodedKey}`
      );
      return confirmRes.data;
    }
  } catch (err) {
    console.warn("Presigned S3 upload fallback to direct multipart upload:", err);
  }

  // Fallback multipart form upload
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<Attachment>(`/api/tickets/${ticketId}/attachment`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};


export default api;