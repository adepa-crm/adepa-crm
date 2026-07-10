import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

const MODULES = [
  { name: "Dashboard", path: "/dashboard", active: true },
  { name: "Sales", path: "/sales", active: true },
  { name: "Accounting", path: "/accounting", active: false },
  { name: "Payroll", path: "/payroll", active: false },
  { name: "HR", path: "/hr", active: false },
];

export default function Shell({ children }: { children: ReactNode }) {
  const { user, tenant, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-tenant">{tenant?.name}</div>
        <nav>
          {MODULES.map((m) =>
            m.active ? (
              <Link
                key={m.name}
                to={m.path}
                className={`sidebar-item ${location.pathname === m.path ? "active" : ""}`}
              >
                {m.name}
              </Link>
            ) : (
              <div key={m.name} className="sidebar-item">
                {m.name}
                <span className="soon">Soon</span>
              </div>
            )
          )}
        </nav>
      </aside>
      <main className="content">
        <header className="topbar">
          <span>
            Signed in as {user?.name}, {user?.role}
          </span>
          <button onClick={logout}>Log out</button>
        </header>
        <div className="content-body">{children}</div>
      </main>
    </div>
  );
}
