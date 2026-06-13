import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Shop } from '../models/Shop.js';
import { getRecommendations } from '../services/aiService.js';
import mongoose from 'mongoose';

const router = express.Router();

// A simple in-memory cache to prevent spamming the Gemini API during development/demo
// In production, this should be in Redis or MongoDB
const recommendationCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const activeShopIds = await Shop.distinct('id', { isActive: true });
        if (!activeShopIds || activeShopIds.length === 0) {
            return res.json([]);
        }
        const activeShopIdSet = new Set(activeShopIds);

        // 1. Check Cache
        const cached = recommendationCache.get(userId);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            const cachedIds = (cached.products || []).map((product) => product.id).filter(Boolean);
            if (cachedIds.length > 0) {
                const validCachedProducts = await Product.find({
                    id: { $in: cachedIds },
                    isAvailable: true,
                    shopId: { $in: activeShopIds }
                });

                if (validCachedProducts.length === cachedIds.length) {
                    const validMap = new Map(validCachedProducts.map((product) => [product.id, product]));
                    const sortedCached = cachedIds.map((id) => validMap.get(id)).filter(Boolean);
                    console.log(`Returning cached AI recommendations for user ${userId}`);
                    return res.json(sortedCached);
                }
            }
        }

        // 2. Fetch User & History
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get last 10 orders to understand shopping habits
        const recentOrders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('items');

        // Flatten purchased items for AI context
        const purchasedItems = [];
        for (const order of recentOrders) {
            for (const item of order.items) {
                // Fetch product category
                const product = await Product.findOne({ id: item.productId });
                if (product && activeShopIdSet.has(product.shopId)) {
                    purchasedItems.push({
                        itemName: product.name,
                        category: product.category,
                        price: product.price
                    });
                }
            }
        }

        const userContext = {
            favoriteCategories: [], // In a real app we might track page views, but here we'll use top purchased categories
            recentOrders: purchasedItems
        };

        // Derive favorite categories from purchases
        if (purchasedItems.length > 0) {
            const categoryCounts = purchasedItems.reduce((acc, item) => {
                acc[item.category] = (acc[item.category] || 0) + 1;
                return acc;
            }, {});
            userContext.favoriteCategories = Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(entry => entry[0]);
        }

        // 3. Fetch Diverse Catalog Sample for AI
        // We send top-rated and trending products, plus some from their favorite categories
        let catalogQuery = { isAvailable: true, shopId: { $in: activeShopIds } };
        if (userContext.favoriteCategories.length > 0) {
            catalogQuery = {
                isAvailable: true,
                shopId: { $in: activeShopIds },
                $or: [
                    { category: { $in: userContext.favoriteCategories } },
                    { rating: { $gte: 4.0 } }
                ]
            };
        }

        const catalogSample = await Product.find(catalogQuery)
            .sort({ rating: -1, reviews: -1, createdAt: -1 }) // Better sorting for quality
            .limit(50); // Give AI 50 good options to choose from

        // If no products available for catalog, use fallback immediately
        if (!catalogSample || catalogSample.length === 0) {
            console.log('No products available for recommendations');
            const fallbackProducts = await Product.find({ isAvailable: true, shopId: { $in: activeShopIds } })
                .sort({ rating: -1, reviews: -1 })
                .limit(8);
            return res.json(fallbackProducts);
        }

        // 4. Generate AI Recommendations
        console.log(`Generating AI recommendations for user ${userId}...`);
        let recommendedProductIds = await getRecommendations(userContext, catalogSample);

        // 5. Enhanced Fallback if AI fails or key is missing
        if (!recommendedProductIds || recommendedProductIds.length === 0) {
            console.log('⚠️  AI recommendations failed, using smart fallback...');

            // Smart Fallback Strategy:
            // 1. Try to get highly-rated products from user's favorite categories
            // 2. Fill remaining slots with overall popular products
            
            let fallbackProducts = [];
            
            if (userContext.favoriteCategories.length > 0) {
                // Get products from favorite categories
                const categoryProducts = await Product.find({
                    isAvailable: true,
                    shopId: { $in: activeShopIds },
                    category: { $in: userContext.favoriteCategories }
                }).sort({ rating: -1, reviews: -1 }).limit(4);
                
                fallbackProducts = [...categoryProducts];
            }
            
            // Fill remaining slots with popular products
            if (fallbackProducts.length < 8) {
                const popularProducts = await Product.find({ isAvailable: true, shopId: { $in: activeShopIds } })
                    .sort({ rating: -1, reviews: -1, createdAt: -1 })
                    .limit(8 - fallbackProducts.length);
                
                // Avoid duplicates
                const existingIds = new Set(fallbackProducts.map(p => p.id));
                const uniquePopular = popularProducts.filter(p => !existingIds.has(p.id));
                fallbackProducts = [...fallbackProducts, ...uniquePopular];
            }

            recommendedProductIds = fallbackProducts.map(p => p.id);
        }

        // 6. Fetch full recommended product objects
        const uniqueRecommendedIds = [...new Set(recommendedProductIds || [])].filter(Boolean);
        let sortedProducts = [];

        if (uniqueRecommendedIds.length > 0) {
            const finalProducts = await Product.find({
                id: { $in: uniqueRecommendedIds },
                isAvailable: true,
                shopId: { $in: activeShopIds }
            });
            const finalMap = new Map(finalProducts.map((product) => [product.id, product]));
            sortedProducts = uniqueRecommendedIds.map((id) => finalMap.get(id)).filter(Boolean);
        }

        if (sortedProducts.length < 8) {
            const existingIds = sortedProducts.map((product) => product.id);
            const extraQuery = {
                isAvailable: true,
                shopId: { $in: activeShopIds }
            };

            if (existingIds.length > 0) {
                extraQuery.id = { $nin: existingIds };
            }

            const extraProducts = await Product.find(extraQuery)
                .sort({ rating: -1, reviews: -1, createdAt: -1 })
                .limit(8 - sortedProducts.length);

            sortedProducts = [...sortedProducts, ...extraProducts];
        }

        // 7. Save to Cache
        recommendationCache.set(userId, {
            timestamp: Date.now(),
            products: sortedProducts
        });

        res.json(sortedProducts);

    } catch (error) {
        console.error('Recommendations route error:', error);
        res.status(500).json({ message: 'Failed to generate recommendations' });
    }
});

export default router;
