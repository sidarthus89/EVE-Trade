import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET /api/regions - Get all tradeable regions
router.get('/', async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT region_id as regionID, region_name as regionName, station_count as stationCount, last_updated as lastUpdated
             FROM regions
             ORDER BY region_name ASC`
        );

        res.json({
            lastUpdated: new Date().toISOString(),
            totalRegions: rows.length,
            regions: rows
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/regions/:regionId - Get specific region details
router.get('/:regionId', async (req, res, next) => {
    try {
        const { regionId } = req.params;

        const [rows] = await pool.query(
            `SELECT region_id as regionID, region_name as regionName, station_count as stationCount, last_updated as lastUpdated
             FROM regions
             WHERE region_id = ?`,
            [regionId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Region not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
});

export default router;
