import { Router } from 'express';
import { Review, Shop, Order } from '../models/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { reviewLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Get reviews for a shop
router.get('/shop/:shopId', async (req, res) => {
  try {
    const reviews = await Review.find({ shopId: req.params.shopId, isVisible: true })
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to load reviews. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Failed to load reviews', hint: 'Try refreshing the page.' } });
  }
});

// Create a review (customer only)
router.post('/', authMiddleware, reviewLimiter, async (req, res) => {
  try {
    if (req.user.role !== 'Customer') {
      return res.status(403).json({ success: false, message: 'Only customer accounts can leave reviews.', error: { status: 403, code: 'FORBIDDEN', title: 'Cannot post review', hint: 'You must be logged in as a Customer to leave a review.' } });
    }

    const { orderId, shopId, riderId, shopRating, riderRating, shopReview, riderReview, images } = req.body;

    // Verify customer has this delivered order
    const order = await Order.findOne({ 
      id: orderId,
      userId: req.user.id,
      status: 'delivered'
    });

    if (!order) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only review delivered orders' 
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reviewed this order' 
      });
    }

    const review = new Review({
      orderId,
      shopId,
      riderId,
      userId: req.user.id,
      shopRating,
      riderRating,
      shopReview: {
        comment: shopReview?.comment,
        tags: shopReview?.tags || []
      },
      riderReview: {
        comment: riderReview?.comment,
        tags: riderReview?.tags || []
      },
      images: images || [],
      isVisible: true
    });

    await review.save();

    // Update shop rating
    const shopRatingData = await Review.calculateShopRating(shopId);
    await Shop.updateOne({ id: shopId }, { 
      rating: shopRatingData.average,
      reviews: shopRatingData.count
    });

    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit your review. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Review failed', hint: 'Make sure your rating is between 1–5 and try again.' } });
  }
});

// Update a review
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findOne({ id: req.params.id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found. It may have been removed.', error: { status: 404, code: 'NOT_FOUND', title: 'Review not found', hint: 'The review may have been deleted.' } });
    if (review.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit your own reviews.', error: { status: 403, code: 'FORBIDDEN', title: 'Not your review', hint: 'Make sure you\'re logged in with the account that wrote this review.' } });
    }

    const { shopRating, riderRating, shopReview, riderReview } = req.body;
    
    if (shopRating) review.shopRating = shopRating;
    if (riderRating) review.riderRating = riderRating;
    if (shopReview) review.shopReview = shopReview;
    if (riderReview) review.riderReview = riderReview;
    
    await review.save();

    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update your review. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Update failed', hint: 'Try again in a moment.' } });
  }
});

// Delete a review
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findOne({ id: req.params.id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found. It may have already been deleted.', error: { status: 404, code: 'NOT_FOUND', title: 'Review not found' } });
    if (review.userId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'You can only delete your own reviews.', error: { status: 403, code: 'FORBIDDEN', title: 'Not your review' } });
    }

    review.isVisible = false;
    await review.save();

    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete review. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Deletion failed' } });
  }
});

export default router;
