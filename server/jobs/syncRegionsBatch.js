import { pool } from '../db.js';
import {
    fetchAllRegions,
    fetchRegionDetails,
    fetchStationsInRegion
} from '../utils/esiApi.js';

/**
 * Sync regions with active markets from ESI - Batch Mode
 * Processes only 10 regions per run to avoid timeouts
 */
export async function syncRegionsBatch() {
    console.log('\n[SYNC] Starting regions batch sync...');
    const startTime = Date.now();

    try {
        // Get list of already synced regions
        const [existingRegions] = await pool.query(`SELECT region_id FROM regions`);
        const syncedIds = new Set(existingRegions.map(r => r.region_id));

        // Fetch all region IDs from ESI
        const regionIds = await fetchAllRegions();
        const kspaceRegions = regionIds.filter(id => id < 11000000);

        // Find regions not yet synced
        const toSync = kspaceRegions.filter(id => !syncedIds.has(id)).slice(0, 10);

        if (toSync.length === 0) {
            console.log('[SYNC] All regions already synced!');
            return { success: true, count: 0, message: 'All regions synced' };
        }

        console.log(`[SYNC] Processing ${toSync.length} regions...`);
        let processed = 0;

        for (const regionId of toSync) {
            try {
                console.log(`[SYNC] Fetching region ${regionId}...`);
                const regionDetails = await fetchRegionDetails(regionId);
                console.log(`[SYNC] Got details for ${regionDetails.name}, checking stations...`);
                const stations = await fetchStationsInRegion(regionId);

                console.log(`[SYNC] Found ${stations.length} stations for ${regionDetails.name}`);

                // Add region even if it has 0 stations
                await pool.query(
                    `INSERT INTO regions (region_id, region_name, station_count, last_updated)
                     VALUES (?, ?, ?, NOW())
                     ON DUPLICATE KEY UPDATE 
                        region_name = VALUES(region_name),
                        station_count = VALUES(station_count),
                        last_updated = NOW()`,
                    [regionId, regionDetails.name, stations.length]
                );
                processed++;
                console.log(`[SYNC] ✓ ${regionDetails.name} (${stations.length} stations) - ADDED`);
            } catch (err) {
                console.error(`[SYNC] Failed region ${regionId}:`, err.message);
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[SYNC] ✓ Batch completed in ${duration}s - ${processed} regions added\n`);

        const remaining = kspaceRegions.length - (syncedIds.size + processed);
        return {
            success: true,
            count: processed,
            remaining,
            message: `${processed} regions synced. ${remaining} remaining.`
        };
    } catch (error) {
        console.error('[SYNC] ✗ Batch sync failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Run immediately if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    await syncRegionsBatch();
    process.exit(0);
}
