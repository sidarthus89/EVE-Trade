import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { testConnection, closePool } from './db.js';
import { startScheduler, stopScheduler } from './jobs/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Parse allowed origins from environment
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'];

// Middleware
app.use(compression());
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes (to be implemented)
app.get('/api', (req, res) => {
    res.json({
        message: 'EVE Data Site API',
        version: '1.0.0',
        endpoints: {
            regions: '/api/regions',
            stations: '/api/stations/:regionId',
            marketOrders: '/api/market/:typeId/:regionId',
            marketHistory: '/api/market/history/:typeId/:regionId',
            itemTree: '/api/items/tree',
            itemDetails: '/api/items/:typeId'
        }
    });
});

// Import route modules
import regionsRouter from './routes/regions.js';
import stationsRouter from './routes/stations.js';
import marketRouter from './routes/market.js';
import itemsRouter from './routes/items.js';
// import authRouter from './routes/auth.js'; // TODO: Fix auth router - causes app crash

// Mount API routes
app.use('/api/regions', regionsRouter);
app.use('/api/stations', stationsRouter);
app.use('/api/market', marketRouter);
app.use('/api/items', itemsRouter);
// app.use('/api/auth', authRouter); // TODO: Implement structures auth later

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error(err.stack);

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
async function startServer() {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('Failed to connect to database. Server not started.');
            process.exit(1);
        }

        // Start Express server
        app.listen(PORT, () => {
            console.log(`\n🚀 EVE Data Site API running on port ${PORT}`);
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   CORS Origins: ${allowedOrigins.join(', ')}`);
            console.log(`   Health: http://localhost:${PORT}/health`);
            console.log(`   API: http://localhost:${PORT}/api\n`);

            // Start data sync scheduler
            if (process.env.ENABLE_SCHEDULER !== 'false') {
                startScheduler();
            } else {
                console.log('[SCHEDULER] Disabled via ENABLE_SCHEDULER=false\n');
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

// Graceful shutdown
const shutdown = async (signal) => {
    console.log(`\n${signal} received. Closing server gracefully...`);

    try {
        stopScheduler();
        await closePool();
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error.message);
        process.exit(1);
    }
}; process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the server
startServer();
