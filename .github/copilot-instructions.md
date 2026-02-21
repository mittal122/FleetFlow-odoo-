# FleetFlow — Copilot Instructions

## Architecture Overview

FleetFlow is a **modular fleet & logistics management system** with a clear backend/frontend split:

| Layer | Tech | Location |
|-------|------|----------|
| Backend API | Node.js + Express (ES modules) | `fleetflow/` |
| Database | PostgreSQL via Prisma v5 ORM | `fleetflow/prisma/schema.prisma` |
| Frontend | React + Vite | `fleetflow-ui/` |
| API Client | Axios → `http://localhost:3000/api` | `fleetflow-ui/src/api/client.js` |

### Core Domain Entities & State Machines

The system is **state-driven**, not CRUD. Five models with enum-controlled lifecycles:

- **Vehicle**: `AVAILABLE → ON_TRIP → AVAILABLE` or `AVAILABLE → IN_SHOP → AVAILABLE` or `→ RETIRED`
- **Driver**: `AVAILABLE → ON_DUTY → AVAILABLE` or `→ SUSPENDED`
- **Trip**: `DRAFT → DISPATCHED → COMPLETED / CANCELLED`
- **Maintenance**: logs that auto-move vehicles to `IN_SHOP`
- **Expense**: fuel/cost records tied to vehicles for analytics

Schema is in `fleetflow/prisma/schema.prisma`. All status transitions happen **atomically** via `prisma.$transaction()`.

## Backend — Service-Oriented Pattern

Business logic lives in **service files** (`fleetflow/src/services/`), NOT in route handlers. Routes are thin wrappers.

| Service | Key Rules |
|---------|-----------|
| `dispatch.service.js` | Validates vehicle availability, cargo capacity, driver compliance, license expiry. Uses transactions to lock vehicle+driver atomically. |
| `maintenance.service.js` | Auto-sets vehicle to `IN_SHOP` on log entry; `completeMaintenance` returns it to `AVAILABLE`. |
| `expense.service.js` | Aggregates fuel + maintenance costs; calculates `km/L` efficiency from completed trips. |
| `driver.service.js` | Compliance checks (license expiry, suspension), performance metrics (completion rate). |
| `vehicle.service.js` | CRUD + `retireVehicle` (permanent status change). |
| `dashboard.service.js` | Fleet-wide KPIs: active count, maintenance alerts, utilization rate. |
| `analytics.service.js` | Per-vehicle report: total cost, distance, fuel efficiency. |

**Pattern**: Always check entity status before mutations. Throw descriptive errors; route handlers catch and return 400.

## Developer Workflows

```bash
# Backend (from fleetflow/)
npm run dev          # nodemon on port 3000
npx prisma migrate dev --name <name>   # schema changes
npx prisma generate  # regenerate client after schema edits

# Frontend (from fleetflow-ui/)
npm run dev          # Vite dev server on port 5173
npm run build        # production build

# Database (Docker)
docker start fleetflow-pg   # PostgreSQL on port 5432
```

**Environment**: `fleetflow/.env` holds `DATABASE_URL` pointing to local PostgreSQL (`postgres:postgres@localhost:5432/fleetflow`).

## Frontend Structure

- `src/pages/` — one page per module: Dashboard, Vehicles, Drivers, Dispatch, Maintenance, Expenses, Analytics
- `src/api/client.js` — single Axios instance; all API calls go through this
- `src/App.jsx` — React Router with sidebar navigation (`NavLink` for active state)
- Styling: dark theme in `src/index.css`, no CSS framework

## Key Conventions

- **ES Modules** throughout (`"type": "module"` in package.json, `.js` extensions in imports)
- **Feature-based file organization**: `services/<domain>.service.js` + `routes/<domain>.routes.js`
- **Validation before mutation**: every service function validates entity existence and status before writes
- **Atomic transactions**: any operation touching multiple tables uses `prisma.$transaction()`
- **Error pattern**: services `throw new Error(message)` → routes catch and return `{ error: message }` with 400 status
- **No auth yet**: JWT planned but not implemented; all endpoints are open
