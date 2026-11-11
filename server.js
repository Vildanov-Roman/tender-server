import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

import cors from 'cors';
import helmet from 'helmet';

import tenderRoutes from './routes/tenderRoutes.js';
import cronRouter from './routes/cron.js';
// НОВОЕ: Импортируем роуты авторизации (обязательно с расширением .js)
import authRoutes from './routes/authRoutes.js';
import { startDailyRefresh } from './scheduler/dailyRefresh.js';

dotenv.config();

const app = express();
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const allowedOrigins = [
    'http://localhost:3000',
    'https://solutionsua.netlify.app',
];

app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin) return cb(null, true);
            if (allowedOrigins.includes(origin)) return cb(null, true);
            return cb(new Error(`CORS: Origin ${origin} is not allowed`));
        },
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CRON-SECRET', 'X-ADMIN-TOKEN'],
        credentials: false,
    })
);

const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('❌ MONGODB_URI is not set');
    process.exit(1);
}

if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not set');
    process.exit(1);
}

if (!process.env.CRON_SECRET) {
    console.error('❌ CRON_SECRET is not set');
    process.exit(1);
}

mongoose.set('strictQuery', true);
mongoose
    .connect(uri)
    .then(() => {
        console.log('✅ MongoDB connected');

        if (process.env.USE_NODE_CRON === 'true') {
            startDailyRefresh();
            console.log('⏰ node-cron scheduled at 03:00 Europe/Berlin');
        }
    })
    .catch(err => console.error('❌ MongoDB connection error:', err));

app.get('/health', (_req, res) => res.send('OK'));

app.use('/api/tenders', tenderRoutes);
app.use('/tasks', cronRouter);

// НОВОЕ: Подключаем пути для авторизации ДО обработчика 404 ошибки
app.use('/api/auth', authRoutes);

// Аккуратная обработка ошибок CORS
app.use((err, _req, res, next) => {
    if (err.message && err.message.startsWith('CORS:')) {
        return res.status(403).json({
            error: 'Forbidden by CORS policy'
        });
    }

    next(err);
});

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});