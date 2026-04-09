import { Router } from 'express';
import { DeliveryRequest } from '../models/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Customer') query.userId = req.user.id;
    const list = await DeliveryRequest.find(query).sort({ createdAt: -1 });
    res.json({ success: true, requests: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { pickup, dropoff, packageDetails, deliveryFee } = req.body;
    const request = new DeliveryRequest({
      id: `request-${Date.now()}`,
      userId: req.user.id,
      status: 'pending',
      pickup,
      dropoff,
      packageDetails,
      deliveryFee,
    });
    await request.save();
    res.status(201).json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
