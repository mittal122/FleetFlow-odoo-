import { useState } from "react";
import client from "../api/client";
import { useAuth } from "../components/AuthContext";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { login, register, isAuthenticated, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  if (isAuthenticated) return <Navigate to="/" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("Email and password are required");
      return;
    }
    if (isRegister && !form.name) {
      setError("Name is required");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    const result = isRegister
      ? await register(form.name, form.email, form.password)
      : await login(form.email, form.password);
    if (!result.success) setError(result.error);
  };

  const handleForgot = async () => {
    setResetMsg("");
    try {
      const res = await client.post("/auth/forgot", { email: resetEmail });
      setResetMsg(`Reset token: ${res.data.token}`);
    } catch (err) {
      setResetMsg(err.response?.data?.error || "Error");
    }
  };

  const handleReset = async () => {
    setResetMsg("");
    try {
      await client.post("/auth/reset", { token: resetToken, password: resetPassword });
      setResetMsg("Password reset successful. You can now login.");
    } catch (err) {
      setResetMsg(err.response?.data?.error || "Error");
    }
  };

    return (
      <div className="page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ minWidth: 340, maxWidth: 380, margin: "auto", padding: 32 }}>
          <h2 style={{ color: "var(--primary)", textAlign: "center", marginBottom: 8 }}>FleetFlow</h2>
          <p style={{ color: "var(--muted)", textAlign: "center", marginBottom: 24 }}>{isRegister ? "Create Account" : "Sign In"}</p>

          {error && <div className="card" style={{ borderColor: "var(--danger)", color: "var(--danger)", marginBottom: 16 }}>{error}</div>}

          {!showForgot ? (
            <>
              <form onSubmit={handleSubmit}>
                {isRegister && (
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      placeholder="e.g. John Doe"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. admin@fleetflow.io"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <button type="submit" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
                  {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
                </button>
              </form>
              <p style={{ textAlign: "center", marginTop: 18, color: "var(--muted)", fontSize: 14 }}>
                {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                <span style={{ color: "var(--primary)", cursor: "pointer" }} onClick={() => { setIsRegister(!isRegister); setError(""); }}>
                  {isRegister ? "Sign In" : "Register"}
                </span>
              </p>
              <p style={{ textAlign: "center", marginTop: 8 }}>
                <span style={{ color: "var(--primary)", cursor: "pointer" }} onClick={() => setShowForgot(true)}>
                  Forgot Password?
                </span>
              </p>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. admin@fleetflow.io"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                />
              </div>
              <button style={{ width: "100%", marginBottom: 8 }} onClick={handleForgot}>Request Reset Token</button>
              <div className="form-group">
                <label>Reset Token</label>
                <input
                  placeholder="Paste token here"
                  value={resetToken}
                  onChange={e => setResetToken(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  minLength={6}
                />
              </div>
              <button style={{ width: "100%" }} onClick={handleReset}>Reset Password</button>
              <p style={{ color: "var(--primary)", marginTop: 8 }}>{resetMsg}</p>
              <p style={{ textAlign: "center", marginTop: 8 }}>
                <span style={{ color: "var(--muted)", cursor: "pointer" }} onClick={() => setShowForgot(false)}>
                  Back to Login
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    );
}
