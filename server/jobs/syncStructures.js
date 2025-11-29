import { pool } from '../db.js';
import { rateLimitedFetch } from '../utils/esiApi.js';

const ESI_BASE_URL = 'https://esi.evetech.net/latest';

/**
 * Get valid OAuth access token from database
 */
async function getAccessToken() {
    const [tokens] = await pool.query(
        `SELECT access_token, refresh_token, expires_at FROM esi_tokens 
         WHERE expires_at > NOW() 
         ORDER BY expires_at DESC 
         LIMIT 1`
    );

    if (tokens.length === 0) {
        throw new Error('No valid OAuth token found. Please authenticate at /api/auth/login');
    }

    return tokens[0].access_token;
}

/**
 * Fetch structure info with authentication
 */
async function fetchStructureInfo(structureId, accessToken) {
    const response = await fetch(`${ESI_BASE_URL}/universe/structures/${structureId}/`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch structure ${structureId}: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch all market structures (structures with active markets)
 */
async function fetchMarketStructures() {
    // Get all structures that appear in market data
    const [structures] = await pool.query(
        `SELECT DISTINCT location_id 
         FROM market_orders 
         WHERE location_id > 1000000000000`
    );

    return structures.map(s => s.location_id);
}

/**
 * Sync player structures from ESI
 * Runs: Weekly (every 7 days)
 */
export async function syncStructures() {
    console.log('\n[SYNC] Starting structures sync...');
    const startTime = Date.now();

    try {
        // Update sync status
        await pool.query(
            `INSERT INTO sync_status (sync_type, status, last_sync) 
             VALUES ('structures', 'running', NOW()) 
             ON DUPLICATE KEY UPDATE status = 'running', last_sync = NOW()`
        );

        // Get OAuth token
        const accessToken = await getAccessToken();
        console.log('[SYNC] ✓ Valid OAuth token found');

        // Get structure IDs from market orders
        const structureIds = await fetchMarketStructures();
        console.log(`[SYNC] Found ${structureIds.length} structures in market data`);

        if (structureIds.length === 0) {
            console.log('[SYNC] No structures to sync');
            await pool.query(
                `UPDATE sync_status 
                 SET status = 'completed', records_processed = 0
                 WHERE sync_type = 'structures'`
            );
            return { success: true, count: 0 };
        }

        let processed = 0;
        let failed = 0;

        // Fetch details for each structure
        for (const structureId of structureIds) {
            try {
                const structure = await fetchStructureInfo(structureId, accessToken);

                // Get system and region info
                const [systems] = await pool.query(
                    `SELECT region_id FROM stations WHERE system_id = ? LIMIT 1`,
                    [structure.solar_system_id]
                );

                const regionId = systems.length > 0 ? systems[0].region_id : null;

                await pool.query(
                    `INSERT INTO structures (structure_id, structure_name, owner_id, system_id, region_id, type_id, last_updated)
                     VALUES (?, ?, ?, ?, ?, ?, NOW())
                     ON DUPLICATE KEY UPDATE
                        structure_name = VALUES(structure_name),
                        owner_id = VALUES(owner_id),
                        system_id = VALUES(system_id),
                        region_id = VALUES(region_id),
                        type_id = VALUES(type_id),
                        last_updated = NOW()`,
                    [structureId, structure.name, structure.owner_id, structure.solar_system_id, regionId, structure.type_id]
                );

                processed++;
                console.log(`[SYNC] ✓ ${structure.name}`);

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (err) {
                console.error(`[SYNC] Failed structure ${structureId}:`, err.message);
                failed++;
            }
        }

        // Update sync status
        await pool.query(
            `UPDATE sync_status 
             SET status = 'completed', records_processed = ?
             WHERE sync_type = 'structures'`,
            [processed]
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[SYNC] ✓ Structures sync completed in ${duration}s - ${processed} synced, ${failed} failed\n`);

        return { success: true, count: processed, failed };
    } catch (error) {
        console.error('[SYNC] ✗ Structures sync failed:', error.message);

        await pool.query(
            `UPDATE sync_status 
             SET status = 'failed', error_message = ?
             WHERE sync_type = 'structures'`,
            [error.message]
        );

        return { success: false, error: error.message };
    }
}

// Run immediately if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    await syncStructures();
    process.exit(0);
}
