import express from 'express';
import {
    getAllTenders,
    createTender,
    updateComment,
    deleteTender
} from '../controllers/tenderController.js';

const router = express.Router();

router.get('/', getAllTenders);
router.post('/', createTender);
router.patch('/:id/comment', updateComment);
router.delete('/:id', deleteTender);

export default router;
