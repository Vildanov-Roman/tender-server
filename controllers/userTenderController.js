
import User from '../models/User.js';
import Tender from '../models/Tender.js';

// Получить тендеры текущего пользователя
export const getMyTenders = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate('participatingTenders.tenderId');

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json(user.participatingTenders);
    } catch (error) {
        console.error('Ошибка получения тендеров:', error);
        res.status(500).json({ message: 'Ошибка получения тендеров' });
    }
};

// Добавить тендер в активные
export const addTenderToUser = async (req, res) => {
    try {
        const { tenderId } = req.body;

        if (!tenderId) {
            return res.status(400).json({ message: 'Не указан ID тендера' });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const tender = await Tender.findById(tenderId);

        if (!tender) {
            return res.status(404).json({ message: 'Тендер не найден в базе' });
        }

        const alreadyExists = user.participatingTenders.some(
            item => item.tenderId?.toString() === tenderId
        );

        if (alreadyExists) {
            return res.status(400).json({
                message: 'Тендер уже в вашем списке'
            });
        }

        user.participatingTenders.push({
            tenderId,
            status: 'active'
        });

        await user.save();

        res.status(201).json({
            message: 'Тендер добавлен в Активные',
            participatingTenders: user.participatingTenders
        });
    } catch (error) {
        console.error('Ошибка добавления тендера:', error);
        res.status(500).json({ message: 'Ошибка добавления тендера' });
    }
};

// Изменить статус тендера
export const changeTenderStatus = async (req, res) => {
    try {
        const { tenderId, newStatus } = req.body;

        const validStatuses = ['saved', 'active', 'won', 'lost', 'archived'];

        if (!tenderId || !validStatuses.includes(newStatus)) {
            return res.status(400).json({ message: 'Неверные данные или статус' });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const tenderIndex = user.participatingTenders.findIndex(
            item => item.tenderId?.toString() === tenderId
        );

        if (tenderIndex === -1) {
            return res.status(404).json({
                message: 'Тендер не найден в вашем списке'
            });
        }

        user.participatingTenders[tenderIndex].status = newStatus;

        await user.save();

        res.json({ message: `Статус изменен на ${newStatus}` });
    } catch (error) {
        console.error('Ошибка изменения статуса:', error);
        res.status(500).json({ message: 'Ошибка изменения статуса' });
    }
};

// Удалить тендер только из личного списка пользователя
export const removeTenderFromUser = async (req, res) => {
    try {
        const { tenderId } = req.params;

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        user.participatingTenders = user.participatingTenders.filter(
            item => item.tenderId?.toString() !== tenderId
        );

        await user.save();

        res.json({ message: 'Тендер удален из вашего списка' });
    } catch (error) {
        console.error('Ошибка удаления тендера:', error);
        res.status(500).json({ message: 'Ошибка удаления тендера' });
    }
};
