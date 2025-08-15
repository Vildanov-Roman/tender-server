import express from 'express';
import {
    getAllTenders,
    createTender,
    updateComment,
    deleteTender,
    archiveTender, getArchivedTenders, deleteArchivedTender, downloadTenderDocument
} from '../controllers/tenderController.js';

const router = express.Router();

router.get('/', getAllTenders);
router.post('/', createTender);
router.get('/archive', getArchivedTenders);
router.delete('/archive/:tenderId', deleteArchivedTender);
router.patch('/:tenderId/comment', updateComment);
router.delete('/:tenderId', deleteTender);
router.patch('/archive/:tenderId', archiveTender);
router.get('/:tenderId/documents/:docId/download', downloadTenderDocument);
export default router;
