import express from 'express';
import { pool } from '../db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/items/tree - Get full market hierarchy
router.get('/tree', async (req, res, next) => {
    try {
        // For now, serve from the static JSON file
        // TODO: Build tree from market_groups and item_types tables
        const treePath = path.join(__dirname, '../../public/data/marketTree.json');
        const treeData = await fs.readFile(treePath, 'utf-8');
        const tree = JSON.parse(treeData);

        res.json(tree);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(503).json({
                error: 'Market tree not available',
                message: 'Market data is being synchronized'
            });
        }
        next(error);
    }
});

// GET /api/items/:typeId - Get specific item details
router.get('/:typeId', async (req, res, next) => {
    try {
        const { typeId } = req.params;

        const [rows] = await pool.query(
            `SELECT type_id as typeID, type_name as typeName, description,
                    volume, mass, published, market_group_id as marketGroupID,
                    icon_id as iconID, last_updated as lastUpdated
             FROM item_types
             WHERE type_id = ?`,
            [typeId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
});

// GET /api/items/search/:query - Search items by name
router.get('/search/:query', async (req, res, next) => {
    try {
        const { query } = req.params;
        const searchTerm = `%${query}%`;

        const [rows] = await pool.query(
            `SELECT type_id as typeID, type_name as typeName, description,
                    market_group_id as marketGroupID, icon_id as iconID
             FROM item_types
             WHERE type_name LIKE ? AND published = TRUE
             ORDER BY type_name ASC
             LIMIT 50`,
            [searchTerm]
        );

        res.json({
            query,
            totalResults: rows.length,
            items: rows
        });
    } catch (error) {
        next(error);
    }
});

export default router;
