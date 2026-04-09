const fs = require('fs');
const path = require('path');
const https = require('https');

const publicDir = 'c:\\Users\\MLS\\OneDrive\\Desktop\\New folder\\frontend\\public';

// Category images mapping with relevant Unsplash image IDs
const categoryImages = {
  grocery: {
    id: '1578916171728-46686eac8d58',
    name: 'Grocery Store',
    filename: 'category-grocery.png'
  },
  electronics: {
    id: '1498049860654-af1a5c5668ba',
    name: 'Electronics',
    filename: 'category-electronics.png'
  },
  fashion: {
    id: '1445205170230-053b83016050',
    name: 'Fashion/Clothing',
    filename: 'category-fashion.png'
  },
  pharmacy: {
    id: '1631549916768-4119b2e5f926',
    name: 'Pharmacy/Medicine',
    filename: 'category-pharmacy.png'
  },
  bakery: {
    id: '1555507036-ab1f4038808a',
    name: 'Bakery',
    filename: 'category-bakery.png'
  },
  hardware: {
    id: '1530124566582-a618bc2615dc',
    name: 'Hardware/Tools',
    filename: 'category-hardware.png'
  },
  cosmetics: {
    id: '1596462502278-27bfdc403348',
    name: 'Cosmetics/Beauty',
    filename: 'category-cosmetics.png'
  },
  computers: {
    id: '1511707171634-5f897ff02aa9',
    name: 'Mobile & Computer',
    filename: 'category-computers.png'
  },
  documents: {
    id: '1586075010923-2dd4570fb338',
    name: 'Documents/Parcel',
    filename: 'category-documents.png'
  },
  flowers: {
    id: '1487530811176-3780de880c2d',
    name: 'Flowers/Gifts',
    filename: 'category-flowers.png'
  }
};

async function downloadImage(imageId, filename, categoryName) {
  const url = `https://images.unsplash.com/photo-${imageId}?w=600&q=80`;
  const filePath = path.join(publicDir, filename);
  
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${categoryName}...`);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        console.error(`❌ Failed to download ${categoryName}: HTTP ${response.statusCode}`);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      const writer = fs.createWriteStream(filePath);
      
      response.pipe(writer);
      
      writer.on('finish', () => {
        console.log(`✅ Saved: ${filename}`);
        resolve();
      });
      
      writer.on('error', (err) => {
        console.error(`❌ Error saving ${filename}:`, err.message);
        reject(err);
      });
    }).on('error', (err) => {
      console.error(`❌ Download error for ${categoryName}:`, err.message);
      reject(err);
    });
  });
}

async function downloadAllImages() {
  console.log('📥 Downloading category images from Unsplash...\n');
  
  let success = 0;
  let failed = 0;
  
  for (const [categoryId, imageData] of Object.entries(categoryImages)) {
    try {
      await downloadImage(
        imageData.id, 
        imageData.filename, 
        imageData.name
      );
      success++;
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      failed++;
      console.log(`⚠️  Skipping ${imageData.filename}`);
    }
  }
  
  console.log('\n===========================================');
  console.log(`✅ Download complete!`);
  console.log(`   Success: ${success}/${Object.keys(categoryImages).length}`);
  console.log(`   Failed: ${failed}/${Object.keys(categoryImages).length}`);
  console.log('===========================================\n');
  
  console.log('📁 Images saved to:', publicDir);
  console.log('\n📋 Category images list:');
  Object.values(categoryImages).forEach(img => {
    const exists = fs.existsSync(path.join(publicDir, img.filename));
    console.log(`   ${exists ? '✅' : '❌'} ${img.filename} - ${img.name}`);
  });
}

// Run the download
downloadAllImages().catch(console.error);
