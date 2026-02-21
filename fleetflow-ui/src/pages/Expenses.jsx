import { useEffect, useState } from "react";
import client from "../api/client";
import Loading from "../components/Loading";

export default function Expenses() {
  const [form, setForm] = useState({ vehicleId: "", liters: "", cost: "" });
  const [costResult, setCostResult] = useState(null);
  const [effResult, setEffResult] = useState(null);
  const [lookupId, setLookupId] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = () => {
    setLoading(true);
    client
      .get("/expenses/history")
      .then((res) => setHistory(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadHistory(); }, []);

  const logFuel = async () => {
    if (!form.vehicleId || !form.liters || !form.cost) {
      setMessage("Error: All fields are required");
      return;
    }
    if (Number(form.liters) <= 0 || Number(form.cost) <= 0) {
      setMessage("Error: Liters and cost must be greater than 0");
      return;
    }
    try {
      await client.post("/expenses/fuel", {
        vehicleId: Number(form.vehicleId),
        liters: Number(form.liters),
        cost: Number(form.cost),
      });
      setMessage("Fuel expense logged");
      setForm({ vehicleId: "", liters: "", cost: "" });
      loadHistory();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const getOperationalCost = async () => {
    if (!lookupId) return;
    const res = await client.get(`/expenses/cost/${lookupId}`);
    setCostResult(res.data);
  };

  const getEfficiency = async () => {
    if (!lookupId) return;
    const res = await client.get(`/expenses/efficiency/${lookupId}`);
    setEffResult(res.data);
  };

  return (
    <div>
      <h1>Fuel & Expenses</h1>

      {message && (
        <div className={`card ${message.startsWith("Error") ? "alert" : "success"}`}>
          {message}
        </div>
      )}

      <div className="card">
        <h3>Log Fuel Expense</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Vehicle ID</label>
            <input placeholder="e.g. 1" type="number" min="1" required
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Fuel Liters</label>
            <input placeholder="e.g. 60" type="number" min="0.1" step="0.1" required
              value={form.liters}
              onChange={(e) => setForm({ ...form, liters: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Cost (₹)</label>
            <input placeholder="e.g. 120" type="number" min="1" required
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </div>
          <button onClick={logFuel}>Log Fuel Expense</button>
        </div>
      </div>

      <div className="card">
        <h3>Lookup Vehicle Financials</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Vehicle ID</label>
            <input placeholder="e.g. 1" type="number" min="1"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)} />
          </div>
          <button onClick={getOperationalCost}>Get Total Cost</button>
          <button onClick={getEfficiency}>Get Fuel Efficiency</button>
        </div>
        {costResult && (
          <p style={{marginTop:10}}>Total Operational Cost: ₹ {costResult.totalOperationalCost.toLocaleString()}</p>
        )}
        {effResult && <p>Fuel Efficiency: {effResult.kmPerLiter} km/L</p>}
      </div>

      <div className="card">
        <h3>Expense History ({history.length})</h3>
        {loading ? (
          <Loading message="Loading expenses..." />
        ) : (
          <table width="100%">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle</th>
                <th>Fuel (L)</th>
                <th>Cost (₹)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.vehicle?.name} ({e.vehicle?.licensePlate})</td>
                  <td>{e.fuelLiters}</td>
                  <td>₹ {e.cost.toLocaleString()}</td>
                  <td>{new Date(e.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && history.length === 0 && (
          <p style={{ textAlign: "center", opacity: 0.5 }}>No expenses yet.</p>
        )}
      </div>
    </div>
  );
}
