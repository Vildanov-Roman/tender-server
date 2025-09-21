import { Router } from 'express';
import { refreshTenders } from '../services/refreshTenders.js';

const router = Router();

console.log('[cron.js] mounted');

router.get('/ping', (_req, res) => res.json({ ok: true, where: '/tasks/ping' }));

router.post('/refresh', async (req, res) => {
    const secret = req.header('X-CRON-SECRET');
    if (!secret || secret !== process.env.CRON_SECRET) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    try {
        const result = await refreshTenders({
            includeArchived: process.env.REFRESH_INCLUDE_ARCHIVED === 'true',
        });
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error('Cron refresh error:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

export default router;
