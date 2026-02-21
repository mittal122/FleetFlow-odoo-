# FleetFlow — Modular Fleet & Logistics Management System

FleetFlow is a full-stack fleet management application that helps logistics companies track vehicles, manage drivers, dispatch trips, log maintenance, monitor fuel expenses, and analyze fleet performance — all from a single dashboard.

---


## Why FleetFlow?

Managing a fleet of vehicles involves juggling many moving parts: which truck is available, which driver is on duty, when maintenance is due, how much fuel is being consumed. Without a centralized system, dispatchers rely on spreadsheets and phone calls, leading to:

- **Double-dispatching** — accidentally assigning an unavailable vehicle or driver
- **Missed maintenance** — vehicles breaking down because service wasn't tracked
- **Cost blind spots** — no visibility into per-vehicle fuel efficiency or total operating cost
- **No audit trail** — no history of who drove what, when, and how

FleetFlow solves these problems with **state-driven business logic** that automatically enforces rules (e.g., a vehicle on a trip cannot be dispatched again) and provides real-time analytics.

---

## Features

| Module | What it does |
|--------|-------------|
| **Authentication** | JWT-based login/register with 3 roles: Admin, Dispatcher, Viewer |
| **Vehicle Registry** | Add, update, retire vehicles. Tracks odometer and status |
| **Driver Management** | Add drivers, check license compliance, suspend/reinstate, track performance |
| **Trip Dispatch** | Dispatch trips with cargo validation, complete or cancel with automatic resource release |
| **Maintenance** | Log service → vehicle auto-blocked (IN_SHOP). Complete to release |
| **Fuel & Expenses** | Log fuel costs, calculate per-vehicle operational cost and km/L efficiency |
| **Dashboard** | Fleet-wide KPIs: total vehicles, active trips, maintenance alerts, utilization rate |
| **Analytics** | Per-vehicle report with charts (bar + pie), downloadable CSV export |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Node.js + Express 5 (ES Modules) |
| Database | PostgreSQL 15 via Prisma ORM v5 |
| Frontend | React 19 + Vite 7 |
| Charts | Recharts |
| Auth | JWT + bcrypt |
| Testing | Vitest + Supertest (90 tests) |
| Deployment | Docker Compose + Nginx |

---

## Project Structure

```
FleetFlow-odoo-/
├── fleetflow/                  # Backend API
│   ├── src/
│   │   ├── server.js           # Express app entry point
│   │   ├── config/db.js        # Prisma client
│   │   ├── routes/             # Route handlers (thin wrappers)
│   │   │   ├── auth.routes.js
│   │   │   ├── vehicle.routes.js
│   │   │   ├── driver.routes.js
│   │   │   ├── dispatch.routes.js
│   │   │   ├── maintenance.routes.js
│   │   │   ├── expense.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   └── analytics.routes.js
│   │   ├── services/           # Business logic
│   │   │   ├── auth.service.js
│   │   │   ├── vehicle.service.js
│   │   │   ├── driver.service.js
│   │   │   ├── dispatch.service.js
│   │   │   ├── maintenance.service.js
│   │   │   ├── expense.service.js
│   │   │   ├── dashboard.service.js
│   │   │   └── analytics.service.js
│   │   └── utils/
│   │       └── auth.middleware.js
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   ├── seed.js             # Sample data
│   │   └── migrations/
│   ├── tests/                  # Vitest test suite
│   │   ├── api-integration.test.js  # 46 end-to-end API tests
│   │   ├── dispatch.test.js
│   │   ├── maintenance.test.js
│   │   ├── expense.test.js
│   │   ├── auth.test.js
│   │   └── vehicle-driver.test.js
│   ├── Dockerfile
│   └── package.json
│
├── fleetflow-ui/               # Frontend
│   ├── src/
│   │   ├── App.jsx             # Router + sidebar + auth guard
│   │   ├── api/client.js       # Axios instance
│   │   ├── components/
│   │   │   ├── AuthContext.jsx  # JWT auth state
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── Loading.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Vehicles.jsx
│   │       ├── Drivers.jsx
│   │       ├── Dispatch.jsx
│   │       ├── Trips.jsx
│   │       ├── Maintenance.jsx
│   │       ├── Expenses.jsx
│   │       └── Analytics.jsx
│   ├── Dockerfile
│   └── package.json
│
└── docker-compose.yml          # Full stack deployment
```

---

## Prerequisites

- **Node.js** 18+ (recommended: 20)
- **PostgreSQL** 15+ (or Docker)
- **npm** 9+

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mittal122/FleetFlow-odoo-.git
cd FleetFlow-odoo-
```

### 2. Start PostgreSQL

Using Docker (recommended):

```bash
docker run -d --name fleetflow-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fleetflow \
  -p 5432:5432 \
  postgres:15-alpine
```

Or use an existing PostgreSQL instance and update the connection string in step 3.

### 3. Set up the backend

```bash
cd fleetflow

# Create environment file
cp .env.example .env
# Edit .env if your PostgreSQL credentials differ

# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed sample data (6 vehicles, 5 drivers, trips, expenses)
npx prisma db seed
```

### 4. Start the backend

```bash
npm run dev
# ✅ FleetFlow running on port 3000
```

### 5. Set up and start the frontend

Open a **new terminal**:

```bash
cd fleetflow-ui

# Install dependencies
npm install

# Start development server
npm run dev
# ✅ Vite ready at http://localhost:5173
```

### 6. Open the app

Go to **http://localhost:5173** in your browser.

Login with the seeded admin account:

| Field | Value |
|-------|-------|
| Email | `admin@fleetflow.io` |
| Password | `password123` |

---

## How It Works

### State Machine (Core Concept)

FleetFlow is **state-driven**, not simple CRUD. Every entity has a status that controls what actions are allowed:

```
Vehicle:  AVAILABLE → ON_TRIP → AVAILABLE
          AVAILABLE → IN_SHOP → AVAILABLE
          AVAILABLE → RETIRED (permanent)

Driver:   AVAILABLE → ON_DUTY → AVAILABLE
          AVAILABLE → SUSPENDED → AVAILABLE

Trip:     DISPATCHED → COMPLETED
          DISPATCHED → CANCELLED
```

**Example workflow:**

1. **Dispatch a trip** — System validates: Is the vehicle AVAILABLE? Is the cargo within capacity? Is the driver AVAILABLE with a valid license? If all pass, vehicle moves to `ON_TRIP` and driver to `ON_DUTY` **atomically** (in a single database transaction).

2. **Complete the trip** — Vehicle returns to `AVAILABLE`, odometer updates, driver returns to `AVAILABLE`.

3. **Log maintenance** — Vehicle automatically moves to `IN_SHOP`. It **cannot** be dispatched until maintenance is marked complete.

4. **Track costs** — Every fuel fill-up and maintenance cost is recorded. Analytics calculates total cost and km/L efficiency per vehicle.

### API Endpoints

All endpoints require a JWT token (except auth and health):

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, get JWT token |
| GET | `/api/vehicles` | List all vehicles |
| POST | `/api/vehicles` | Create a vehicle |
| PATCH | `/api/vehicles/:id/retire` | Retire a vehicle |
| GET | `/api/drivers` | List all drivers |
| POST | `/api/drivers` | Create a driver |
| GET | `/api/drivers/compliance/:id` | Check driver compliance |
| GET | `/api/drivers/performance/:id` | Get driver trip stats |
| POST | `/api/trips/dispatch` | Dispatch a new trip |
| POST | `/api/trips/complete` | Complete a trip |
| POST | `/api/trips/cancel` | Cancel a trip |
| GET | `/api/trips` | List trips (filter by status) |
| POST | `/api/maintenance/log` | Log maintenance (auto-blocks vehicle) |
| POST | `/api/maintenance/complete` | Release vehicle from maintenance |
| GET | `/api/maintenance/history` | Maintenance history |
| POST | `/api/expenses/fuel` | Log fuel expense |
| GET | `/api/expenses/cost/:vehicleId` | Total operational cost |
| GET | `/api/expenses/efficiency/:vehicleId` | Fuel efficiency (km/L) |
| GET | `/api/dashboard/stats` | Fleet KPIs |
| GET | `/api/analytics/fleet` | Per-vehicle analytics report |
| GET | `/api/analytics/export/csv` | Download CSV report |
| GET | `/api/health` | Health check (no auth) |

---

## Running Tests

```bash
cd fleetflow
npm test
```

This runs **90 tests** across 6 test files:

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `api-integration.test.js` | 46 | Full API walkthrough — auth, vehicles, drivers, trips, maintenance, expenses, analytics |
| `dispatch.test.js` | 13 | Trip dispatch/complete/cancel validation |
| `maintenance.test.js` | 7 | Maintenance logging and vehicle blocking |
| `expense.test.js` | 7 | Fuel logging, cost aggregation, efficiency calculation |
| `auth.test.js` | 8 | Registration, login, password validation |
| `vehicle-driver.test.js` | 9 | CRUD + compliance + performance |

Read `tests/api-integration.test.js` as a **guided walkthrough** — each test is commented to explain what the application does and why.

---

## Docker Deployment

To run the full stack with Docker Compose:

```bash
# From the project root
docker compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **Backend API** on port 3000
- **Frontend (Nginx)** on port 8080

---

## Seeded Accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@fleetflow.io` | `password123` | ADMIN |
| `dispatch@fleetflow.io` | `password123` | DISPATCHER |
| `viewer@fleetflow.io` | `password123` | VIEWER |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/fleetflow` | PostgreSQL connection string |
| `JWT_SECRET` | `fleetflow-secret-key-change-in-prod` | Secret for signing JWT tokens |
| `PORT` | `3000` | Backend server port |

---

## License

ISC
