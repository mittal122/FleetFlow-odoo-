import { useState } from "react";
import { useAuth } from "../components/AuthContext";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { login, register, isAuthenticated, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

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

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>FleetFlow</h2>
        <p className="login-subtitle">{isRegister ? "Create Account" : "Sign In"}</p>

        {error && <div className="card alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
          </button>
        </form>

        <p className="login-toggle">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <span onClick={() => { setIsRegister(!isRegister); setError(""); }}>
            {isRegister ? "Sign In" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
}
