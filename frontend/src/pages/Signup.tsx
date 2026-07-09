import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
}

export default function Signup() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token, user, tenant } = await api.signup({ businessName, subdomain, name, email, password });
      setSession(token, user, tenant);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create your workspace.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create your workspace</h1>
        <label>
          Business name
          <input
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              if (!subdomain) setSubdomain(slugify(e.target.value));
            }}
            placeholder="Adepa Textiles"
            required
          />
        </label>
        <label>
          Workspace address
          <input value={subdomain} onChange={(e) => setSubdomain(slugify(e.target.value))} placeholder="adepa" required />
        </label>
        <label>
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ama Serwaa" required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? "Creating..." : "Create workspace"}</button>
        <p className="auth-switch">
          Already have a workspace? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
