import express from 'express';

const router = express.Router();

/**
 * GET /api/auth/login - Simple test
 */
router.get('/login', (req, res) => {
    res.json({ message: 'Auth route works!' });
});

/**
 * GET /api/auth/status - Simple test
 */
router.get('/status', (req, res) => {
    res.json({ message: 'Status route works!' });
});

export default router;