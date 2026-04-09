import { Router } from 'express';
import { Category } from '../models/index.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to load categories. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Failed to load categories', hint: 'Try refreshing the page.' } });
  }
});

export default router;
