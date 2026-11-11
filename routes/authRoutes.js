import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';
// НОВЫЕ ИМПОРТЫ
import { getMyTenders, addTenderToUser, changeTenderStatus, removeTenderFromUser } from '../controllers/userTenderController.js';

const router = express.Router();
// Защита от частых попыток входа и регистрации
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        message: 'Слишком много попыток. Попробуйте снова через 15 минут.'
    }
});

// Авторизация
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

// НОВЫЕ: Работа с тендерами пользователя (Все защищены authMiddleware!)
router.get('/my-tenders', authMiddleware, getMyTenders);
router.post('/my-tenders/add', authMiddleware, addTenderToUser);
router.patch('/my-tenders/status', authMiddleware, changeTenderStatus);

router.delete('/my-tenders/:tenderId', authMiddleware, removeTenderFromUser);

export default router;