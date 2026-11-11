import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const createToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

const normalizeEmail = (email) => {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
};

// 1. Регистрация
export const register = async (req, res) => {
    try {
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        const email = normalizeEmail(req.body.email);
        const password = req.body.password;

        if (!name || name.length > 100) {
            return res.status(400).json({ message: 'Введите корректное имя (до 100 символов)' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
            return res.status(400).json({ message: 'Введите корректный email' });
        }

        if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
            return res.status(400).json({ message: 'Пароль должен содержать от 6 до 128 символов' });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            email,
            password: hashedPassword,
            name
        });

        await user.save();

        const token = createToken(user._id);

        return res.status(201).json({
            token,
            user: { id: user._id, email: user.email, name: user.name }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }

        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Ошибка при регистрации' });
    }
};

// 2. Логин
export const login = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = req.body.password;

        if (!email || typeof password !== 'string' || !password) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        const token = createToken(user._id);

        return res.json({
            token,
            user: { id: user._id, email: user.email, name: user.name }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Ошибка при авторизации' });
    }
};

// 3. Получение профиля
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        return res.json(user);
    } catch (error) {
        console.error('Profile retrieval error:', error);
        return res.status(500).json({ message: 'Ошибка получения профиля' });
    }
};

// 4. Обновление профиля
export const updateProfile = async (req, res) => {
    try {
        const { name, phone, directions, avatarUrl } = req.body;

        const updates = {};

        if (name !== undefined) {
            if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
                return res.status(400).json({ message: 'Введите корректное имя' });
            }
            updates.name = name.trim();
        }

        if (phone !== undefined) {
            if (typeof phone !== 'string' || phone.length > 30) {
                return res.status(400).json({ message: 'Некорректный номер телефона' });
            }
            updates.phone = phone.trim();
        }

        if (directions !== undefined) {
            const allowedDirections = [
                'Гор транспорт',
                'Железная Дорога',
                'Энергетика',
                'Общепром'
            ];

            if (
                !Array.isArray(directions) ||
                directions.length > allowedDirections.length ||
                !directions.every(direction => allowedDirections.includes(direction)) ||
                new Set(directions).size !== directions.length
            ) {
                return res.status(400).json({ message: 'Некорректные направления деятельности' });
            }

            updates.directions = directions;
        }

        if (avatarUrl !== undefined) {
            if (typeof avatarUrl !== 'string' || avatarUrl.length > 6 * 1024 * 1024) {
                return res.status(400).json({ message: 'Размер фотографии превышает допустимый лимит 2 МБ' });
            }

            if (avatarUrl && !/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(avatarUrl)) {
                return res.status(400).json({ message: 'Некорректный формат фотографии' });
            }

            updates.avatarUrl = avatarUrl;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        return res.json(updatedUser);
    } catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ message: 'Ошибка обновления профиля' });
    }
};
