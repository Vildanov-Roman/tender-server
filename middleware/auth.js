import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error('JWT_SECRET is not configured');
        return res.status(500).json({
            message: 'Ошибка конфигурации сервера'
        });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Нет авторизации'
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            message: 'Нет авторизации'
        });
    }

    try {
        const decoded = jwt.verify(token, secret);

        if (!decoded.id) {
            return res.status(401).json({
                message: 'Неверный токен'
            });
        }

        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Нет авторизации (неверный токен)'
        });
    }
};

export default authMiddleware;
