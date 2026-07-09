import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [subdomain, setSubdomain] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token, user, tenant } = await api.login({ subdomain, email, password });
      setSession(token, user, tenant);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Log in to your workspace</h1>
        <label>
          Workspace
          <input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="adepa" required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? "Signing in..." : "Log in"}</button>
        <p className="auth-switch">
          New here? <Link to="/signup">Create a workspace</Link>
        </p>
      </form>
    </div>
  );
}
