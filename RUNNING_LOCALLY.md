# FleetFlow - Local Development & Deployment Guide

This guide explains how to set up, run, and develop the FleetFlow project on your own PC. It covers all requirements for both backend (API) and frontend (UI), including database setup, environment variables, and Docker usage.

---

## 1. Prerequisites

- **Node.js** (v18+ recommended)
- **npm** (comes with Node.js)
- **Docker** & **Docker Compose** (for easy DB setup & full-stack deployment)
- **Git**

---

## 2. Clone the Repository

```bash
git clone https://github.com/mittal122/FleetFlow-odoo-.git
cd FleetFlow-odoo-
```

---

## 3. Environment Variables

Copy the example environment files and edit as needed:

```bash
cp fleetflow/.env.example fleetflow/.env
cp fleetflow-ui/.env.example fleetflow-ui/.env
```

- Edit `fleetflow/.env` to set your database URL, JWT secret, etc.
- Edit `fleetflow-ui/.env` to set the API URL (usually `http://localhost:4000` for local dev).

---

## 4. Start the Database (PostgreSQL)

The easiest way is with Docker Compose:

```bash
docker compose up -d db
```

This will start a local PostgreSQL instance as defined in `docker-compose.yml`.

---

## 5. Backend Setup (API)

```bash
cd fleetflow
npm install
npx prisma migrate deploy   # Run DB migrations
npm run dev                # Start backend on http://localhost:4000
```

- The API will be available at `http://localhost:4000`
- Prisma Studio (optional): `npx prisma studio`

---

## 6. Frontend Setup (UI)

In a new terminal:

```bash
cd fleetflow-ui
npm install
npm run dev                # Start frontend on http://localhost:5173
```

- The UI will be available at `http://localhost:5173`
- It will connect to the backend API at the URL set in `.env`

---

## 7. Full-Stack with Docker Compose (Optional)

To run everything (API, UI, DB, Nginx) in Docker:

```bash
docker compose up --build
```

- The app will be available at `http://localhost` (Nginx reverse proxy)
- Stop with `docker compose down`

---

## 8. Running Tests

- **Backend:**
  ```bash
  cd fleetflow
  npm test
  ```
- **Frontend:**
  ```bash
  cd fleetflow-ui
  npm test
  ```

---

## 9. Useful Commands

- **Stop all Docker containers:**
  ```bash
  docker compose down
  ```
- **View logs:**
  ```bash
  docker compose logs -f
  ```
- **Reset database:**
  ```bash
  cd fleetflow
  npx prisma migrate reset
  ```

---

## 10. Troubleshooting

- Check `.env` files for correct settings
- Ensure ports 4000 (API), 5173 (UI), and 5432 (DB) are free
- Use `docker compose ps` to check running containers
- For DB issues, try `docker compose restart db`

---

## 11. Production Deployment

- Use `docker compose -f docker-compose.prod.yml up --build` for production
- Set strong secrets in `.env` files
- Use a real SMTP server for email features (if enabled)

---

## 12. Documentation

- See `README.md` for API docs, features, and more details
- For questions, open an issue on GitHub

---

Enjoy using FleetFlow!
