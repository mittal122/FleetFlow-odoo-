import { useEffect, useState } from "react";
import client from "../api/client";
import Loading from "../components/Loading";
import Chatbot from "../components/Chatbot";

export default function Maintenance() {
  const [form, setForm] = useState({ vehicleId: "", cost: "" });
  const [completeForm, setCompleteForm] = useState({ vehicleId: "", newOdometer: "" });
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = () => {
    setLoading(true);
    client
      .get("/maintenance/history")
      .then((res) => setHistory(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadHistory(); }, []);

  const logMaintenance = async () => {
    if (!form.vehicleId || !form.cost) {
      setMessage("Error: Vehicle ID and cost are required");
      return;
    }
    if (Number(form.cost) <= 0) {
      setMessage("Error: Cost must be greater than 0");
      return;
    }
    try {
      await client.post("/maintenance/log", {
        vehicleId: Number(form.vehicleId),
        cost: Number(form.cost),
      });
      setMessage("Maintenance logged — vehicle moved to IN_SHOP");
      setForm({ vehicleId: "", cost: "" });
      loadHistory();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const completeMaintenance = async () => {
    if (!completeForm.vehicleId) {
      setMessage("Error: Vehicle ID is required");
      return;
    }
    try {
      await client.post("/maintenance/complete", {
        vehicleId: Number(completeForm.vehicleId),
        newOdometer: completeForm.newOdometer ? Number(completeForm.newOdometer) : undefined,
      });
      setMessage("Maintenance complete — vehicle returned to AVAILABLE");
      setCompleteForm({ vehicleId: "", newOdometer: "" });
      loadHistory();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="page">
      <h1>Maintenance Panel</h1>

      {message && (
        <div className="card" style={{ borderColor: message.startsWith("Error") ? "var(--danger)" : "var(--success)", color: message.startsWith("Error") ? "var(--danger)" : "var(--success)" }}>
          {message}
        </div>
      )}

      <div className="card">
        <h3>Log Maintenance</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Vehicle ID</label>
            <input placeholder="e.g. 1" type="number" min="1" required
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Maintenance Cost (₹)</label>
            <input placeholder="e.g. 1200" type="number" min="1" required
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </div>
          <button onClick={logMaintenance}>Log Maintenance</button>
        </div>
      </div>

      <div className="card">
        <h3>Complete Maintenance</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Vehicle ID</label>
            <input placeholder="e.g. 1" type="number" min="1" required
              value={completeForm.vehicleId}
              onChange={(e) => setCompleteForm({ ...completeForm, vehicleId: e.target.value })} />
          </div>
          <div className="form-group">
            <label>New Odometer (optional)</label>
            <input placeholder="e.g. 13000" type="number" min="0"
              value={completeForm.newOdometer}
              onChange={(e) => setCompleteForm({ ...completeForm, newOdometer: e.target.value })} />
          </div>
          <button onClick={completeMaintenance}>Complete Maintenance</button>
        </div>
      </div>

      <div className="card">
        <h3>Maintenance History ({history.length})</h3>
        {loading ? (
          <Loading message="Loading history..." />
        ) : (
          <table width="100%">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle</th>
                <th>Cost (₹)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{h.id}</td>
                  <td>{h.vehicle?.name} ({h.vehicle?.licensePlate})</td>
                  <td>₹ {h.cost.toLocaleString()}</td>
                  <td>{new Date(h.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && history.length === 0 && (
          <p style={{ textAlign: "center", opacity: 0.5 }}>No maintenance logs yet.</p>
        )}
      </div>
      <Chatbot />
    </div>
  );
}
