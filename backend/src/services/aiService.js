import { GoogleGenAI } from '@google/genai';
import { Product } from '../models/Product.js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the Gemini client
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

/**
 * Generate personalized product recommendations for a user based on their order history
 * and favorite categories.
 * 
 * @param {Object} userContext - Object containing { recentOrders, favoriteCategories }
 * @param {Array} catalogSample - Array of available products to choose from
 * @returns {Array} - Array of exactly 8 recommended product IDs
 */
export const getRecommendations = async (userContext, catalogSample) => {
    if (!ai) {
        console.warn('GEMINI_API_KEY not found in environment variables. Falling back to default recommendations.');
        return null;
    }

    try {
        // Simplify the catalog data to save tokens and improve response parsing
        const simplifiedCatalog = catalogSample.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            rating: p.rating
        }));

        const prompt = `
You are an expert personalized shopping assistant for the "Grab & Go" delivery app.
Your task is to review a user's purchase history and select exactly 8 products from the provided catalog that they are most likely to buy next.

USER PROFILE:
- Favorite categories: ${userContext.favoriteCategories.join(', ') || 'None yet'}
- Recent purchase history:
${userContext.recentOrders.map(o => `  - Bought ${o.itemName} (Category: ${o.category}) for Rs${o.price}`).join('\n') || '  No past orders.'}

AVAILABLE CATALOG:
${JSON.stringify(simplifiedCatalog, null, 2)}

INSTRUCTIONS:
1. Analyze the user's past purchases and favorite categories.
2. Select exactly 8 product IDs from the AVAILABLE CATALOG that strongly match the user's preferences, or represent good cross-selling opportunities (e.g., if they buy bread, recommend butter).
3. If they have no past orders, recommend the highest rated and most popular items across various categories.
4. RETURN ONLY A STRICT JSON ARRAY OF STRINGS containing the 8 recommended product IDs. Do not include markdown code blocks, do not include explanations, just the JSON array.
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                topK: 40,
                responseMimeType: 'application/json',
            }
        });

        const resultText = response.text();

        // Gemini sometimes wraps JSON in markdown code blocks or adds extra text.
        // Extract the JSON array from the response.
        let jsonStr = resultText.trim();

        // Remove markdown code fences: ```json ... ``` or ``` ... ```
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
        }

        // If there's text after the JSON array, extract just the array
        const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            jsonStr = arrayMatch[0];
        }

        const productIds = JSON.parse(jsonStr);

        // Ensure we are returning an array
        if (!Array.isArray(productIds)) {
            throw new Error('AI did not return an array');
        }

        return productIds.slice(0, 8);
    } catch (error) {
        console.error('Error generating AI recommendations:', error);
        return null; // Signals the route to use fallback recommendations
    }
};
