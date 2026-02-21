import { useEffect, useState } from "react";
import client from "../api/client";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    client
      .get("/dashboard/stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!stats) return <p className="loading">Loading dashboard...</p>;

  return (
    <div>
      <h1>FleetFlow Command Center</h1>

      <div className="stats-grid">
        <div className="card stat-card">
          <span className="stat-label">Total Fleet</span>
          <span className="stat-value">{stats.totalFleet}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Active Fleet</span>
          <span className="stat-value">{stats.activeFleet}</span>
        </div>
        <div className="card stat-card alert">
          <span className="stat-label">Maintenance Alerts</span>
          <span className="stat-value">{stats.maintenanceAlerts}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Utilization Rate</span>
          <span className="stat-value">{stats.utilizationRate}%</span>
        </div>
      </div>
    </div>
  );
}
