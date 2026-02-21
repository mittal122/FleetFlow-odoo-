import { useAuth } from "../components/AuthContext";

export default function Layout({ children }) {
  const { user, logout } = useAuth?.() || {};
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div className="sidebar">
        <h2>FleetFlow</h2>
        <a href="/">Dashboard</a>
        <a href="/vehicles">Vehicles</a>
        <a href="/dispatch">Dispatch</a>
        <a href="/analytics">Analytics</a>
        <div style={{ marginTop: 40, color: "var(--muted)", fontSize: 13 }}>
          {user && (
            <>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: "var(--primary)", fontWeight: 500 }}>
                  {user.role === "ADMIN"
                    ? "Admin"
                    : user.role === "DISPATCHER"
                    ? "Dispatcher"
                    : user.role === "VIEWER"
                    ? "Viewer"
                    : user.role}
                </span> logged in
              </div>
              <div style={{ fontSize: 12 }}>{user.email}</div>
              <button style={{ marginTop: 10, background: "var(--danger)", color: "#fff", border: 0, borderRadius: 6, padding: "4px 14px", cursor: "pointer" }} onClick={logout}>Logout</button>
            </>
          )}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div className="page">
          {user && (
            <div style={{ marginBottom: 16, color: "var(--muted)", fontSize: 14, textAlign: "right" }}>
              You are logged in as <span style={{ color: "var(--primary)", fontWeight: 500 }}>
                {user.role === "ADMIN"
                  ? "Admin"
                  : user.role === "DISPATCHER"
                  ? "Dispatcher"
                  : user.role === "VIEWER"
                  ? "Viewer"
                  : user.role}
              </span>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
