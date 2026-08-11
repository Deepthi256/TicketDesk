export enum Priority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW"
}

export enum Status {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED"
}

export const CATEGORIES = [
  "Hardware",
  "Software",
  "Network",
  "Access & Permissions",
  "Security",
  "Infrastructure",
  "Other"
] as const;

export type CategoryType = typeof CATEGORIES[number];

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface SignupInput {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: Status;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  ticket_id: string;
  comment: string;
  created_by: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  ticket_id: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

export interface DashboardData {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  priority_summary: {
    high: number;
    medium: number;
    low: number;
  };
  recent_tickets: Ticket[];
}

export interface TicketFilters {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
  sort?: string;
}

export interface CreateTicketInput {
  title: string;
  description: string;
  category: string;
  priority: string;
  created_by?: string;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
}