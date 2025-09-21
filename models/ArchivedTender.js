import mongoose from 'mongoose';
import { tenderSchema } from './Tender.js';

tenderSchema.add({
    archivedAt: { type: Date, default: () => new Date() }
});

const ArchivedTender =
    mongoose.models.ArchivedTender ||
    mongoose.model('ArchivedTender', tenderSchema, 'archivedtenders');

export default ArchivedTender;
