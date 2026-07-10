// Set VITE_API_URL in frontend/.env when deploying — e.g.
// VITE_API_URL=https://adepa-api.onrender.com/api
// Falls back to localhost for local development.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  tenant: Tenant;
  user: User;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
}

export interface Lead {
  id: string;
  title: string;
  stage: "new" | "qualified" | "proposal" | "won" | "lost";
  value: number;
  customer: { id: string; name: string } | null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong. Try again.");
  }
  return data as T;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  signup: (body: { businessName: string; subdomain: string; name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { subdomain: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: (token: string) =>
    request<{ user: User; tenant: Tenant }>("/me", { headers: authHeaders(token) }),
  listCustomers: (token: string) =>
    request<{ customers: Customer[] }>("/customers", { headers: authHeaders(token) }),
  createCustomer: (token: string, body: { name: string; email?: string; phone?: string; company?: string }) =>
    request<{ customer: Customer }>("/customers", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }),
  listLeads: (token: string) =>
    request<{ leads: Lead[] }>("/leads", { headers: authHeaders(token) }),
  createLead: (token: string, body: { title: string; customerId?: string; value?: number }) =>
    request<{ lead: Lead }>("/leads", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }),
  updateLeadStage: (token: string, leadId: string, stage: Lead["stage"]) =>
    request<{ lead: { id: string; stage: string } }>(`/leads/${leadId}/stage`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ stage }),
    }),
  forgotPassword: (body: { subdomain: string; email: string }) =>
    request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
  resetPassword: (body: { token: string; password: string }) =>
    request<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
};
