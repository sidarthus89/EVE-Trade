import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Helper function to calculate IQR outlier bounds
function calculateOutlierBounds(prices, iqrMultiplier) {
    if (prices.length === 0) return { lower: -Infinity, upper: Infinity };

    const sorted = [...prices].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const range = iqr * iqrMultiplier;

    return {
        lower: q1 - range,
        upper: q3 + range
    };
}

// Helper function to filter outliers from orders
function filterOutliers(orders, isBuyOrder, outlierFilter) {
    if (!outlierFilter || outlierFilter === 'none') {
        return orders;
    }

    // Parse IQR multiplier from filter (e.g., 'iqr_1.5' -> 1.5)
    const multiplier = parseFloat(outlierFilter.replace('iqr_', ''));
    if (isNaN(multiplier)) {
        return orders;
    }

    const prices = orders.map(o => parseFloat(o.price));
    const bounds = calculateOutlierBounds(prices, multiplier);

    return orders.filter(o => {
        const price = parseFloat(o.price);
        return price >= bounds.lower && price <= bounds.upper;
    });
}

// GET /api/market/:typeId/:regionId - Get market orders for item in region
router.get('/:typeId/:regionId', async (req, res, next) => {
    try {
        const { typeId, regionId } = req.params;
        const { outlierFilter } = req.query;

        // Fetch all orders
        const [rows] = await pool.query(
            `SELECT order_id as orderID, type_id as typeID, region_id as regionID,
                    location_id as locationID, system_id as systemID,
                    is_buy_order as isBuyOrder, price, volume_remain as volumeRemain,
                    volume_total as volumeTotal, min_volume as minVolume,
                    duration, issued, expires, last_updated as lastUpdated
             FROM market_orders
             WHERE type_id = ? AND region_id = ? AND expires > NOW()
             ORDER BY is_buy_order DESC, price ${rows?.[0]?.isBuyOrder ? 'DESC' : 'ASC'}`,
            [typeId, regionId]
        );

        // Separate buy and sell orders
        const buyOrders = rows.filter(o => o.isBuyOrder === 1 || o.isBuyOrder === true);
        const sellOrders = rows.filter(o => o.isBuyOrder === 0 || o.isBuyOrder === false);

        // Apply outlier filtering if requested
        const filteredBuyOrders = filterOutliers(buyOrders, true, outlierFilter);
        const filteredSellOrders = filterOutliers(sellOrders, false, outlierFilter);

        res.json({
            typeID: parseInt(typeId),
            regionID: parseInt(regionId),
            outlierFilter: outlierFilter || 'none',
            buyOrders: filteredBuyOrders.map(o => ({
                ...o,
                isBuyOrder: true
            })),
            sellOrders: filteredSellOrders.map(o => ({
                ...o,
                isBuyOrder: false
            })),
            lastUpdated: rows.length > 0 ? rows[0].lastUpdated : new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/market/history/:typeId/:regionId - Get market history for item in region
router.get('/history/:typeId/:regionId', async (req, res, next) => {
    try {
        const { typeId, regionId } = req.params;
        const { days } = req.query; // Optional: limit to last N days

        let query = `SELECT region_id as regionID, type_id as typeID, date,
                            average, highest, lowest, order_count as orderCount,
                            volume, last_updated as lastUpdated
                     FROM market_history
                     WHERE type_id = ? AND region_id = ?`;
        const params = [typeId, regionId];

        if (days) {
            query += ' AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
            params.push(parseInt(days));
        }

        query += ' ORDER BY date DESC';

        const [rows] = await pool.query(query, params);

        res.json({
            typeID: parseInt(typeId),
            regionID: parseInt(regionId),
            totalDays: rows.length,
            history: rows
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/market/distribution/:typeId - Get market distribution across all regions
router.get('/distribution/:typeId', async (req, res, next) => {
    try {
        const { typeId } = req.params;

        // Aggregate buy/sell volumes and order counts per region
        const [rows] = await pool.query(
            `SELECT r.region_id as regionID, r.region_name as regionName,
                    COUNT(CASE WHEN mo.is_buy_order = TRUE THEN 1 END) as buyOrderCount,
                    COUNT(CASE WHEN mo.is_buy_order = FALSE THEN 1 END) as sellOrderCount,
                    SUM(CASE WHEN mo.is_buy_order = TRUE THEN mo.volume_remain ELSE 0 END) as buyVolume,
                    SUM(CASE WHEN mo.is_buy_order = FALSE THEN mo.volume_remain ELSE 0 END) as sellVolume,
                    AVG(CASE WHEN mo.is_buy_order = TRUE THEN mo.price END) as avgBuyPrice,
                    AVG(CASE WHEN mo.is_buy_order = FALSE THEN mo.price END) as avgSellPrice
             FROM regions r
             LEFT JOIN market_orders mo ON r.region_id = mo.region_id 
                AND mo.type_id = ? AND mo.expires > NOW()
             GROUP BY r.region_id, r.region_name
             HAVING buyOrderCount > 0 OR sellOrderCount > 0
             ORDER BY (buyVolume + sellVolume) DESC`,
            [typeId]
        );

        res.json({
            typeID: parseInt(typeId),
            totalRegions: rows.length,
            distribution: rows
        });
    } catch (error) {
        next(error);
    }
});

export default router;
