import Tender from '../models/Tender.js';
import ArchivedTender from '../models/ArchivedTender.js';
import fetch from 'node-fetch';

export const getAllTenders = async (req, res) => {
    try {
        // Возвращаем только активные (из основной коллекции)
        const tenders = await Tender.find({});
        res.json(tenders);
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
        const response = await fetch(
            `https://smarttender.biz/PurchaseDetail/GetTenderModel/?tenderId=${tenderId}`
        );
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
            Nomenclatures: data.Nomenclatures?.map(n => ({
                Title: n.Title,
                Count: n.Count
            })) || [],
            Lots: data.Lots?.map(lot => ({
                LotId: lot.LotId,
                Title: lot.Title, // <-- добавили
                Budget: {
                    AmountTitle: lot.Budget?.AmountTitle,
                    VatTitle: lot.Budget?.VatTitle
                },
                Nomenclatures: lot.Nomenclatures?.map(n => ({
                    Title: n.Title,
                    Count: n.Count
                })) || []
            })) || [],
            // сохраняем секции как есть — это ждёт фронт
            Documents: data.Documents?.map(section => ({
                Title: section.Title,
                Documents: section.Documents?.map(d => ({
                    Id: d.Id,
                    Title: d.Title,
                    FileName: d.FileName,
                    DocumentType: d.DocumentType,
                    DownloadUrl: d.DownloadUrl
                })) || []
            })) || [],
            Stages: data.Stages?.map(stage => ({
                Name: stage.Name,
                DateFrom: stage.DateFrom,
                DateTo: stage.DateTo,
                Current: stage.Current,
                Complete: stage.Complete,
                Cancelled: stage.Cancelled
            })) || [],
            OrganizerId: data.Organizer?.Id
        });

        await tender.save();
        res.status(201).json(tender);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateComment = async (req, res) => {
    const { tenderId } = req.params; // <-- совпадает с роутом
    const { comment } = req.body;
    try {
        const updated = await Tender.findOneAndUpdate(
            { TenderId: tenderId },
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const archiveTender = async (req, res) => {
    const { tenderId } = req.params;

    try {
        const tender = await Tender.findOne({ TenderId: tenderId });
        if (!tender) return res.status(404).json({ message: 'Тендер не найден' });

        const archived = new ArchivedTender(tender.toObject());
        await archived.save();
        await Tender.deleteOne({ TenderId: tenderId });

        res.status(200).json(archived);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при переносе в архив', error: error.message });
    }
};

export const getArchivedTenders = async (_req, res) => {
    try {
        const archived = await ArchivedTender.find();
        res.status(200).json(archived);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении архива', error: error.message });
    }
};

export const deleteArchivedTender = async (req, res) => {
  const { tenderId } = req.params;
  try {
    const deleted = await ArchivedTender.findOneAndDelete({ TenderId: tenderId });
    if (!deleted) return res.status(404).json({ message: 'Tender not found in archive' });
    res.json({ message: 'Archived tender deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

async function findDocById(tenderId, docId) {
    let tender = await Tender.findOne({ TenderId: tenderId });
    if (!tender) tender = await ArchivedTender.findOne({ TenderId: tenderId });
    if (!tender) return { doc: null };

    const section = Array.isArray(tender.Documents)
        ? tender.Documents.find(s => s?.Title === 'Тендерна документація')
        : null;

    const doc = section?.Documents?.find(d => String(d.Id) === String(docId));
    return { doc };
}

export const downloadTenderDocument = async (req, res) => {
    const { tenderId, docId } = req.params;
    try {
        const { doc } = await findDocById(tenderId, docId);
        if (!doc || !doc.DownloadUrl) {
            return res.status(404).json({ message: 'Документ не найден' });
        }

        const upstream = await fetch(doc.DownloadUrl);
        if (!upstream.ok) {
            return res
                .status(upstream.status)
                .json({ message: 'Не удалось получить документ с источника' });
        }

        // Читаем тело как ArrayBuffer (совместимо с Web-стримом)
        const arrayBuf = await upstream.arrayBuffer();
        const buf = Buffer.from(arrayBuf);

        // Пробрасываем заголовки
        const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
        const fileName = doc.FileName || `${docId}`;

        res.setHeader('Content-Type', contentType);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
        );
        res.setHeader('Content-Length', buf.length);

        return res.status(200).send(buf);
    } catch (e) {
        console.error('downloadTenderDocument error:', e);
        return res.status(500).json({ message: 'Ошибка при скачивании документа', error: e.message });
    }
};


