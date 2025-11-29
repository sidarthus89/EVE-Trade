# Deployment Guide for EVE Trade Site

## Current Setup

**Local Development:**
- Frontend: React + Vite (runs on `http://localhost:5173`)
- Backend: Node.js + Express (runs on `http://localhost:3000`)
- Frontend `.env` points to `http://localhost:3000/api`

**Production (VPS):**
- Repository: `https://github.com/sidarthus89/EVE-Trade.git`
- Deploys to: `/httpdocs/api/`
- Backend runs from: `/httpdocs/api/server/`
- Live API: `https://eve-trade.com/api/`

## Deployment Workflow

### 1. Local Development & Testing

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend  
npm run dev
```

Visit `http://localhost:5173` to test locally.

### 2. Commit & Push Changes

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

### 3. Automatic Deployment

Plesk automatically:
- Pulls latest code from GitHub
- Deploys to `/httpdocs/api/`

### 4. Post-Deployment (Manual Steps)

After push, you need to:

**A. Install Dependencies (if package.json changed):**
- SSH or use Plesk Terminal
- Run: `cd /httpdocs/api/server && npm install --production`

**B. Restart Node.js Application:**
- Option 1: In Plesk → Node.js → Click "Restart App"
- Option 2: SSH and run: `touch /httpdocs/tmp/restart.txt`

### 5. Verify Deployment

Test these endpoints:
- Health: `https://eve-trade.com/api/health`
- Regions: `https://eve-trade.com/api/regions`
- Market Tree: `https://eve-trade.com/api/items/tree`

## One-Time Plesk Configuration

### Git Repository Settings
- URL: `https://github.com/sidarthus89/EVE-Trade.git`
- Branch: `main`
- Deploy to: `/httpdocs/api`
- Mode: Automatic

### Node.js Settings
- Document root: `/httpdocs/api/server`
- Startup file: `index.js`
- Mode: Production
- Node version: 18.x or 25.x

### Environment Variables

Create `/httpdocs/api/server/.env` with:

```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=cits
DB_PASSWORD=your_password
DB_NAME=eve_trade_db

ALLOWED_ORIGINS=https://eve-trade.com,https://www.eve-trade.com

ESI_BASE_URL=https://esi.evetech.net/latest
ESI_USER_AGENT=EVE-Data-Site/1.0
ESI_RATE_LIMIT_DELAY=100

ENABLE_SCHEDULER=true
```

## Troubleshooting

### Backend not starting?

1. Check Node.js logs in Plesk
2. Verify document root is `/httpdocs/api/server`
3. Check `/httpdocs/api/server/node_modules/` exists
4. Verify `.env` file exists with correct values

### Dependencies missing?

```bash
# SSH into server
cd /httpdocs/api/server
npm install --production
```

### Changes not showing?

1. Verify Git deployed: Check `/httpdocs/api/` has latest files
2. Restart Node.js application
3. Clear browser cache

## Quick Commands

### Local Development
```bash
# Start backend
cd server && npm run dev

# Start frontend (new terminal)
npm run dev

# Run sync jobs
cd server
npm run sync:regions
npm run sync:stations
npm run sync:market-tree
```

### Production (via SSH)
```bash
# Install dependencies
cd /httpdocs/api/server && npm install --production

# Restart app
touch /httpdocs/tmp/restart.txt

# View logs
tail -f /httpdocs/logs/nodejs.log
```

## Future Enhancements

- Add webhook to auto-restart Node.js after Git deployment
- Build frontend and host static files separately
- Set up CI/CD pipeline for automated testing
