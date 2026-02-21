import { useEffect, useState } from "react";
import client from "../api/client";
import Loading from "../components/Loading";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Analytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/analytics/fleet")
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    downloadCSV();
  };

  // For CSV download we use a hidden fetch approach since we need auth header
  const downloadCSV = async () => {
    try {
      const res = await client.get("/analytics/export/csv", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "fleet-report.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Failed to export CSV");
    }
  };

  if (loading) return <Loading message="Loading analytics..." />;

  const costData = data.map((d) => ({
    name: d.vehicle,
    cost: d.totalCost,
    km: d.kmDriven,
  }));

  const effData = data
    .filter((d) => Number(d.efficiency) > 0)
    .map((d) => ({
      name: d.vehicle,
      efficiency: Number(d.efficiency),
    }));

  const statusCounts = data.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Operational Analytics</h1>
        <button onClick={downloadCSV}>Export CSV</button>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card">
          <h3>Cost & Distance per Vehicle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0" }}
              />
              <Legend />
              <Bar dataKey="cost" fill="#3b82f6" name="Total Cost (₹)" />
              <Bar dataKey="km" fill="#22c55e" name="KM Driven" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Fleet Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {effData.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Fuel Efficiency (km/L)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={effData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0" }}
              />
              <Bar dataKey="efficiency" fill="#f59e0b" name="km/L" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data table */}
      <div className="card">
        <h3>Detail Table</h3>
        <table width="100%">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>License Plate</th>
              <th>Status</th>
              <th>Total Cost (₹)</th>
              <th>KM Driven</th>
              <th>Efficiency (km/L)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td>{row.vehicle}</td>
                <td>{row.licensePlate}</td>
                <td>{row.status}</td>
                <td>₹ {row.totalCost.toLocaleString()}</td>
                <td>{row.kmDriven}</td>
                <td>{row.efficiency}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <p style={{ textAlign: "center", opacity: 0.5 }}>
            No data yet. Add vehicles, dispatch trips, and log expenses first.
          </p>
        )}
      </div>
    </div>
  );
}
