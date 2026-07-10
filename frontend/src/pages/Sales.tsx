import { useEffect, useState, type FormEvent } from "react";
import Shell from "../components/Shell";
import { api, type Customer, type Lead } from "../lib/api";
import { useAuth } from "../lib/auth";

const STAGES: { key: Lead["stage"]; label: string }[] = [
  { key: "new", label: "New" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export default function Sales() {
  const { token } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [leadTitle, setLeadTitle] = useState("");
  const [leadCustomerId, setLeadCustomerId] = useState("");
  const [leadValue, setLeadValue] = useState("");
  const [addingLead, setAddingLead] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);

  async function loadAll() {
    if (!token) return;
    setLoading(true);
    try {
      const [leadsRes, customersRes] = await Promise.all([api.listLeads(token), api.listCustomers(token)]);
      setLeads(leadsRes.leads);
      setCustomers(customersRes.customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load sales data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleAddLead(e: FormEvent) {
    e.preventDefault();
    if (!token || !leadTitle.trim()) return;
    setAddingLead(true);
    try {
      await api.createLead(token, {
        title: leadTitle,
        customerId: leadCustomerId || undefined,
        value: leadValue ? Number(leadValue) : undefined,
      });
      setLeadTitle("");
      setLeadCustomerId("");
      setLeadValue("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add lead.");
    } finally {
      setAddingLead(false);
    }
  }

  async function handleAddCustomer(e: FormEvent) {
    e.preventDefault();
    if (!token || !customerName.trim()) return;
    setAddingCustomer(true);
    try {
      await api.createCustomer(token, {
        name: customerName,
        email: customerEmail || undefined,
        phone: customerPhone || undefined,
        company: customerCompany || undefined,
      });
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setCustomerCompany("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add contact.");
    } finally {
      setAddingCustomer(false);
    }
  }

  async function handleStageChange(leadId: string, stage: Lead["stage"]) {
    if (!token) return;
    // Optimistic update so the board feels responsive
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage } : l)));
    try {
      await api.updateLeadStage(token, leadId, stage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update stage.");
      await loadAll();
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="loading">Loading...</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="sales-page">
        {error && <p className="auth-error">{error}</p>}

        <section>
          <h2>Pipeline</h2>
          <div className="pipeline-board">
            {STAGES.map((stage) => (
              <div key={stage.key} className="pipeline-column">
                <div className="pipeline-column-header">
                  {stage.label}
                  <span className="pipeline-count">{leads.filter((l) => l.stage === stage.key).length}</span>
                </div>
                {leads
                  .filter((l) => l.stage === stage.key)
                  .map((lead) => (
                    <div key={lead.id} className="lead-card">
                      <p className="lead-title">{lead.title}</p>
                      {lead.customer && <p className="lead-customer">{lead.customer.name}</p>}
                      <p className="lead-value">GH₵{lead.value.toLocaleString()}</p>
                      <select
                        value={lead.stage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value as Lead["stage"])}
                      >
                        {STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            ))}
          </div>

          <form className="inline-form" onSubmit={handleAddLead}>
            <input
              value={leadTitle}
              onChange={(e) => setLeadTitle(e.target.value)}
              placeholder="New lead title"
              required
            />
            <select value={leadCustomerId} onChange={(e) => setLeadCustomerId(e.target.value)}>
              <option value="">No contact</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              value={leadValue}
              onChange={(e) => setLeadValue(e.target.value)}
              placeholder="Value, GH₵"
              type="number"
              min="0"
            />
            <button type="submit" disabled={addingLead}>
              {addingLead ? "Adding..." : "Add lead"}
            </button>
          </form>
        </section>

        <section>
          <h2>Contacts</h2>
          <table className="contacts-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.company || "—"}</td>
                  <td>{c.email || "—"}</td>
                  <td>{c.phone || "—"}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-row">
                    No contacts yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <form className="inline-form" onSubmit={handleAddCustomer}>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Name" required />
            <input value={customerCompany} onChange={(e) => setCustomerCompany(e.target.value)} placeholder="Company" />
            <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email" type="email" />
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone" />
            <button type="submit" disabled={addingCustomer}>
              {addingCustomer ? "Adding..." : "Add contact"}
            </button>
          </form>
        </section>
      </div>
    </Shell>
  );
}
