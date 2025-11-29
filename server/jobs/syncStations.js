import { pool } from '../db.js';
import { fetchStationsInRegion } from '../utils/esiApi.js';

/**
 * Sync NPC stations from ESI
 * Runs: Every 3 months (90 days)
 */
export async function syncStations() {
    console.log('\n[SYNC] Starting stations sync...');
    const startTime = Date.now();

    try {
        // Update sync status
        await pool.query(
            `INSERT INTO sync_status (sync_type, status, last_sync) 
             VALUES ('stations', 'running', NOW()) 
             ON DUPLICATE KEY UPDATE status = 'running', last_sync = NOW()`
        );

        // Get all regions from database
        const [regions] = await pool.query(`SELECT region_id, region_name FROM regions`);
        console.log(`[SYNC] Fetching stations for ${regions.length} regions...`);

        let totalStations = 0;

        for (const region of regions) {
            console.log(`[SYNC] Processing region: ${region.region_name}...`);

            const stations = await fetchStationsInRegion(region.region_id);

            // Insert or update stations
            for (const station of stations) {
                await pool.query(
                    `INSERT INTO stations (station_id, station_name, system_id, system_name, region_id, last_updated)
                     VALUES (?, ?, ?, ?, ?, NOW())
                     ON DUPLICATE KEY UPDATE 
                        station_name = VALUES(station_name),
                        system_name = VALUES(system_name),
                        last_updated = NOW()`,
                    [
                        station.stationID,
                        station.stationName,
                        station.systemID,
                        station.systemName,
                        station.regionID
                    ]
                );
            }

            totalStations += stations.length;
            console.log(`[SYNC] Added ${stations.length} stations from ${region.region_name}`);
        }

        // Update sync status
        await pool.query(
            `UPDATE sync_status 
             SET status = 'completed', records_processed = ?, error_message = NULL
             WHERE sync_type = 'stations'`,
            [totalStations]
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[SYNC] ✓ Stations sync completed in ${duration}s`);
        console.log(`[SYNC] Processed ${totalStations} total stations\n`);

        return { success: true, count: totalStations };
    } catch (error) {
        console.error('[SYNC] ✗ Stations sync failed:', error.message);

        await pool.query(
            `UPDATE sync_status 
             SET status = 'failed', error_message = ?
             WHERE sync_type = 'stations'`,
            [error.message]
        );

        return { success: false, error: error.message };
    }
}

// Run immediately if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    await syncStations();
    process.exit(0);
}
