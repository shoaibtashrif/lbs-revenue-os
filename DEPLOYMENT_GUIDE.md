# 🚢 Production Deployment Guide — lbs. Revenue OS

This guide explains how to deploy and run **lbs. Revenue OS** on any remote server (Ubuntu / Debian VPS, AWS EC2, DigitalOcean, Hetzner, or Vercel).

---

## 🛠 Option 1: Direct Node.js / PM2 Deployment on Ubuntu Server (Recommended for VPS)

### Step 1: Install Node.js & pnpm on the Server
Connect to your remote server via SSH and run:
```bash
# Update server packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 or v20) & pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm install -g pnpm pm2
```

### Step 2: Clone Codebase & Install Dependencies
```bash
git clone <your-repository-url> lbs-revenue-os
cd lbs-revenue-os
pnpm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `apps/web/.env.local`:
```bash
cp .env.example apps/web/.env.local
nano apps/web/.env.local
```

Ensure your `.env.local` includes:
```env
NEXTAUTH_SECRET="your-production-secret-key-32-chars"
NEXTAUTH_URL="https://your-domain.com" # or http://YOUR_SERVER_IP:3000

# Gmail SMTP
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
EMAIL_USER="shoaib.tashrif@gmail.com"
EMAIL_PASSWORD="fmrntnzbpmvhskbd"
EMAIL_FROM="lbs. Distribution <shoaib.tashrif@gmail.com>"

# Google Sheets Webhook
GOOGLE_SHEET_WEBHOOK_URL="https://script.google.com/macros/s/AKfycbw-cb48qWW4ka33aS4JLcCnXMJJEP-K7MJi8nsWYQ1VYLd4utn5UvZC3EKCy952Y71czQ/exec"
GOOGLE_SHEET_ID="1RcXNKH4CthEJK1miO1_s7-5ocesagpCBaQx5pmj_p34"

APP_ENV="production"
MOCK_NABIS="true"
```

### Step 4: Build & Start with PM2
```bash
cd apps/web
pnpm build

# Start process with PM2 for 24/7 background uptime
pm2 start pnpm --name "lbs-web" -- start --port 3000
pm2 save
pm2 startup
```

### Step 5: (Optional) Nginx Reverse Proxy & SSL (HTTPS)
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Create `/etc/nginx/sites-available/lbs`:
```nginx
server {
    server_name your-domain.com; # or YOUR_SERVER_IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable site and get SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/lbs /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🐳 Option 2: Docker & Docker Compose Deployment

If your server has Docker installed, run:

```bash
# 1. Start Postgres & Redis containers
docker compose up -d

# 2. Build & run production container
cd apps/web
docker build -t lbs-web .
docker run -d -p 3000:3000 --env-file .env.local --name lbs-app lbs-web
```

---

## 🔍 Useful PM2 Commands for Server Management

| Command | Action |
|---|---|
| `pm2 status` | Check status of running app |
| `pm2 logs lbs-web` | View live server logs & email dispatches |
| `pm2 restart lbs-web` | Restart application after code updates |
| `pm2 stop lbs-web` | Stop server |
