import Tender from '../models/Tender.js';
import fetch from 'node-fetch';

const CONCURRENCY = Number(process.env.REFRESH_CONCURRENCY || 5);
const REQUEST_TIMEOUT_MS = Number(process.env.REFRESH_TIMEOUT_MS || 20000);

function withTimeout(promise, ms, abort) {
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => {
            if (abort) abort();
            reject(new Error(`Request timeout after ${ms} ms`));
        }, ms);
        promise.then(v => { clearTimeout(t); resolve(v); })
            .catch(e => { clearTimeout(t); reject(e); });
    });
}

async function runLimited(items, limit, worker) {
    const results = [];
    let i = 0, running = 0;
    return new Promise((resolve, reject) => {
        const next = () => {
            if (i >= items.length && running === 0) return resolve(results);
            while (running < limit && i < items.length) {
                const idx = i++;
                running++;
                Promise.resolve(worker(items[idx], idx))
                    .then(r => { results[idx] = r; running--; next(); })
                    .catch(err => { reject(err); });
            }
        };
        next();
    });
}

function mapSmartTenderToUpdate(data) {
    return {
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
        Nomenclatures: Array.isArray(data.Nomenclatures)
            ? data.Nomenclatures.map(n => ({ Title: n.Title, Count: n.Count }))
            : [],
        Lots: Array.isArray(data.Lots)
            ? data.Lots.map(lot => ({
                LotId: lot.LotId,
                Title: lot.Title,
                Budget: {
                    AmountTitle: lot.Budget?.AmountTitle,
                    VatTitle: lot.Budget?.VatTitle
                },
                Nomenclatures: Array.isArray(lot.Nomenclatures)
                    ? lot.Nomenclatures.map(n => ({ Title: n.Title, Count: n.Count }))
                    : []
            }))
            : [],
        Documents: Array.isArray(data.Documents)
            ? data.Documents.map(section => ({
                Title: section.Title,
                Documents: Array.isArray(section.Documents)
                    ? section.Documents.map(d => ({
                        Id: d.Id,
                        Title: d.Title,
                        FileName: d.FileName,
                        DatePublished: d.DatePublished,
                        DocumentType: d.DocumentType,
                        DownloadUrl: d.DownloadUrl
                    }))
                    : []
            }))
            : [],
        Stages: Array.isArray(data.Stages)
            ? data.Stages.map(stage => ({
                Name: stage.Name,
                DateFrom: stage.DateFrom,
                DateTo: stage.DateTo,
                Current: !!stage.Current,
                Complete: !!stage.Complete,
                Cancelled: !!stage.Cancelled
            }))
            : [],
        OrganizerId: data.Organizer?.Id,
        updatedAt: new Date()
    };
}

export async function refreshTenders(opts = {}) {
    const includeArchived = !!opts.includeArchived;

    const query = includeArchived ? {} : { isArchived: { $ne: true } };
    const ids = await Tender.find(query).select({ TenderId: 1, _id: 0 }).lean();
    const tenderIds = ids.map(d => d.TenderId).filter(Boolean);

    let updated = 0, notChanged = 0, failed = 0;

    await runLimited(tenderIds, CONCURRENCY, async (tenderId) => {
        const controller = new AbortController();
        try {
            const url = `https://smarttender.biz/PurchaseDetail/GetTenderModel/?tenderId=${encodeURIComponent(tenderId)}`;
            const resp = await withTimeout(
                fetch(url, { signal: controller.signal }),
                REQUEST_TIMEOUT_MS,
                () => controller.abort()
            );

            if (!resp.ok) {
                failed++;
                return;
            }

            const data = await resp.json();
            if (!data || Object.keys(data).length === 0) {
                notChanged++;
                return;
            }

            const $set = mapSmartTenderToUpdate(data);

            const res = await Tender.updateOne(
                { TenderId: tenderId },
                { $set },
                { upsert: false }
            );

            if (res.modifiedCount) updated++; else notChanged++;
        } catch (_e) {
            failed++;
        }
    });

    return {
        scanned: tenderIds.length,
        updated,
        notChanged,
        failed,
        includeArchived,
        concurrency: CONCURRENCY
    };
}
