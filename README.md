# Delta Downtime Dashboard

Industrial downtime monitoring and analytics platform for a Delta DVP‑12SE production line, using Node‑RED as an edge gateway, a NestJS backend, a MySQL database, and a Next.js dashboard frontend.

## Overview

This project collects shutdown events and production data from a Delta PLC, stores them in MySQL, and exposes web dashboards to analyze stop frequency, total downtime, causes, and production performance.

## Tech Stack

- PLC: Delta DVP‑12SE (Modbus TCP)
- Edge: Node‑RED (Modbus polling, edge logic)
- Backend: NestJS (REST API, business logic, MySQL access)
- Database: MySQL (production, stops, causes, configuration)
- Frontend: Next.js (React dashboard UI)
