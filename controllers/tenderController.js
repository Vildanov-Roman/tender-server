import Tender from '../models/Tender.js';
import fetch from 'node-fetch';

export const getAllTenders = async (req, res) => {
    try {
        const tenders = await Tender.find(); // вернёт массив
        res.json(tenders); // <- должен возвращать JSON-массив тендеров
    } catch (err) {
        res.status(500).json({ error: 'Ошибка при получении тендеров' });
    }
};

export const createTender = async (req, res) => {
    const { tenderId } = req.body;

    if (!tenderId || !/^\d+$/.test(tenderId)) {
        return res.status(400).json({ error: 'Неверный ID тендера' });
    }

    const exists = await Tender.findOne({ TenderId: tenderId });
    if (exists) {
        return res.status(409).json({ error: 'Тендер уже существует' });
    }

    try {
        const response = await fetch(`https://smarttender.biz/PurchaseDetail/GetTenderModel/?tenderId=${tenderId}`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();

        if (!data || Object.keys(data).length === 0) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }

        const tender = new Tender({
            TenderId: tenderId,
            DatePublished: data.DatePublished,
            DateModified: data.DateModified,
            Organizer: {
                Id: data.Organizer?.Id,
                Name: data.Organizer?.Name,
                ContactPerson: {
                    Name: data.Organizer?.ContactPerson?.Name,
                    Phone: data.Organizer?.ContactPerson?.Phone,
                    Email: data.Organizer?.ContactPerson?.Email
                }
            },
            ProzorroNumber: data.ProzorroNumber,
            Category: { title: data.Category?.title },
            LinkToTender: data.LinkToTender,
            ImportantDates: data.ImportantDates,
            StatusTitle: data.StatusTitle,
            Budget: {
                AmountTitle: data.Budget?.AmountTitle,
                VatTitle: data.Budget?.VatTitle
            },
            Description: data.Description,
            MinimalStepAmount: data.MinimalStepAmount,
            ParticipationCost: data.ParticipationCost,
            Nomenclatures: data.Nomenclatures?.map(n => ({ Title: n.Title, Count: n.Count })),
            Lots: data.Lots?.map(lot => ({
                LotId: lot.LotId,
                Budget: {
                    AmountTitle: lot.Budget?.AmountTitle,
                    VatTitle: lot.Budget?.VatTitle
                },
                Nomenclatures: lot.Nomenclatures?.map(n => ({ Title: n.Title, Count: n.Count })) || []
            })) || [],
            Documents: data.Documents?.flatMap(section =>
                section.Documents?.map(d => ({
                    DocumentType: d.DocumentType,
                    DownloadUrl: d.DownloadUrl
                })) || []
            ),
            OrganizerId: data.Organizer?.Id
        });

        await tender.save();
        res.status(201).json(tender);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateComment = async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    try {
        const updated = await Tender.findOneAndUpdate(
            { TenderId: id },
            { Comment: comment },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Тендер не найден' });
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка при обновлении комментария', error: err.message });
    }
};

export const deleteTender = async (req, res) => {
    const { tenderId } = req.params;
    try {
        const deleted = await Tender.findOneAndDelete({ TenderId: tenderId });
        if (!deleted) return res.status(404).json({ message: 'Tender not found' });
        res.json({ message: 'Tender deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


