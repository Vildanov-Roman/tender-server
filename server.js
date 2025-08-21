import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// РОУТЫ
import tenderRoutes from './routes/tenderRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());

// Разрешаем доступ фронту
const allowedOrigins = [
    'http://localhost:3000',
    // ЗДЕСЬ УКЖИ ДОМЕН ФРОНТА (если он у тебя хостится отдельно, напр. Netlify/Vercel)
    'https://uasolutions.netlify.app',
];

app.use(cors({
    origin: (origin, cb) => {
        // Разрешаем запросы без Origin (например, curl/healthchecks)
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        // Можно ослабить в DEV:
        // if (process.env.NODE_ENV !== 'production') return cb(null, true);
        return cb(new Error(`CORS: Origin ${origin} is not allowed`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false, // true — только если реально используешь cookie/withCredentials
}));

const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('❌ MONGODB_URI is not set');
    process.exit(1);
}

mongoose.set('strictQuery', true);
mongoose.connect(uri)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Healthcheck
app.get('/health', (_req, res) => res.send('OK'));

// ПОДКЛЮЧАЕМ API РОУТЫ (ЭТО ГЛАВНОЕ)
app.use('/api/tenders', tenderRoutes);

// 404 для остальных
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
