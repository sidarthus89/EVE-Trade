# EVE Online Trade Data Site

A full-stack web application for browsing and analyzing EVE Online market data in real-time. Built with React + Vite frontend and Node.js/Express backend, pulling live data from the EVE ESI API.

🌐 **Live Site:** https://eve-trade.com

## Features

- 🔥 **Real-Time Market Prices** - Live buy/sell orders from all regions
- 📊 **Price History** - Historical price data and trend analysis  
- 🌍 **Regional Comparison** - Compare prices across all 69 k-space regions
- 🎯 **Outlier Filtering** - Smart filtering to remove extreme outlier prices
- ⚡ **Major Trade Hubs** - Quick access to Jita, Amarr, Dodixie, Rens, Hek
- 📦 **Full Item Database** - Browse all tradeable items via market tree
- 🔄 **Automatic Updates** - Market data syncs every 5-10 minutes
- 🏪 **5000+ NPC Stations** - Complete station and region coverage

## Tech Stack

**Frontend:** React 18 • Vite • React Router • Recharts • CSS3

**Backend:** Node.js 25+ • Express • MySQL/MariaDB • Node-cron • ESI API

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL/MariaDB
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/EVE-Data-Site-VPS.git
cd EVE-Data-Site-VPS

# Install dependencies
npm install
cd server && npm install && cd ..

# Configure environment
cp .env.development .env
cp server/.env.example server/.env
# Edit server/.env with your database credentials

# Set up database
mysql -u your_user -p eve_trade_db < server/schema.sql

# Sync initial data
cd server
node jobs/syncRegions.js
node jobs/syncStations.js
node jobs/syncMarketTree.js
cd ..

# Start development servers
# Terminal 1:
cd server && npm run dev

# Terminal 2:
npm run dev
```

Visit http://localhost:5173

## Project Structure

```
├── src/                  # Frontend React application
│   ├── components/       # UI components (Header, MarketTree, etc.)
│   ├── pages/           # Pages (Home, Market)
│   ├── api/             # API client
│   └── styles/          # CSS files
├── server/              # Backend Node.js application
│   ├── routes/          # API endpoints
│   ├── jobs/            # Scheduled sync jobs
│   ├── migrations/      # Database migrations
│   └── utils/           # Utilities
└── public/              # Static assets
```

## Development Workflow

### Local Development

1. Work locally with both frontend and backend running
2. Frontend uses `http://localhost:3000/api` (from `.env`)
3. Make changes and test
4. Commit and push to GitHub

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

### Production Deployment via GitHub + Plesk

This project supports automatic deployment from GitHub to Plesk VPS.

#### 1. Push to GitHub
Every push to `main` branch triggers deployment.

#### 2. Configure Plesk (one-time setup)

**Git Deployment:**
- Git → Add Repository
- URL: `https://github.com/yourusername/EVE-Data-Site-VPS.git`
- Branch: `main`
- Path: `/httpdocs`
- Enable "Deploy automatically on push"

**Node.js Application:**
- Application mode: Production
- Document root: `/httpdocs/server`
- Startup file: `index.js`
- Node.js version: 18+ or 25+
- Add environment variables from `server/.env.example`

#### 3. Deploy
Push to GitHub → Plesk auto-deploys → Server restarts → Live!

## Environment Configuration

### Frontend

**`.env`** (local development - git ignored):
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**`.env.production`** (committed to git):
```env
VITE_API_BASE_URL=https://eve-trade.com/api
```

Vite automatically uses `.env.production` when building for production.

### Backend

**`server/.env`** (git ignored - create from example):
```env
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=eve_trade_db
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
ENABLE_SCHEDULER=true
```

For production VPS, update `ALLOWED_ORIGINS` to include your domain.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/regions` | List all regions |
| `GET /api/stations/:regionId` | Stations in region |
| `GET /api/market/orders/:typeId/:regionId` | Market orders |
| `GET /api/market/history/:typeId/:regionId` | Price history |
| `GET /api/items/tree` | Market tree structure |
| `GET /api/items/:typeId` | Item details |
| `GET /health` | Server health check |

## Database Schema

**Core Tables:**
- `regions` - Region data (69 k-space regions)
- `stations` - NPC stations (5000+)
- `market_groups` - Item categories
- `inventory_types` - All tradeable items
- `market_orders` - Live buy/sell orders
- `market_history` - Historical prices

**Optional Tables:**
- `structures` - Player Upwell structures
- `esi_tokens` - OAuth authentication tokens

## Scheduled Jobs

Automatic data synchronization via node-cron:

- **Market Orders** - Every 5-10 minutes (region-dependent)
- **Market History** - Daily
- **Market Tree** - Weekly
- **Regions/Stations** - Weekly

Configured in `server/jobs/scheduler.js`.

## Building for Production

```bash
# Build frontend
npm run build

# Output in dist/ folder - ready for static hosting
```

Deploy frontend to:
- Same VPS (serve from Plesk)
- GitHub Pages
- Netlify / Vercel
- Any static hosting

Update `ALLOWED_ORIGINS` in backend `.env` to include frontend URL.

## Contributing

This is an **open-source project**! Contributions welcome:

- 🐛 Report bugs via GitHub Issues
- 🔧 Submit pull requests
- 🍴 Fork for your own EVE projects
- 💡 Suggest features

## License

MIT License - Free to use and modify for your EVE Online projects.

## Resources

- [EVE Online ESI API](https://esi.evetech.net/ui/)
- [EVE Developers Portal](https://developers.eveonline.com/)
- [EVE Static Data Export](https://developers.eveonline.com/resource/resources)

## Acknowledgments

- **CCP Games** - EVE Online and ESI API
- **EVE Community** - For inspiration and market tools
- **React, Vite, Express** - Amazing open-source projects

---

**Fly safe! o7**

*Made with ❤️ for the EVE Online community*
