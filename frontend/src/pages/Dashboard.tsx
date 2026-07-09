import { useAuth } from "../lib/auth";

const MODULES = [
  { name: "Dashboard", active: true },
  { name: "Sales", active: false },
  { name: "Accounting", active: false },
  { name: "Payroll", active: false },
  { name: "HR", active: false },
];

export default function Dashboard() {
  const { user, tenant, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-tenant">{tenant?.name}</div>
        <nav>
          {MODULES.map((m) => (
            <div key={m.name} className={`sidebar-item ${m.active ? "active" : ""}`}>
              {m.name}
              {!m.active && <span className="soon">Soon</span>}
            </div>
          ))}
        </nav>
      </aside>
      <main className="content">
        <header className="topbar">
          <span>Signed in as {user?.name}, {user?.role}</span>
          <button onClick={logout}>Log out</button>
        </header>
        <div className="empty-state">
          <h2>Your workspace is ready</h2>
          <p>
            {tenant?.name} is live at <code>{tenant?.subdomain}</code>. Sales, accounting, payroll,
            and HR modules build on this foundation next.
          </p>
        </div>
      </main>
    </div>
  );
}
