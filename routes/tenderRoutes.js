import express from 'express';
import {
    getAllTenders,
    createTender,
    updateComment,
    deleteTender,
    archiveTender,
    getArchivedTenders,
    deleteArchivedTender,
    downloadTenderDocument,
} from '../controllers/tenderController.js';

const router = express.Router();

// /api/tenders
router.get('/', getAllTenders);
router.post('/', createTender);

// /api/tenders/archive
router.get('/archive', getArchivedTenders);
router.patch('/archive/:tenderId', archiveTender);
router.delete('/archive/:tenderId', deleteArchivedTender);

// /api/tenders/:tenderId
router.get('/:tenderId/documents/:docId', downloadTenderDocument);
router.patch('/:tenderId/comment', updateComment);
router.delete('/:tenderId', deleteTender);

export default router;
