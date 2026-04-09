import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const reviewSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `rev-${nanoid(12)}`,
    unique: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  shopId: {
    type: String,
    required: true,
    index: true
  },
  riderId: {
    type: String,
    index: true
  },
  shopRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  riderRating: {
    type: Number,
    min: 1,
    max: 5
  },
  shopReview: {
    comment: {
      type: String,
      maxlength: 1000
    },
    tags: [{
      type: String
    }]
  },
  riderReview: {
    comment: {
      type: String,
      maxlength: 1000
    },
    tags: [{
      type: String
    }]
  },
  images: [{
    type: String
  }],
  helpful: {
    type: Number,
    default: 0
  },
  helpfulBy: [{
    userId: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isVisible: {
    type: Boolean,
    default: true
  },
  response: {
    comment: String,
    respondedAt: Date,
    respondedBy: String
  }
}, {
  timestamps: true
});

// Indexes for performance
reviewSchema.index({ shopId: 1, createdAt: -1 });
reviewSchema.index({ riderId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });

// Static method to calculate average rating for a shop
reviewSchema.statics.calculateShopRating = async function(shopId) {
  const result = await this.aggregate([
    { $match: { shopId, isVisible: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$shopRating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? {
    average: Math.round(result[0].averageRating * 10) / 10,
    count: result[0].totalReviews
  } : { average: 0, count: 0 };
};

// Static method to calculate average rating for a rider
reviewSchema.statics.calculateRiderRating = async function(riderId) {
  const result = await this.aggregate([
    { $match: { riderId, isVisible: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$riderRating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? {
    average: Math.round(result[0].averageRating * 10) / 10,
    count: result[0].totalReviews
  } : { average: 0, count: 0 };
};

export const Review = mongoose.model('Review', reviewSchema);
