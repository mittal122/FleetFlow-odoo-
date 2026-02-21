import { useEffect, useState } from "react";
import client from "../api/client";
import Chatbot from "../components/Chatbot";

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    name: "",
    licensePlate: "",
    maxCapacity: "",
  });

  const loadVehicles = () =>
    client.get("/vehicles").then((res) => setVehicles(res.data));

  useEffect(() => {
    loadVehicles();
  }, []);

  const createVehicle = async () => {
    try {
      await client.post("/vehicles", {
        ...form,
        maxCapacity: Number(form.maxCapacity),
      });
      setForm({ name: "", licensePlate: "", maxCapacity: "" });
      loadVehicles();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create vehicle");
    }
  };

  const retireVehicle = async (id) => {
    await client.patch(`/vehicles/${id}/retire`);
    loadVehicles();
  };

  const statusColor = (status) => {
    switch (status) {
      case "AVAILABLE": return "#22c55e";
      case "ON_TRIP": return "#3b82f6";
      case "IN_SHOP": return "#f59e0b";
      case "RETIRED": return "#6b7280";
      default: return "#fff";
    }
  };

    return (
      <div className="page">
        <h1>Vehicle Registry</h1>

        <div className="card">
          <h3>Add Vehicle</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Vehicle Name</label>
              <input
                placeholder="e.g. Truck Alpha"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>License Plate</label>
              <input
                placeholder="e.g. FL-1001"
                value={form.licensePlate}
                onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Max Capacity (kg)</label>
              <input
                placeholder="e.g. 5000"
                type="number"
                value={form.maxCapacity}
                onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })}
              />
            </div>
            <button onClick={createVehicle}>Create Vehicle</button>
          </div>
        </div>

        <div className="card">
          <h3>Fleet ({vehicles.length})</h3>
          <table width="100%">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>License Plate</th>
                <th>Capacity</th>
                <th>Odometer</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td>{v.name}</td>
                  <td>{v.licensePlate}</td>
                  <td>{v.maxCapacity} kg</td>
                  <td>{v.odometer} km</td>
                  <td>
                    <span className="badge" style={{ background: statusColor(v.status), color: "#fff" }}>
                      {v.status}
                    </span>
                  </td>
                  <td>
                    {v.status !== "RETIRED" && (
                      <button style={{ background: "var(--danger)" }} onClick={() => retireVehicle(v.id)}>
                        Retire
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Chatbot />
      </div>
    );
}
