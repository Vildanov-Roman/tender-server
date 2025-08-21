import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000', 'https://ТВОЙ_ДОМЕН_ФРОНТА'],
    credentials: true
}));

const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('❌ MONGODB_URI is not set');
    process.exit(1);
}

mongoose.connect(uri)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

app.get('/health', (_req, res) => res.send('OK'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
