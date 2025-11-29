import { pool } from '../db.js';
import {
    fetchMarketGroups,
    fetchMarketGroupDetails,
    fetchTypeInfo
} from '../utils/esiApi.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sync market groups and item types from ESI
 * Runs: Every 3 months (90 days)
 */
export async function syncMarketTree() {
    console.log('\n[SYNC] Starting market tree sync...');
    const startTime = Date.now();

    try {
        // Update sync status
        await pool.query(
            `INSERT INTO sync_status (sync_type, status, last_sync) 
             VALUES ('market_groups', 'running', NOW()) 
             ON DUPLICATE KEY UPDATE status = 'running', last_sync = NOW()`
        );

        // Fetch all market group IDs
        const groupIds = await fetchMarketGroups();
        console.log(`[SYNC] Found ${groupIds.length} market groups`);

        let groupsProcessed = 0;
        let typesProcessed = 0;
        const marketTree = {};

        // Process each market group
        for (const groupId of groupIds) {
            const groupDetails = await fetchMarketGroupDetails(groupId);

            // Insert or update market group
            await pool.query(
                `INSERT INTO market_groups 
                 (market_group_id, group_name, description, parent_group_id, icon_id, has_types, last_updated)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE 
                    group_name = VALUES(group_name),
                    description = VALUES(description),
                    parent_group_id = VALUES(parent_group_id),
                    icon_id = VALUES(icon_id),
                    has_types = VALUES(has_types),
                    last_updated = NOW()`,
                [
                    groupId,
                    groupDetails.name,
                    groupDetails.description || null,
                    groupDetails.parent_group_id || null,
                    groupDetails.icon_id || null,
                    groupDetails.types && groupDetails.types.length > 0
                ]
            );

            groupsProcessed++;

            // Process item types in this group
            if (groupDetails.types && groupDetails.types.length > 0) {
                for (const typeId of groupDetails.types) {
                    try {
                        const typeInfo = await fetchTypeInfo(typeId);

                        // Only include published items
                        if (typeInfo.published) {
                            await pool.query(
                                `INSERT INTO item_types 
                                 (type_id, type_name, description, volume, mass, published, market_group_id, icon_id, last_updated)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                                 ON DUPLICATE KEY UPDATE 
                                    type_name = VALUES(type_name),
                                    description = VALUES(description),
                                    volume = VALUES(volume),
                                    mass = VALUES(mass),
                                    published = VALUES(published),
                                    market_group_id = VALUES(market_group_id),
                                    icon_id = VALUES(icon_id),
                                    last_updated = NOW()`,
                                [
                                    typeId,
                                    typeInfo.name,
                                    typeInfo.description || null,
                                    typeInfo.volume || null,
                                    typeInfo.mass || null,
                                    typeInfo.published,
                                    groupId,
                                    typeInfo.icon_id || null
                                ]
                            );

                            typesProcessed++;
                        }
                    } catch (error) {
                        console.warn(`[SYNC] Failed to fetch type ${typeId}:`, error.message);
                    }
                }
            }

            if (groupsProcessed % 50 === 0) {
                console.log(`[SYNC] Processed ${groupsProcessed}/${groupIds.length} market groups...`);
            }
        }

        // Build hierarchical market tree JSON for frontend
        console.log('[SYNC] Building market tree structure...');
        const [groups] = await pool.query(`
            SELECT market_group_id, group_name, parent_group_id 
            FROM market_groups 
            WHERE has_types = TRUE
            ORDER BY group_name
        `);

        // Organize into hierarchy
        const groupMap = new Map();
        groups.forEach(group => {
            groupMap.set(group.market_group_id, {
                id: group.market_group_id,
                name: group.group_name,
                parentId: group.parent_group_id,
                items: []
            });
        });

        // Fetch items for each group
        for (const [groupId, group] of groupMap) {
            const [items] = await pool.query(
                `SELECT type_id, type_name, icon_id, volume, mass 
                 FROM item_types 
                 WHERE market_group_id = ? AND published = TRUE 
                 ORDER BY type_name`,
                [groupId]
            );
            group.items = items;
        }

        // Save to JSON file for frontend
        const outputPath = path.join(__dirname, '../../public/data/marketTree.json');
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, JSON.stringify(Array.from(groupMap.values()), null, 2));

        // Update sync status
        await pool.query(
            `UPDATE sync_status 
             SET status = 'completed', records_processed = ?, error_message = NULL
             WHERE sync_type = 'market_groups'`,
            [groupsProcessed]
        );

        await pool.query(
            `INSERT INTO sync_status (sync_type, status, records_processed, last_sync) 
             VALUES ('item_types', 'completed', ?, NOW()) 
             ON DUPLICATE KEY UPDATE 
                status = 'completed', 
                records_processed = ?,
                last_sync = NOW()`,
            [typesProcessed, typesProcessed]
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[SYNC] ✓ Market tree sync completed in ${duration}s`);
        console.log(`[SYNC] Processed ${groupsProcessed} groups and ${typesProcessed} item types\n`);

        return { success: true, groups: groupsProcessed, types: typesProcessed };
    } catch (error) {
        console.error('[SYNC] ✗ Market tree sync failed:', error.message);

        await pool.query(
            `UPDATE sync_status 
             SET status = 'failed', error_message = ?
             WHERE sync_type = 'market_groups'`,
            [error.message]
        );

        return { success: false, error: error.message };
    }
}

// Run immediately if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    await syncMarketTree();
    process.exit(0);
}
