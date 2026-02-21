import { useEffect, useState } from "react";
import client from "../api/client";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({ name: "", licenseExpiry: "" });

  const loadDrivers = () =>
    client.get("/drivers").then((res) => setDrivers(res.data));

  useEffect(() => {
    loadDrivers();
  }, []);

  const createDriver = async () => {
    try {
      await client.post("/drivers", form);
      setForm({ name: "", licenseExpiry: "" });
      loadDrivers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create driver");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await client.patch(`/drivers/status/${id}`, { status });
      loadDrivers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update status");
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "AVAILABLE": return "#22c55e";
      case "ON_DUTY": return "#3b82f6";
      case "SUSPENDED": return "#ef4444";
      default: return "#fff";
    }
  };

  return (
    <div>
      <h1>Driver Management</h1>

      <div className="card">
        <h3>Add Driver</h3>
        <div className="form-row">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="date"
            placeholder="License Expiry"
            value={form.licenseExpiry}
            onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })}
          />
          <button onClick={createDriver}>Add Driver</button>
        </div>
      </div>

      <div className="card">
        <h3>Drivers ({drivers.length})</h3>
        <table width="100%">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>License Expiry</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.name}</td>
                <td>{new Date(d.licenseExpiry).toLocaleDateString()}</td>
                <td>
                  <span className="badge" style={{ background: statusColor(d.status) }}>
                    {d.status}
                  </span>
                </td>
                <td>
                  {d.status !== "SUSPENDED" && (
                    <button className="btn-danger" onClick={() => updateStatus(d.id, "SUSPENDED")}>
                      Suspend
                    </button>
                  )}
                  {d.status === "SUSPENDED" && (
                    <button onClick={() => updateStatus(d.id, "AVAILABLE")}>
                      Reinstate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
