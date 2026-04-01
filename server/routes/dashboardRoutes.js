
const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();



router.get('/layout', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const breakpoint = req.query.breakpoint || 'lg';
    try {
        const result = await pool.query(
            'SELECT layout_data FROM dashboard_layouts WHERE user_id = $1 AND breakpoint = $2',
            [userId, breakpoint]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0].layout_data);
        } else {
            res.json([]);
        }
    } catch (err) {
        console.error(`Error fetching dashboard layout for user ${userId}, breakpoint ${breakpoint}: ${err.message}`);
        res.status(500).json({ message: 'Failed to fetch dashboard layout.' });
    }
});

router.put('/layout', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { layout, breakpoint } = req.body;

    if (!Array.isArray(layout)) {
        return res.status(400).json({ message: 'Invalid layout data: "layout" must be an array.' });
    }
    const effectiveBreakpoint = breakpoint || 'lg';

    try {
        const query = `
            INSERT INTO dashboard_layouts (user_id, breakpoint, layout_data)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, breakpoint) DO UPDATE
            SET layout_data = EXCLUDED.layout_data
            RETURNING layout_data;
        `;
        const result = await pool.query(query, [userId, effectiveBreakpoint, JSON.stringify(layout)]);
        res.json(result.rows[0].layout_data);
    } catch (err) {
        console.error(`Error saving dashboard layout for user ${userId}, breakpoint ${effectiveBreakpoint}: ${err.message}`);
        res.status(500).json({ message: 'Failed to save dashboard layout.' });
    }
});



router.get('/chart-config/:widgetKey', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { widgetKey } = req.params;
    try {
        const result = await pool.query(
            'SELECT chart_data FROM user_widget_configs WHERE user_id = $1 AND widget_key = $2',
            [userId, widgetKey]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0].chart_data);
        } else {
            res.status(404).json({ message: `No chart configuration found for widget '${widgetKey}'.` });
        }
    } catch (err) {
        console.error(`Error fetching chart config for widget ${widgetKey}, user ${userId}: ${err.message}`);
        res.status(500).json({ message: `Failed to fetch chart config for '${widgetKey}'.` });
    }
});

router.put('/chart-config/:widgetKey', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { widgetKey } = req.params;
    const { chartConfig } = req.body;

    if (!chartConfig || typeof chartConfig !== 'object' || !chartConfig.labels || !chartConfig.datasets ||
        !Array.isArray(chartConfig.labels) || !Array.isArray(chartConfig.datasets)) {
        return res.status(400).json({ message: 'Invalid chartConfig format in request body. Expected object with "labels" and "datasets" arrays.' });
    }

    try {
        const query = `
            INSERT INTO user_widget_configs (user_id, widget_key, chart_data)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, widget_key) DO UPDATE
            SET chart_data = EXCLUDED.chart_data
            RETURNING chart_data;
        `;
        const result = await pool.query(query, [userId, widgetKey, JSON.stringify(chartConfig)]);
        res.json(result.rows[0].chart_data);
    } catch (err) {
        console.error(`Error saving chart config for widget ${widgetKey}, user ${userId}: ${err.message}`);
        res.status(500).json({ message: `Failed to save chart config for '${widgetKey}'.` });
    }
});

module.exports = router;