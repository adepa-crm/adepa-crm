import type { ReactElement } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Sales from "./pages/Sales";
import Signup from "./pages/Signup";
import "./App.css";

function RequireAuth({ children }: { children: ReactElement }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Router basename="/adepa">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/sales"
            element={
              <RequireAuth>
                <Sales />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
