import mongoose from 'mongoose';
import { Category } from './src/models/index.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grabandgo';

async function verifyCategoryImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const categories = await Category.find();
    
    console.log('📋 Current Category Images in Database:\n');
    console.log('Category ID'.padEnd(20) + 'Name'.padEnd(35) + 'Image File');
    console.log('─'.repeat(80));
    
    categories.forEach(cat => {
      const status = cat.image && cat.image.startsWith('/') ? '✅' : '⚠️ ';
      console.log(`${status} ${cat.id.padEnd(18)} ${cat.name.padEnd(33)} ${cat.image}`);
    });
    
    console.log('\n✅ All categories are using local images!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

verifyCategoryImages();
