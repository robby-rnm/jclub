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

**Admin Features:**
- Dashboard - Match overview
- Stats - Analytics (total matches, clubs, users)
- Matches - Full CRUD (create, edit, publish, delete)
- Clubs - Full CRUD
- Users - View users from club creators

**Login Credentials:**
- Email: robby.juli@gmail.com
- Password: 123456

### 4. Mobile App
Navigate to `mobile`:
```bash
cd mobile
npm install
npx expo start
# Scan QR code with Expo Go
```

## Deployment (Production)

This guide covers deploying the Go backend to a Linux server (e.g., Ubuntu).

### 1. Environment Setup
Create a `.env` file in the production directory (e.g., `/opt/jclub`):
```bash
DATABASE_URL=postgres://user:password@localhost:5432/jclub?sslmode=disable
PORT=8080
JWT_SECRET=your_production_secret
# Add Google/Facebook client IDs if using OAuth
```

### 2. Build the Application
On your local machine (or build server), compile the binary for Linux:
```bash
cd backend
GOOS=linux GOARCH=amd64 go build -o jclub-api ./cmd/api
```
Copy the `jclub-api` binary and `.env` to your server (e.g., via `scp`).

### 3. Systemd Service
Create a service file to keep the app running in the background.
File: `/etc/systemd/system/jclub.service`

```ini
[Unit]
Description=JClub API Service
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/jclub
ExecStart=/opt/jclub/jclub-api
Restart=always
EnvironmentFile=/opt/jclub/.env

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable jclub
sudo systemctl start jclub
sudo systemctl status jclub
```

### 4. Nginx Reverse Proxy
Install Nginx and configure it to forward traffic to the Go app.
File: `/etc/nginx/sites-available/jclub.conf`

```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/jclub.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL (Optional)
Secure your API with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## API Endpoints
- `POST /api/login`: Authenticate user
- `GET /api/matches`: List matches
- `POST /api/matches`: Create match (Admin)
- `POST /api/bookings`: Join match
- `DELETE /api/bookings/:id`: Cancel booking
