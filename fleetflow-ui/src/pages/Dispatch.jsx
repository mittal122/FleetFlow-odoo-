import { useEffect, useState } from "react";
import client from "../api/client";

export default function Dispatch() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({
    vehicleId: "",
    driverId: "",
    cargoWeight: "",
    startOdo: "",
  });
  const [completeForm, setCompleteForm] = useState({ tripId: "", endOdo: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    client.get("/vehicles/available/list").then((res) => setVehicles(res.data));
    client.get("/drivers/available/list").then((res) => setDrivers(res.data));
  }, []);

  const reload = () => {
    client.get("/vehicles/available/list").then((res) => setVehicles(res.data));
    client.get("/drivers/available/list").then((res) => setDrivers(res.data));
  };

  const dispatchTrip = async () => {
    try {
      const res = await client.post("/trips/dispatch", {
        vehicleId: Number(form.vehicleId),
        driverId: Number(form.driverId),
        cargoWeight: Number(form.cargoWeight),
        startOdo: Number(form.startOdo),
      });
      setMessage(`Trip #${res.data.id} dispatched successfully!`);
      setForm({ vehicleId: "", driverId: "", cargoWeight: "", startOdo: "" });
      reload();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const completeTrip = async () => {
    try {
      await client.post("/trips/complete", {
        tripId: Number(completeForm.tripId),
        endOdo: Number(completeForm.endOdo),
      });
      setMessage("Trip completed successfully!");
      setCompleteForm({ tripId: "", endOdo: "" });
      reload();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div>
      <h1>Trip Dispatcher</h1>

      {message && (
        <div className={`card ${message.startsWith("Error") ? "alert" : "success"}`}>
          {message}
        </div>
      )}

      <div className="card">
        <h3>Dispatch New Trip</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Vehicle</label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            >
              <option value="">-- Select Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.licensePlate}) — Cap: {v.maxCapacity}kg
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Driver</label>
            <select
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
            >
              <option value="">-- Select Driver --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Cargo Weight (kg)</label>
            <input
              placeholder="e.g. 3000"
              type="number"
              value={form.cargoWeight}
              onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Start Odometer (km)</label>
            <input
              placeholder="e.g. 12000"
              type="number"
              value={form.startOdo}
              onChange={(e) => setForm({ ...form, startOdo: e.target.value })}
            />
          </div>

          <button onClick={dispatchTrip}>Dispatch Trip</button>
        </div>
      </div>

      <div className="card">
        <h3>Complete Trip</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Trip ID</label>
            <input
              placeholder="e.g. 1"
              type="number"
              value={completeForm.tripId}
              onChange={(e) =>
                setCompleteForm({ ...completeForm, tripId: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>End Odometer (km)</label>
            <input
              placeholder="e.g. 12450"
              type="number"
              value={completeForm.endOdo}
              onChange={(e) =>
                setCompleteForm({ ...completeForm, endOdo: e.target.value })
              }
            />
          </div>
          <button onClick={completeTrip}>Complete Trip</button>
        </div>
      </div>
    </div>
  );
}
