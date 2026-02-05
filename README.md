# Reserve Game

A Reservation Management System for Futsal/Soccer games.

## Logic Overview
- **Quota**: 27 Players (14 Front, 13 Back) + 3 Goalkeepers.
- **Waitlist**: Automatic promotion when a confirmed player cancels.
- **Platforms**:
  - **Backend**: Go (Golang) + PostgreSQL
  - **Admin**: React + Vite
  - **Mobile**: React Native + Expo

## Prerequisites
- Go 1.21+
- Node.js & NPM
- PostgreSQL (ensure running on localhost:5432)
- Expo Go App (for mobile testing)

## getting Started

### 1. Database Setup
Ensure PostgreSQL is running and create the database:
```sql
CREATE DATABASE reserve_game;
```
Check `backend/.env` for credentials.

### 2. Backend (API)
Start the Go server:
```bash
cd backend
go run ./cmd/api
# Server runs on http://localhost:8080
```

### 3. Admin Web App
Navigate to `web/admin`:
```bash
cd web/admin
npm install
npm run dev
# Dashboard available at http://localhost:5173
```
- **Login**: Use simulated login or configure OAuth in `backend/internal/handlers/handlers.go`.

### 4. Mobile App
Navigate to `mobile`:
```bash
cd mobile
npm install
npx expo start
# Scan QR code with Expo Go
```

## API Endpoints
- `POST /api/login`: Authenticate user
- `GET /api/matches`: List matches
- `POST /api/matches`: Create match (Admin)
- `POST /api/bookings`: Join match
- `DELETE /api/bookings/:id`: Cancel booking
