import cron from 'node-cron';
import { refreshTenders } from '../services/refreshTenders.js';

export function startDailyRefresh() {
    // ┌───────────── минута (0)
    // │ ┌─────────── час (3)
    // │ │ ┌───────── день месяца (*)
    // │ │ │ ┌─────── месяц (*)
    // │ │ │ │ ┌───── день недели (*)
    // │ │ │ │ │
    // 0 3 * * * = каждый день в 03:00
    cron.schedule('0 3 * * *', async () => {
        try {
            console.log('[node-cron] Refresh started');
            const result = await refreshTenders();
            console.log('[node-cron] Refresh done:', result);
        } catch (err) {
            console.error('[node-cron] Refresh error:', err);
        }
    }, {
        timezone: 'Europe/Berlin'
    });
}
