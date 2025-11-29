import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET /api/stations/:regionId - Get all stations in a region
router.get('/:regionId', async (req, res, next) => {
    try {
        const { regionId } = req.params;

        const [rows] = await pool.query(
            `SELECT station_id as stationID, station_name as stationName, 
                    system_id as systemID, system_name as systemName, 
                    region_id as regionID, last_updated as lastUpdated
             FROM stations
             WHERE region_id = ?
             ORDER BY station_name ASC`,
            [regionId]
        );

        res.json({
            regionID: parseInt(regionId),
            totalStations: rows.length,
            stations: rows
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/stations - Get all stations (optional query param: regionId)
router.get('/', async (req, res, next) => {
    try {
        const { regionId } = req.query;

        let query = `SELECT station_id as stationID, station_name as stationName, 
                            system_id as systemID, system_name as systemName, 
                            region_id as regionID, last_updated as lastUpdated
                     FROM stations`;
        const params = [];

        if (regionId) {
            query += ' WHERE region_id = ?';
            params.push(regionId);
        }

        query += ' ORDER BY station_name ASC';

        const [rows] = await pool.query(query, params);

        res.json({
            totalStations: rows.length,
            stations: rows
        });
    } catch (error) {
        next(error);
    }
});

export default router;
