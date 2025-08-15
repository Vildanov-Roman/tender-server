import mongoose from 'mongoose';
import { tenderSchema } from './Tender.js';

// защищает от OverwriteModelError при hot-reload
const ArchivedTender =
    mongoose.models.ArchivedTender ||
    mongoose.model('ArchivedTender', tenderSchema, 'archive');

export default ArchivedTender;