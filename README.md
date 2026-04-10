# WheelsEye — Freight Tracking System

Full-stack freight tracking platform built with **React + NestJS + Sequelize + MySQL**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Zustand, Socket.io-client, Leaflet |
| Backend | NestJS, Sequelize ORM, MySQL, WebSockets (Socket.io), JWT |
| Notifications | WhatsApp Business API, SMS (MSG91), Firebase Push |
| Payments | Razorpay |
| Maps | Leaflet + OpenStreetMap |
| Documents | PDFKit, ExcelJS |

## Project Structure

```
wheelseye/
├── backend/          # NestJS API
│   └── src/
│       ├── modules/
│       │   ├── auth/
│       │   ├── shipments/
│       │   ├── vehicles/
│       │   ├── drivers/
│       │   ├── gps/
│       │   ├── alerts/
│       │   ├── billing/
│       │   ├── documents/
│       │   └── reports/
│       ├── common/
│       └── database/
└── frontend/         # React SPA
    └── src/
        ├── components/
        ├── pages/
        ├── hooks/
        ├── services/
        └── store/
```

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in DB credentials
npm run migration:run
npm run seed
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`.

## Modules

- **Auth** — JWT access/refresh tokens, OTP login via phone
- **Shipments** — Full lifecycle: inquiry → booking → dispatch → in-transit → delivered
- **GPS** — Real-time WebSocket location feed, geofence engine, route deviation detection
- **Vehicles** — Fleet registry, document expiry, maintenance scheduler
- **Drivers** — KYC, licence tracking, safety score, trip history
- **Alerts** — Configurable rule engine: idle, deviation, overspeed, geofence
- **Billing** — GST-compliant invoicing, Razorpay integration, payment reconciliation
- **Documents** — e-Bilty, e-POD, e-way bill, PDF/Excel export
- **Reports** — OTDR, lane performance, carrier scorecard, executive summary

## API Base URL

```
http://localhost:3000/api/v1
```

## WebSocket

```
ws://localhost:3000/gps
```
