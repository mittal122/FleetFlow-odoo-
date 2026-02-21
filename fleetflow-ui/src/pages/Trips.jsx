import { useEffect, useState } from "react";
import client from "../api/client";
import Loading from "../components/Loading";
import Chatbot from "../components/Chatbot";

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTrips = (status) => {
    setLoading(true);
    const params = status ? `?status=${status}` : "";
    client
      .get(`/trips${params}`)
      .then((res) => setTrips(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTrips(filter);
  }, [filter]);

  const cancelTrip = async (tripId) => {
    if (!confirm("Cancel this trip?")) return;
    try {
      await client.post("/trips/cancel", { tripId });
      loadTrips(filter);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel");
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "DISPATCHED": return "#3b82f6";
      case "COMPLETED": return "#22c55e";
      case "CANCELLED": return "#ef4444";
      case "DRAFT": return "#94a3b8";
      default: return "#fff";
    }
  };

  if (loading) return <Loading message="Loading trips..." />;

    return (
      <div className="page">
        <h1>Trip History</h1>

        <div className="card">
          <div className="form-row">
            <div className="form-group">
              <label>Filter by Status</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">All Trips</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
            <span style={{ color: "#94a3b8" }}>{trips.length} trips</span>
          </div>
        </div>

        <div className="card">
          <table width="100%">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Cargo (kg)</th>
                <th>Start Odo</th>
                <th>End Odo</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.vehicle?.name} ({t.vehicle?.licensePlate})</td>
                  <td>{t.driver?.name}</td>
                  <td>{t.cargoWeight}</td>
                  <td>{t.startOdo}</td>
                  <td>{t.endOdo ?? "—"}</td>
                  <td>
                    <span className="badge" style={{ background: statusColor(t.status), color: "#fff" }}>
                      {t.status}
                    </span>
                  </td>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td>
                    {t.status === "DISPATCHED" && (
                      <button style={{ background: "var(--danger)" }} onClick={() => cancelTrip(t.id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {trips.length === 0 && (
            <p style={{ textAlign: "center", opacity: 0.5, padding: 20 }}>No trips found.</p>
          )}
        </div>
        <Chatbot />
      </div>
    );
}
