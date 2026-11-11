import express from 'express';
import authMiddleware from '../middleware/auth.js';

import {
    getAllTenders,
    createTender,
    getArchivedTenders,
    downloadTenderDocument,
    getTenderById
} from '../controllers/tenderController.js';

const router = express.Router();

// Все маршруты общей библиотеки требуют авторизации
router.use(authMiddleware);

router.get('/', getAllTenders);
router.post('/', createTender);

// Чтение старого общего архива
router.get('/archive', getArchivedTenders);

// Получение тендера и документов
router.get('/:tenderId', getTenderById);
router.get('/:tenderId/documents/:docId', downloadTenderDocument);

export default router;
