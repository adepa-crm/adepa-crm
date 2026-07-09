const API_BASE = "http://localhost:4000/api";

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

export const api = {
  signup: (body: { businessName: string; subdomain: string; name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { subdomain: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: (token: string) =>
    request<{ user: User; tenant: Tenant }>("/me", { headers: { Authorization: `Bearer ${token}` } }),
};
