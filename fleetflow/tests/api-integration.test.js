/**
 * ============================================================
 *  FleetFlow — Full API Integration Tests
 * ============================================================
 *  These tests walk through every feature of FleetFlow end-to-end
 *  using real HTTP requests so you can see exactly how the
 *  application works.
 *
 *  Run:  npm test
 *
 *  The tests are written as a STORY — read them top to bottom
 *  to understand the full application lifecycle.
 * ============================================================
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { resetDb, prisma } from "./helpers.js";

// Import the Express app (without starting .listen())
let app;

beforeAll(async () => {
  // Dynamic import to avoid the listen() call from interfering
  const mod = await import("../src/server.js");
  app = mod.app;
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

// ─── Shared state across the story ──────────────────────────
let adminToken;
let dispatcherToken;
let viewerToken;
let vehicle1, vehicle2, vehicle3;
let driver1, driver2;
let trip1;

// ═══════════════════════════════════════════════════════════════
//  CHAPTER 1 — AUTHENTICATION & AUTHORIZATION
//  Shows: register, login, JWT tokens, role-based access
// ═══════════════════════════════════════════════════════════════

describe("Chapter 1: Authentication", () => {
  it("1.1 — Health check works without auth", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("FleetFlow running");
    // ✅ The /api/health endpoint is public — no token needed
  });

  it("1.2 — Protected routes reject unauthenticated requests", async () => {
    const res = await request(app).get("/api/vehicles");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
    // ✅ All /api/vehicles, /api/trips, etc. require a JWT token
  });

  it("1.3 — Register an ADMIN user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "admin@test.com",
      password: "admin123",
      name: "Admin User",
      role: "ADMIN",
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("ADMIN");
    adminToken = res.body.token;
    // ✅ Registration returns a JWT token immediately
  });

  it("1.4 — Register a DISPATCHER user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "dispatcher@test.com",
      password: "dispatch123",
      name: "Jane Dispatcher",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("DISPATCHER"); // default role
    dispatcherToken = res.body.token;
    // ✅ Default role is DISPATCHER when not specified
  });

  it("1.5 — Register a VIEWER user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "viewer@test.com",
      password: "viewer123",
      name: "Read Only",
      role: "VIEWER",
    });
    expect(res.status).toBe(201);
    viewerToken = res.body.token;
  });

  it("1.6 — Reject duplicate email registration", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "admin@test.com",
      password: "other123",
      name: "Duplicate",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email already registered");
    // ✅ Each email can only be used once
  });

  it("1.7 — Reject short passwords", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "short@test.com",
      password: "ab",
      name: "Short",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("at least 6");
    // ✅ Passwords must be 6+ characters
  });

  it("1.8 — Login with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "admin123",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("admin@test.com");
    adminToken = res.body.token; // refresh token
    // ✅ Login returns a new JWT valid for 24 hours
  });

  it("1.9 — Reject wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
    // ✅ Wrong password does NOT reveal whether the email exists
  });

  it("1.10 — Reject invalid JWT token", async () => {
    const res = await request(app)
      .get("/api/vehicles")
      .set("Authorization", "Bearer fake-token-12345");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
    // ✅ Tampered/expired tokens are rejected
  });
});

// ═══════════════════════════════════════════════════════════════
//  CHAPTER 2 — VEHICLE REGISTRY
//  Shows: create vehicles, list, update, retire
// ═══════════════════════════════════════════════════════════════

describe("Chapter 2: Vehicle Registry", () => {
  it("2.1 — Create vehicles", async () => {
    const trucks = [
      { name: "Truck Alpha", licensePlate: "FL-1001", maxCapacity: 5000 },
      { name: "Truck Bravo", licensePlate: "FL-1002", maxCapacity: 8000, odometer: 5000 },
      { name: "Van Charlie", licensePlate: "FL-2001", maxCapacity: 1500 },
    ];

    for (const data of trucks) {
      const res = await request(app)
        .post("/api/vehicles")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(data);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("AVAILABLE");
    }
    // ✅ All new vehicles start as AVAILABLE with odometer 0 (or specified)
  });

  it("2.2 — List all vehicles", async () => {
    const res = await request(app)
      .get("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
    vehicle1 = res.body.find((v) => v.licensePlate === "FL-1001");
    vehicle2 = res.body.find((v) => v.licensePlate === "FL-1002");
    vehicle3 = res.body.find((v) => v.licensePlate === "FL-2001");
    expect(vehicle1).toBeDefined();
    // ✅ Returns all vehicles, most recent first
  });

  it("2.3 — List only AVAILABLE vehicles", async () => {
    const res = await request(app)
      .get("/api/vehicles/available/list")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.every((v) => v.status === "AVAILABLE")).toBe(true);
    // ✅ This endpoint is used by the Dispatch page dropdown
  });

  it("2.4 — Update a vehicle", async () => {
    const res = await request(app)
      .put(`/api/vehicles/${vehicle1.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Truck Alpha Updated", maxCapacity: 6000 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Truck Alpha Updated");
    expect(res.body.maxCapacity).toBe(6000);
    // ✅ Can update name, capacity, etc. via PUT
  });

  it("2.5 — Retire a vehicle (permanent)", async () => {
    const res = await request(app)
      .patch(`/api/vehicles/${vehicle3.id}/retire`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("RETIRED");
    // ✅ RETIRED is permanent — vehicle can never be dispatched again
  });
});

// ═══════════════════════════════════════════════════════════════
//  CHAPTER 3 — DRIVER MANAGEMENT
//  Shows: create drivers, compliance checks, performance tracking
// ═══════════════════════════════════════════════════════════════

describe("Chapter 3: Driver Management", () => {
  it("3.1 — Create drivers", async () => {
    const res1 = await request(app)
      .post("/api/drivers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Carlos Mendez", licenseExpiry: "2027-06-01" });
    expect(res1.status).toBe(200);
    expect(res1.body.status).toBe("AVAILABLE");

    const res2 = await request(app)
      .post("/api/drivers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Aisha Patel", licenseExpiry: "2027-12-01" });
    expect(res2.status).toBe(200);
    // ✅ Drivers start AVAILABLE with a license expiry date
  });

  it("3.2 — List all drivers", async () => {
    const res = await request(app)
      .get("/api/drivers")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    driver1 = res.body.find((d) => d.name === "Carlos Mendez");
    driver2 = res.body.find((d) => d.name === "Aisha Patel");
    // ✅ Returns all drivers
  });

  it("3.3 — Check driver compliance (valid license)", async () => {
    const res = await request(app)
      .get(`/api/drivers/compliance/${driver1.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.compliant).toBe(true);
    // ✅ Compliant = license not expired AND not suspended
  });

  it("3.4 — Suspend a driver", async () => {
    const res = await request(app)
      .patch(`/api/drivers/status/${driver2.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "SUSPENDED" });
    expect(res.status).toBe(200);
    // ✅ Admin can suspend a driver (e.g., safety violation)
  });

  it("3.5 — Suspended driver fails compliance", async () => {
    const res = await request(app)
      .get(`/api/drivers/compliance/${driver2.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("suspended");
    // ✅ Suspended drivers cannot be dispatched
  });

  it("3.6 — Reinstate the driver", async () => {
    const res = await request(app)
      .patch(`/api/drivers/status/${driver2.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "AVAILABLE" });
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════
//  CHAPTER 4 — TRIP DISPATCH ENGINE (core business logic)
//  Shows: dispatch, complete, cancel trips with state transitions
// ═══════════════════════════════════════════════════════════════

describe("Chapter 4: Trip Dispatch", () => {
  it("4.1 — Dispatch a trip (vehicle + driver locked atomically)", async () => {
    const res = await request(app)
      .post("/api/trips/dispatch")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vehicleId: vehicle1.id,
        driverId: driver1.id,
        cargoWeight: 3000,
        startOdo: 1000,
      });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("DISPATCHED");
    trip1 = res.body;

    // Verify vehicle is now ON_TRIP
    const vRes = await request(app)
      .get("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`);
    const v = vRes.body.find((x) => x.id === vehicle1.id);
    expect(v.status).toBe("ON_TRIP");

    // Verify driver is now ON_DUTY
    const dRes = await request(app)
      .get("/api/drivers")
      .set("Authorization", `Bearer ${adminToken}`);
    const d = dRes.body.find((x) => x.id === driver1.id);
    expect(d.status).toBe("ON_DUTY");

    // ✅ Dispatching a trip:
    //    1. Validates vehicle is AVAILABLE
    //    2. Validates cargo ≤ maxCapacity
    //    3. Validates driver is AVAILABLE
    //    4. Validates driver license not expired
    //    5. Creates trip as DISPATCHED
    //    6. Atomically sets vehicle → ON_TRIP, driver → ON_DUTY
  });

  it("4.2 — Cannot dispatch same vehicle again (already ON_TRIP)", async () => {
    const res = await request(app)
      .post("/api/trips/dispatch")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vehicleId: vehicle1.id,
        driverId: driver2.id,
        cargoWeight: 1000,
        startOdo: 1000,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Vehicle is not available");
    // ✅ A vehicle can only be on one trip at a time
  });

  it("4.3 — Cannot dispatch same driver again (already ON_DUTY)", async () => {
    const res = await request(app)
      .post("/api/trips/dispatch")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vehicleId: vehicle2.id,
        driverId: driver1.id,
        cargoWeight: 1000,
        startOdo: 5000,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Driver is not available");
    // ✅ A driver can only be on one trip at a time
  });

  it("4.4 — Cannot exceed vehicle capacity", async () => {
    const res = await request(app)
      .post("/api/trips/dispatch")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vehicleId: vehicle2.id,
        driverId: driver2.id,
        cargoWeight: 99999, // way over 8000 capacity
        startOdo: 5000,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Cargo exceeds vehicle capacity");
    // ✅ Cargo weight is validated against vehicle maxCapacity
  });

  it("4.5 — Cannot dispatch a RETIRED vehicle", async () => {
    const res = await request(app)
      .post("/api/trips/dispatch")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vehicleId: vehicle3.id,
        driverId: driver2.id,
        cargoWeight: 500,
        startOdo: 0,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Vehicle is not available");
    // ✅ Retired vehicles cannot be dispatched
  });

  it("4.6 — List trips with filters", async () => {
    const all = await request(app)
      .get("/api/trips")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(all.status).toBe(200);
    expect(all.body.length).toBe(1);

    // Filter by status
    const dispatched = await request(app)
      .get("/api/trips?status=DISPATCHED")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(dispatched.body.length).toBe(1);
    expect(dispatched.body[0].vehicle.name).toBeDefined();
    expect(dispatched.body[0].driver.name).toBeDefined();
    // ✅ Trip list includes vehicle name & driver name via relations
  });

  it("4.7 — Complete a trip (releases vehicle + driver)", async () => {
    const res = await request(app)
      .post("/api/trips/complete")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ tripId: trip1.id, endOdo: 1450 });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("completed");

    // Verify vehicle is back to AVAILABLE with updated odometer
    const vRes = await request(app)
      .get("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`);
    const v = vRes.body.find((x) => x.id === vehicle1.id);
    expect(v.status).toBe("AVAILABLE");
    expect(v.odometer).toBe(1450);

    // Verify driver is back to AVAILABLE
    const dRes = await request(app)
      .get("/api/drivers")
      .set("Authorization", `Bearer ${adminToken}`);
    const d = dRes.body.find((x) => x.id === driver1.id);
    expect(d.status).toBe("AVAILABLE");

    // ✅ Completing a trip:
    //    1. Sets trip status → COMPLETED
    //    2. Records the end odometer
    //    3. Updates vehicle odometer
    //    4. Returns vehicle → AVAILABLE, driver → AVAILABLE
  });

  it("4.8 — Cannot complete an already-completed trip", async () => {
    const res = await request(app)
      .post("/api/trips/complete")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ tripId: trip1.id, endOdo: 2000 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Trip cannot be completed");
  });

  it("4.9 — Dispatch & cancel a trip", async () => {
    // Dispatch a new trip
    const dispRes = await request(app)
      .post("/api/trips/dispatch")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vehicleId: vehicle2.id,
        driverId: driver2.id,
        cargoWeight: 4000,
        startOdo: 5000,
      });
    expect(dispRes.status).toBe(200);
    const trip2 = dispRes.body;

    // Cancel it
    const cancelRes = await request(app)
      .post("/api/trips/cancel")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ tripId: trip2.id });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.message).toContain("cancelled");

    // Verify vehicle and driver are released
    const vRes = await request(app)
      .get("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`);
    const v = vRes.body.find((x) => x.id === vehicle2.id);
    expect(v.status).toBe("AVAILABLE");

    // ✅ Cancelling a trip:
    //    1. Sets trip → CANCELLED
    //    2. Releases vehicle → AVAILABLE
    //    3. Releases driver → AVAILABLE
  });

  it("4.10 — Cannot cancel a completed trip", async () => {
    const res = await request(app)
      .post("/api/trips/cancel")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ tripId: trip1.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Only dispatched");
  });

  it("4.11 — Driver performance after trips", async () => {
    const res = await request(app)
      .get(`/api/drivers/performance/${driver1.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalTrips).toBe(1);
    expect(res.body.completedTrips).toBe(1);
    expect(res.body.completionRate).toBe("100.00%");
    // ✅ Performance = completed / total trips percentage
  });
});

// ═══════════════════════════════════════════════════════════════
//  CHAPTER 5 — MAINTENANCE MODULE
//  Shows: auto-blocking vehicle, completing maintenance
// ═══════════════════════════════════════════════════════════════

describe("Chapter 5: Maintenance", () => {
  it("5.1 — Log maintenance → vehicle auto-moves to IN_SHOP", async () => {
    const res = await request(app)
      .post("/api/maintenance/log")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ vehicleId: vehicle1.id, cost: 1200 });
    expect(res.status).toBe(200);
    expect(res.body.cost).toBe(1200);

    // Vehicle should now be IN_SHOP
    const vRes = await request(app)
      .get("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`);
    const v = vRes.body.find((x) => x.id === vehicle1.id);
    expect(v.status).toBe("IN_SHOP");

    // ✅ Logging maintenance automatically blocks the vehicle
    //    This prevents dispatching a vehicle that's being serviced
  });

  it("5.2 — Cannot dispatch a vehicle IN_SHOP", async () => {
    const res = await request(app)
      .post("/api/trips/dispatch")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vehicleId: vehicle1.id,
        driverId: driver1.id,
        cargoWeight: 1000,
        startOdo: 1450,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Vehicle is not available");
    // ✅ Vehicle is blocked until maintenance is marked complete
  });

  it("5.3 — Cannot log maintenance for a RETIRED vehicle", async () => {
    const res = await request(app)
      .post("/api/maintenance/log")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ vehicleId: vehicle3.id, cost: 500 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("retired");
  });

  it("5.4 — Complete maintenance → vehicle returns to AVAILABLE", async () => {
    const res = await request(app)
      .post("/api/maintenance/complete")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ vehicleId: vehicle1.id, newOdometer: 1460 });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("returned to service");

    // Verify vehicle is back
    const vRes = await request(app)
      .get("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`);
    const v = vRes.body.find((x) => x.id === vehicle1.id);
    expect(v.status).toBe("AVAILABLE");
    expect(v.odometer).toBe(1460);
    // ✅ Optionally update odometer during maintenance
  });

  it("5.5 — View maintenance history", async () => {
    const res = await request(app)
      .get("/api/maintenance/history")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].vehicle.name).toBeDefined();
    // ✅ History includes vehicle name via relation

    // Filter by vehicle
    const filtered = await request(app)
      .get(`/api/maintenance/history?vehicleId=${vehicle1.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(filtered.body.every((m) => m.vehicleId === vehicle1.id)).toBe(true);
    // ✅ Can filter history by specific vehicle
  });
});

// ═══════════════════════════════════════════════════════════════
//  CHAPTER 6 — FUEL, EXPENSES & COST ENGINE
//  Shows: log expenses, operational cost, fuel efficiency
// ═══════════════════════════════════════════════════════════════

describe("Chapter 6: Expenses & Cost Engine", () => {
  it("6.1 — Log fuel expenses", async () => {
    const res = await request(app)
      .post("/api/expenses/fuel")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ vehicleId: vehicle1.id, liters: 60, cost: 120 });
    expect(res.status).toBe(200);
    expect(res.body.fuelLiters).toBe(60);
    expect(res.body.cost).toBe(120);
    // ✅ Fuel expense records fuel liters + cost for a vehicle

    // Add another for analytics
    await request(app)
      .post("/api/expenses/fuel")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ vehicleId: vehicle1.id, liters: 40, cost: 80 });
  });

  it("6.2 — Cannot log expense for RETIRED vehicle", async () => {
    const res = await request(app)
      .post("/api/expenses/fuel")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ vehicleId: vehicle3.id, liters: 10, cost: 20 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("retired");
  });

  it("6.3 — Get vehicle operational cost (fuel + maintenance)", async () => {
    const res = await request(app)
      .get(`/api/expenses/cost/${vehicle1.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    // $120 fuel + $80 fuel + $1200 maintenance = $1400
    expect(res.body.totalOperationalCost).toBe(1400);
    // ✅ Aggregates ALL costs — fuel AND maintenance
  });

  it("6.4 — Get fuel efficiency (km per liter)", async () => {
    const res = await request(app)
      .get(`/api/expenses/efficiency/${vehicle1.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    // Trip drove 1450-1000=450 km, used 60+40=100 liters → 4.5 km/L
    expect(res.body.kmPerLiter).toBe(4.5);
    // ✅ Efficiency = total distance from COMPLETED trips / total fuel liters
  });

  it("6.5 — View expense history", async () => {
    const res = await request(app)
      .get("/api/expenses/history")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].vehicle.name).toBeDefined();
    // ✅ Returns all fuel expenses with vehicle info
  });
});

// ═══════════════════════════════════════════════════════════════
//  CHAPTER 7 — DASHBOARD & ANALYTICS
//  Shows: fleet KPIs, per-vehicle report, CSV export
// ═══════════════════════════════════════════════════════════════

describe("Chapter 7: Dashboard & Analytics", () => {
  it("7.1 — Dashboard shows fleet-wide stats", async () => {
    // Dispatch a trip first so we have an active vehicle
    await request(app)
      .post("/api/trips/dispatch")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vehicleId: vehicle2.id,
        driverId: driver2.id,
        cargoWeight: 3000,
        startOdo: 5000,
      });

    const res = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalFleet).toBe(3);
    expect(res.body.activeFleet).toBe(1); // vehicle2 is ON_TRIP
    expect(res.body.maintenanceAlerts).toBe(0);
    expect(Number(res.body.utilizationRate)).toBeGreaterThan(0);
    // ✅ Dashboard KPIs:
    //    - totalFleet: all vehicles
    //    - activeFleet: vehicles with status ON_TRIP
    //    - maintenanceAlerts: vehicles with status IN_SHOP
    //    - utilizationRate: activeFleet / totalFleet * 100
  });

  it("7.2 — Analytics: per-vehicle fleet report", async () => {
    const res = await request(app)
      .get("/api/analytics/fleet")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const v1Report = res.body.find((r) => r.licensePlate === "FL-1001");
    expect(v1Report).toBeDefined();
    expect(v1Report.totalCost).toBe(1400);
    expect(v1Report.kmDriven).toBe(450);
    expect(Number(v1Report.efficiency)).toBe(4.5);
    // ✅ Per-vehicle report includes:
    //    - vehicle name & license plate
    //    - current status
    //    - total cost (fuel + maintenance)
    //    - total km driven (from completed trips)
    //    - fuel efficiency (km/L)
  });

  it("7.3 — Export fleet report as CSV", async () => {
    const res = await request(app)
      .get("/api/analytics/export/csv")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("fleet-report.csv");
    expect(res.text).toContain("Vehicle");
    expect(res.text).toContain("FL-1001");
    // ✅ CSV file download with all fleet analytics data
  });
});

// ═══════════════════════════════════════════════════════════════
//  CHAPTER 8 — COMPLETE LIFECYCLE WALKTHROUGH
//  A full real-world scenario from start to finish
// ═══════════════════════════════════════════════════════════════

describe("Chapter 8: Full Lifecycle Scenario", () => {
  it("8.1 — End-to-end: register → add vehicle → add driver → dispatch → fuel up → complete → analyze", async () => {
    // STEP 1: Register a new dispatcher
    const regRes = await request(app).post("/api/auth/register").send({
      email: "newguy@fleet.com",
      password: "welcome1",
      name: "New Guy",
    });
    const token = regRes.body.token;
    expect(token).toBeDefined();

    // STEP 2: Add a vehicle
    const vRes = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Express Van", licensePlate: "EV-9999", maxCapacity: 2000 });
    const van = vRes.body;
    expect(van.status).toBe("AVAILABLE");

    // STEP 3: Add a driver
    const dRes = await request(app)
      .post("/api/drivers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Sam Wilson", licenseExpiry: "2028-01-01" });
    const sam = dRes.body;
    expect(sam.status).toBe("AVAILABLE");

    // STEP 4: Dispatch a trip
    const tripRes = await request(app)
      .post("/api/trips/dispatch")
      .set("Authorization", `Bearer ${token}`)
      .send({
        vehicleId: van.id,
        driverId: sam.id,
        cargoWeight: 1500,
        startOdo: 0,
      });
    expect(tripRes.body.status).toBe("DISPATCHED");
    const tripId = tripRes.body.id;

    // STEP 5: Log fuel before completing
    await request(app)
      .post("/api/expenses/fuel")
      .set("Authorization", `Bearer ${token}`)
      .send({ vehicleId: van.id, liters: 50, cost: 100 });

    // STEP 6: Complete the trip (drove 300 km)
    const completeRes = await request(app)
      .post("/api/trips/complete")
      .set("Authorization", `Bearer ${token}`)
      .send({ tripId, endOdo: 300 });
    expect(completeRes.body.message).toContain("completed");

    // STEP 7: Check fuel efficiency
    const effRes = await request(app)
      .get(`/api/expenses/efficiency/${van.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(effRes.body.kmPerLiter).toBe(6); // 300km / 50L

    // STEP 8: Check driver performance
    const perfRes = await request(app)
      .get(`/api/drivers/performance/${sam.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(perfRes.body.completionRate).toBe("100.00%");

    // STEP 9: Send to maintenance
    await request(app)
      .post("/api/maintenance/log")
      .set("Authorization", `Bearer ${token}`)
      .send({ vehicleId: van.id, cost: 250 });

    // Verify it's blocked
    const blockedRes = await request(app)
      .post("/api/trips/dispatch")
      .set("Authorization", `Bearer ${token}`)
      .send({ vehicleId: van.id, driverId: sam.id, cargoWeight: 500, startOdo: 300 });
    expect(blockedRes.status).toBe(400);

    // STEP 10: Complete maintenance, back in service
    await request(app)
      .post("/api/maintenance/complete")
      .set("Authorization", `Bearer ${token}`)
      .send({ vehicleId: van.id });

    // STEP 11: Verify total cost
    const costRes = await request(app)
      .get(`/api/expenses/cost/${van.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(costRes.body.totalOperationalCost).toBe(350); // $100 fuel + $250 maintenance

    // ✅ Full lifecycle demonstrated!
    //    register → vehicle → driver → dispatch → fuel → complete
    //    → efficiency → performance → maintenance block → release → cost
  });
});
