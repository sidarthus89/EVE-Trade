import { pool } from '../db.js';
import {
    fetchAllRegions,
    fetchRegionDetails,
    fetchStationsInRegion
} from '../utils/esiApi.js';

/**
 * Sync regions with active markets from ESI
 * Runs: Daily (every 24 hours)
 */
export async function syncRegions() {
    console.log('\n[SYNC] Starting regions sync...');
    const startTime = Date.now();

    try {
        // Update sync status
        await pool.query(
            `INSERT INTO sync_status (sync_type, status, last_sync) 
             VALUES ('regions', 'running', NOW()) 
             ON DUPLICATE KEY UPDATE status = 'running', last_sync = NOW()`
        );

        // Fetch all region IDs from ESI
        const regionIds = await fetchAllRegions();
        console.log(`[SYNC] Found ${regionIds.length} total regions`);

        let processedCount = 0;
        const tradeableRegions = [];

        // Filter for k-space regions with markets (exclude wormholes)
        for (const regionId of regionIds) {
            if (regionId >= 11000000) {
                continue; // Skip wormhole space
            }

            const regionDetails = await fetchRegionDetails(regionId);

            // Check if region has stations (indicates active market)
            const stations = await fetchStationsInRegion(regionId);

            if (stations.length > 0) {
                tradeableRegions.push({
                    regionId,
                    regionName: regionDetails.name,
                    stationCount: stations.length
                });
            }

            processedCount++;
            if (processedCount % 10 === 0) {
                console.log(`[SYNC] Processed ${processedCount}/${regionIds.length} regions...`);
            }
        }

        console.log(`[SYNC] Found ${tradeableRegions.length} tradeable regions`);

        // Insert or update regions in database
        for (const region of tradeableRegions) {
            await pool.query(
                `INSERT INTO regions (region_id, region_name, station_count, last_updated)
                 VALUES (?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE 
                    region_name = VALUES(region_name),
                    station_count = VALUES(station_count),
                    last_updated = NOW()`,
                [region.regionId, region.regionName, region.stationCount]
            );
        }

        // Update sync status
        await pool.query(
            `UPDATE sync_status 
             SET status = 'completed', records_processed = ?, error_message = NULL
             WHERE sync_type = 'regions'`,
            [tradeableRegions.length]
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[SYNC] ✓ Regions sync completed in ${duration}s`);
        console.log(`[SYNC] Processed ${tradeableRegions.length} tradeable regions\n`);

        return { success: true, count: tradeableRegions.length };
    } catch (error) {
        console.error('[SYNC] ✗ Regions sync failed:', error.message);

        await pool.query(
            `UPDATE sync_status 
             SET status = 'failed', error_message = ?
             WHERE sync_type = 'regions'`,
            [error.message]
        );

        return { success: false, error: error.message };
    }
}

// Run immediately if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    await syncRegions();
    process.exit(0);
}
