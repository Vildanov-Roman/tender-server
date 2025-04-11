import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import tenderRoutes from './routes/tenderRoutes.js';

const app = express();

mongoose.connect('mongodb://localhost:27017/tenders', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(cors());
app.use(express.json());

app.use('/api/tenders', tenderRoutes);

app.listen(5000, () => {
    console.log('Сервер запущен на порту 5000');
});
