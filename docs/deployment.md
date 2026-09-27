# SaathCare — Production Deployment & Cloud Infrastructure

## 1. Production Architecture Overview

SaathCare is configured for high availability across modern cloud platforms:

- **Frontend**: **Vercel** (React 18 Single Page Application on global CDN edge).
- **Backend**: **Render** (Node.js Web Service with HTTPS & WebSocket support).
- **Database**: **MongoDB Atlas** (Managed replica set with automated backups).

```text
React / Vite Frontend (Vercel Global CDN)
            │
            ▼ (HTTPS / WSS with Cross-Origin Credentials)
Node.js Express Backend (Render Web Service)
            │
            ▼
MongoDB Atlas (Managed Database Replica Set)
```

---

## 2. Environment Variables Checklist

### Backend Environment Variables (`Render Dashboard` / `server/.env`):
```env
# Runtime Environment
NODE_ENV=production
PORT=5000

# Client Application URL (For CORS Whitelist & Invite Links)
CLIENT_URL=https://saathcare.vercel.app

# Database Connection (MongoDB Atlas)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/saathcare?retryWrites=true&w=majority

# JWT Authentication Secrets (Generate 64-char hex strings)
JWT_ACCESS_SECRET=<secure-random-64-char-string>
JWT_REFRESH_SECRET=<secure-random-64-char-string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=7

# Cross-Domain Cookie Configuration (Required for Vercel <-> Render)
COOKIE_SECURE=true
COOKIE_SAME_SITE=none

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200

# Background Job Configuration
MISSED_TASK_CRON_SCHEDULE="*/5 * * * *"
MISSED_TASK_JOB_ENABLED=true

# Email Service Configuration (mock | smtp | gmail)
EMAIL_PROVIDER=mock
EMAIL_FROM=SaathCare <noreply@saathcare.org>

# Gmail OAuth2 Settings (When EMAIL_PROVIDER=gmail)
GMAIL_USER=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=

# Generic SMTP Settings (When EMAIL_PROVIDER=smtp)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# File Storage Configuration (local | s3)
STORAGE_PROVIDER=local

# AWS S3 Storage (Required when STORAGE_PROVIDER=s3)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=saathcare-receipts-prod
```

### Frontend Environment Variables (`Vercel Dashboard` / `client/.env.production`):
```env
VITE_API_URL=https://saathcare-server.onrender.com
VITE_SOCKET_URL=https://saathcare-server.onrender.com
```

---

## 3. Deployment Step-by-Step

### A. Database (MongoDB Atlas)
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a free M0 cluster or production dedicated cluster.
3. In **Network Access**, add `0.0.0.0/0` (allow access from anywhere) so Render container instances can connect dynamically.
4. In **Database Access**, create a database user with `readWriteAnyDatabase` or `readWrite` on `saathcare`.
5. Under **Deployment > Database**, click **Connect > Drivers > Node.js** to copy your `MONGODB_URI`.

### B. Backend (Render)
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New + > Web Service** and connect your GitHub repository: `https://github.com/saurabhg4356/saathcare`.
3. Set the configuration:
   - **Name**: `saathcare-server`
   - **Region**: Closest to your users (e.g. Oregon or Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Under **Environment Variables**, add all production backend variables listed in Section 2.
5. Click **Create Web Service**.
6. Verify deployment by visiting: `https://<your-render-domain>/health` and `https://<your-render-domain>/ready`.

### C. Frontend (Vercel)
1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **Add New... > Project** and import `https://github.com/saurabhg4356/saathcare`.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your Render backend URL (`https://saathcare-server.onrender.com`)
   - `VITE_SOCKET_URL`: Your Render backend URL (`https://saathcare-server.onrender.com`)
5. Click **Deploy**.
6. After Vercel deploys, copy the production URL (e.g. `https://saathcare.vercel.app`) and update `CLIENT_URL` in your Render backend settings so CORS permits authenticated requests.

---

## 4. Automated CI/CD GitHub Actions Deployment

The repository includes [.github/workflows/deploy.yml](file:///c:/SaathCare/.github/workflows/deploy.yml) for automated deployments on push to `main`:

To enable automatic pipeline triggers, configure the following secrets in **GitHub > Repository Settings > Secrets and variables > Actions**:

1. `RENDER_DEPLOY_HOOK_URL`: Copied from **Render Web Service > Settings > Deploy Hook**.
2. `VERCEL_TOKEN`: Generated in **Vercel Account Settings > Tokens**.
3. `VERCEL_ORG_ID`: Found in `client/.vercel/project.json` or Vercel Team settings.
4. `VERCEL_PROJECT_ID`: Found in Vercel Project settings.

---

## 5. Local & VPS Deployment via Docker Compose

To run the complete production-like stack locally or on a Linux VPS:
```bash
# Clone repository
git clone https://github.com/saurabhg4356/saathcare.git
cd saathcare

# Start all 3 services (Client + Server + MongoDB)
docker compose up -d --build

# View container logs
docker compose logs -f

# Verify containers are running
docker compose ps
```

Services will be accessible at:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/health`
- **Readiness Check**: `http://localhost:5000/ready`
- **MongoDB**: `localhost:27017`
