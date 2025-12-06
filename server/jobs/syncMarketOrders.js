import { pool } from '../db.js';
import { fetchAllMarketOrdersInRegion, POPULAR_REGIONS } from '../utils/esiApi.js';

/**
 * Sync market orders from ESI for all regions
 * Popular regions: Every 5 minutes
 * Other regions: Every 10 minutes
 */
export async function syncMarketOrders(regionId = null, isPopular = false) {
    const regionType = isPopular ? 'popular' : 'standard';
    console.log(`\n[SYNC] Starting market orders sync for region ${regionId} (${regionType})...`);
    const startTime = Date.now();

    try {
        // Fetch all orders for the region
        const orders = await fetchAllMarketOrdersInRegion(regionId);
        console.log(`[SYNC] Fetched ${orders.length} orders for region ${regionId}`);

        // Delete expired orders for this region
        await pool.query(
            `DELETE FROM market_orders WHERE region_id = ? AND expires < NOW()`,
            [regionId]
        );

        // Insert or update orders
        let processedCount = 0;
        for (const order of orders) {
            // Skip orders with missing required fields
            if (!order.expires || !order.issued) {
                console.log(`[SYNC] Skipping order ${order.order_id} - missing required fields`);
                continue;
            }

            await pool.query(
                `INSERT INTO market_orders 
                 (order_id, region_id, type_id, location_id, system_id, is_buy_order, 
                  price, volume_remain, volume_total, min_volume, duration, issued, expires, last_updated)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE 
                    price = VALUES(price),
                    volume_remain = VALUES(volume_remain),
                    volume_total = VALUES(volume_total),
                    expires = VALUES(expires),
                    last_updated = NOW()`,
                [
                    order.order_id,
                    regionId,  // Use the regionId parameter since ESI doesn't include it in response
                    order.type_id,
                    order.location_id,
                    order.system_id,
                    order.is_buy_order,
                    order.price,
                    order.volume_remain,
                    order.volume_total,
                    order.min_volume || 1,
                    order.duration,
                    order.issued,
                    order.expires
                ]
            );

            processedCount++;
            if (processedCount % 1000 === 0) {
                console.log(`[SYNC] Processed ${processedCount}/${orders.length} orders...`);
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[SYNC] ✓ Market orders sync for region ${regionId} completed in ${duration}s`);
        console.log(`[SYNC] Processed ${processedCount} orders\n`);

        return { success: true, count: processedCount };
    } catch (error) {
        console.error(`[SYNC] ✗ Market orders sync for region ${regionId} failed:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Sync market orders for all regions based on popularity
 */
export async function syncAllMarketOrders() {
    console.log('\n[SYNC] Starting full market orders sync for all regions...');

    try {
        // Get all regions
        const [regions] = await pool.query(`SELECT region_id FROM regions`);

        const results = {
            popular: { success: 0, failed: 0 },
            standard: { success: 0, failed: 0 }
        };

        for (const region of regions) {
            const isPopular = POPULAR_REGIONS.includes(region.region_id);
            const result = await syncMarketOrders(region.region_id, isPopular);

            if (result.success) {
                results[isPopular ? 'popular' : 'standard'].success++;
            } else {
                results[isPopular ? 'popular' : 'standard'].failed++;
            }
        }

        console.log('\n[SYNC] ✓ Full market orders sync completed');
        console.log(`[SYNC] Popular regions: ${results.popular.success} success, ${results.popular.failed} failed`);
        console.log(`[SYNC] Standard regions: ${results.standard.success} success, ${results.standard.failed} failed\n`);

        return results;
    } catch (error) {
        console.error('[SYNC] ✗ Full market orders sync failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Run immediately if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const regionId = process.argv[2] ? parseInt(process.argv[2]) : null;

    if (regionId) {
        const isPopular = POPULAR_REGIONS.includes(regionId);
        await syncMarketOrders(regionId, isPopular);
    } else {
        await syncAllMarketOrders();
    }

    process.exit(0);
}
