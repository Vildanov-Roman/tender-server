import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import tenderRoutes from './routes/tenderRoutes.js';
import cronRouter from './routes/cron.js';
import { startDailyRefresh } from './scheduler/dailyRefresh.js';

dotenv.config();

const app = express();
app.use(express.json());

const allowedOrigins = [
    'http://localhost:3000',
    'https://uasolutions.netlify.app',
];

app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin) return cb(null, true);
            if (allowedOrigins.includes(origin)) return cb(null, true);
            return cb(new Error(`CORS: Origin ${origin} is not allowed`));
        },
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CRON-SECRET', 'X-ADMIN-TOKEN'],
        credentials: false, // true — только если реально используешь cookie/withCredentials
    })
);

const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('❌ MONGODB_URI is not set');
    process.exit(1);
}

mongoose.set('strictQuery', true);
mongoose
    .connect(uri)
    .then(() => {
        console.log('✅ MongoDB connected');

        // Включаем node-cron, если указано в .env
        if (process.env.USE_NODE_CRON === 'true') {
            startDailyRefresh();
            console.log('⏰ node-cron scheduled at 03:00 Europe/Berlin');
        }
    })
    .catch(err => console.error('❌ MongoDB connection error:', err));

app.get('/health', (_req, res) => res.send('OK'));

app.use('/api/tenders', tenderRoutes);

app.use('/tasks', cronRouter);

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
