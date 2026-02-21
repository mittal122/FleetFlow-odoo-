
import { useEffect, useState } from "react";
import client from "../api/client";
import Chatbot from "../components/Chatbot";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({ status: "", type: "", region: "" });

  const fetchStats = () => {
    client
      .get("/dashboard/stats", { params: filter })
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line
  }, [filter]);

  if (!stats) return <p className="loading">Loading dashboard...</p>;

  return (
    <div className="page">
      <h1>FleetFlow Command Center</h1>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="IN_SHOP">In Shop</option>
          <option value="RETIRED">Retired</option>
        </select>
        <select value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="Truck">Truck</option>
          <option value="Van">Van</option>
          <option value="Bike">Bike</option>
        </select>
        <input
          type="text"
          placeholder="Region (e.g. North)"
          value={filter.region}
          onChange={e => setFilter({ ...filter, region: e.target.value })}
          style={{ minWidth: 120 }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20, marginBottom: 32 }}>
        <div className="card stat-card">
          <span className="stat-label">Total Fleet</span>
          <span className="stat-value">{stats.totalFleet}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Active Fleet</span>
          <span className="stat-value">{stats.activeFleet}</span>
        </div>
        <div className="card stat-card" style={{ borderColor: "var(--warn)", color: "var(--warn)" }}>
          <span className="stat-label">Maintenance Alerts</span>
          <span className="stat-value">{stats.maintenanceAlerts}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Utilization Rate</span>
          <span className="stat-value">{stats.utilizationRate}%</span>
        </div>
        <div className="card stat-card" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
          <span className="stat-label">Pending Cargo</span>
          <span className="stat-value">{stats.pendingCargo}</span>
        </div>
      </div>
      <Chatbot />
    </div>
  );
}
