# JClub Admin Dashboard

Admin dashboard untuk mengelola aplikasi JClub (reservasi futsal/sepak bola).

## 🚀 Cara Menjalankan

### Development Mode

```bash
cd web/admin
npm install
npm run dev
```

Akses: http://localhost:5173

### Production Build

```bash
cd web/admin
npm run build
npm run preview --port 5173 --host
```

## 🔧 Deployment

### Build untuk Production

```bash
npm run build
```

Output ada di folder `dist/`

### Deploy ke Server

1. **Build terlebih dahulu:**
```bash
npm run build
```

2. **Serve folder `dist/` dengan web server (nginx, apache, dll)**

### Contoh dengan Nginx

```nginx
server {
    listen 80;
    server_name admin.jclub.com;
    
    root /path/to/jclub/web/admin/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy ke API
    location /api {
        proxy_pass http://localhost:8080;
    }
}
```

### Docker Deployment

```dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

## 📱 Kebutuhan

- Node.js 18+
- npm atau yarn
- Backend API running di port 8080

## 🔗 Link Terkait

- **Mobile App**: `/mobile` (Expo/React Native)
- **Backend API**: `/backend` (Go + PostgreSQL)
- **Main README**: `/README.md`

## 📋 Fitur

| Menu | Deskripsi |
|------|-----------|
| Dashboard | Ringkasan matches |
| Stats | Analytics - Total matches, clubs, users |
| Matches | CRUD lengkap match |
| Clubs | CRUD club |
| Users | Lihat users |
