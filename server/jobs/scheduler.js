import cron from 'node-cron';
import { syncRegions } from './syncRegions.js';
import { syncStations } from './syncStations.js';
import { syncStructures } from './syncStructures.js';
import { syncMarketTree } from './syncMarketTree.js';
import { syncMarketOrders } from './syncMarketOrders.js';
import { pool } from '../db.js';
import { POPULAR_REGIONS } from '../utils/esiApi.js';

/**
 * Job Scheduler for ESI Data Synchronization
 * 
 * Schedules:
 * - Regions: Daily at 3 AM
 * - Stations: Every 3 months (90 days)
 * - Structures: Weekly on Sunday at 4 AM
 * - Market Tree: Every 3 months (90 days)
 * - Market Orders (Popular): Every 5 minutes
 * - Market Orders (Standard): Every 10 minutes
 */

let isInitialized = false;

// Track last sync times for quarterly jobs
const lastSync = {
    stations: null,
    marketTree: null
};

export function startScheduler() {
    if (isInitialized) {
        console.log('[SCHEDULER] Already running');
        return;
    }

    console.log('\n[SCHEDULER] Starting data sync scheduler...\n');

    // Regions: Daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
        console.log('[SCHEDULER] Running daily regions sync...');
        await syncRegions();
    });

    // Stations: Every 3 months (check daily, run if 90+ days since last sync)
    cron.schedule('0 4 * * *', async () => {
        const [rows] = await pool.query(
            `SELECT last_sync FROM sync_status WHERE sync_type = 'stations'`
        );

        if (rows.length === 0 || !rows[0].last_sync) {
            console.log('[SCHEDULER] Running initial stations sync...');
            await syncStations();
            return;
        }

        const daysSinceSync = (Date.now() - new Date(rows[0].last_sync).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSync >= 90) {
            console.log('[SCHEDULER] Running quarterly stations sync (90+ days since last sync)...');
            await syncStations();
        }
    });

    // Structures: Weekly on Sunday at 4 AM
    cron.schedule('0 4 * * 0', async () => {
        console.log('[SCHEDULER] Running weekly structures sync...');
        await syncStructures();
    });

    // Market Tree: Every 3 months (check daily, run if 90+ days since last sync)
    cron.schedule('0 5 * * *', async () => {
        const [rows] = await pool.query(
            `SELECT last_sync FROM sync_status WHERE sync_type = 'market_groups'`
        );

        if (rows.length === 0 || !rows[0].last_sync) {
            console.log('[SCHEDULER] Running initial market tree sync...');
            await syncMarketTree();
            return;
        }

        const daysSinceSync = (Date.now() - new Date(rows[0].last_sync).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSync >= 90) {
            console.log('[SCHEDULER] Running quarterly market tree sync (90+ days since last sync)...');
            await syncMarketTree();
        }
    });

    // Market Orders (Popular Regions): Every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log('[SCHEDULER] Running market orders sync for popular regions...');
        for (const regionId of POPULAR_REGIONS) {
            await syncMarketOrders(regionId, true);
        }
    });

    // Market Orders (Standard Regions): Every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
        console.log('[SCHEDULER] Running market orders sync for standard regions...');

        // Get all non-popular regions
        const [regions] = await pool.query(`SELECT region_id FROM regions`);
        const standardRegions = regions.filter(r => !POPULAR_REGIONS.includes(r.region_id));

        for (const region of standardRegions) {
            await syncMarketOrders(region.region_id, false);
        }
    });

    isInitialized = true;
    console.log('[SCHEDULER] ✓ All sync jobs scheduled\n');
    console.log('[SCHEDULER] Schedule:');
    console.log('  - Regions: Daily at 3:00 AM');
    console.log('  - Stations: Every 90 days (checked daily at 4:00 AM)');
    console.log('  - Structures: Weekly on Sunday at 4:00 AM');
    console.log('  - Market Tree: Every 90 days (checked daily at 5:00 AM)');
    console.log('  - Market Orders (Popular): Every 5 minutes');
    console.log('  - Market Orders (Standard): Every 10 minutes\n');
}

export function stopScheduler() {
    if (!isInitialized) {
        console.log('[SCHEDULER] Not running');
        return;
    }

    cron.getTasks().forEach(task => task.stop());
    isInitialized = false;
    console.log('[SCHEDULER] ✓ Stopped all sync jobs\n');
}

// Run immediately if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    startScheduler();

    // Keep process alive
    process.on('SIGINT', () => {
        console.log('\n[SCHEDULER] Shutting down...');
        stopScheduler();
        process.exit(0);
    });
}
