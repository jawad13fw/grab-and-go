const fs = require('fs');
const path = require('path');
const https = require('https');

const outputDir = path.join(__dirname, 'frontend', 'public', 'shop-images');
const outputManifest = path.join(outputDir, 'manifest.json');

const IMAGE_PLAN = [
  { id: 'grocery-01', query: 'grocery-store,interior,shelves', category: 'grocery' },
  { id: 'grocery-02', query: 'supermarket,aisle,produce', category: 'grocery' },
  { id: 'grocery-03', query: 'fresh-produce,market', category: 'grocery' },
  { id: 'grocery-04', query: 'organic-store,fruits,vegetables', category: 'grocery' },
  { id: 'grocery-05', query: 'food-market,storefront', category: 'grocery' },

  { id: 'bakery-01', query: 'bakery,store,interior', category: 'bakery' },
  { id: 'bakery-02', query: 'bread,pastry,shop', category: 'bakery' },
  { id: 'bakery-03', query: 'dessert-shop,counter', category: 'bakery' },
  { id: 'bakery-04', query: 'artisan-bread,bakery-display', category: 'bakery' },
  { id: 'bakery-05', query: 'cake-shop,bakery', category: 'bakery' },

  { id: 'pharmacy-01', query: 'pharmacy,store,interior', category: 'pharmacy' },
  { id: 'pharmacy-02', query: 'medicine,shelves,store', category: 'pharmacy' },
  { id: 'pharmacy-03', query: 'healthcare,drugstore', category: 'pharmacy' },
  { id: 'pharmacy-04', query: 'medical-shop,interior', category: 'pharmacy' },
  { id: 'pharmacy-05', query: 'chemist,store', category: 'pharmacy' },

  { id: 'electronics-01', query: 'electronics-store,interior', category: 'electronics' },
  { id: 'electronics-02', query: 'gadgets,shop,display', category: 'electronics' },
  { id: 'electronics-03', query: 'mobile-shop,devices', category: 'electronics' },
  { id: 'electronics-04', query: 'computer-store,interior', category: 'electronics' },
  { id: 'electronics-05', query: 'tech-store,smartphones', category: 'electronics' },

  { id: 'fashion-01', query: 'fashion-store,interior', category: 'fashion' },
  { id: 'fashion-02', query: 'clothing-boutique,shop', category: 'fashion' },
  { id: 'fashion-03', query: 'apparel-store,racks', category: 'fashion' },
  { id: 'fashion-04', query: 'shoe-store,retail', category: 'fashion' },
  { id: 'fashion-05', query: 'streetwear-store', category: 'fashion' },

  { id: 'flowers-01', query: 'flower-shop,storefront', category: 'flowers' },
  { id: 'flowers-02', query: 'florist,interior,flowers', category: 'flowers' },
  { id: 'flowers-03', query: 'gift-shop,flowers', category: 'flowers' },
  { id: 'flowers-04', query: 'bouquet-store,floral', category: 'flowers' },
  { id: 'flowers-05', query: 'floral-boutique', category: 'flowers' },
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function requestBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
        const status = res.statusCode || 0;

        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
          if (redirects > 5) {
            reject(new Error('Too many redirects'));
            return;
          }
          const nextUrl = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, url).toString();
          resolve(requestBuffer(nextUrl, redirects + 1));
          return;
        }

        if (status < 200 || status >= 300) {
          reject(new Error(`HTTP ${status}`));
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });

    req.setTimeout(15000, () => {
      req.destroy(new Error('Request timeout'));
    });

    req.on('error', reject);
  });
}

async function downloadImage(planItem, index) {
  const seed = index + 1;
  const keyword = planItem.query
    .toLowerCase()
    .replace(/[^a-z0-9,]+/g, ',')
    .replace(/,+/g, ',')
    .replace(/^,|,$/g, '');
  const urls = [
    `https://loremflickr.com/1600/900/${keyword}?lock=${seed}`,
    `https://loremflickr.com/1600/900/${planItem.category},shop?lock=${seed + 100}`,
    `https://loremflickr.com/1600/900/store,interior?lock=${seed + 200}`,
  ];
  const fileName = `${planItem.id}.jpg`;
  const filePath = path.join(outputDir, fileName);

  let data = null;
  let lastError = null;

  for (const url of urls) {
    try {
      data = await requestBuffer(url);
      if (data && data.length > 0) {
        break;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!data || data.length === 0) {
    throw lastError || new Error('No image data returned');
  }

  fs.writeFileSync(filePath, data);

  return {
    id: planItem.id,
    category: planItem.category,
    query: planItem.query,
    file: `/shop-images/${fileName}`,
    bytes: data.length,
  };
}

async function run() {
  ensureDir(outputDir);

  const downloaded = [];
  const failed = [];

  console.log(`Downloading ${IMAGE_PLAN.length} shop images...`);

  for (let i = 0; i < IMAGE_PLAN.length; i += 1) {
    const item = IMAGE_PLAN[i];
    try {
      const result = await downloadImage(item, i);
      downloaded.push(result);
      console.log(`OK  ${result.id} -> ${result.file} (${Math.round(result.bytes / 1024)} KB)`);
    } catch (err) {
      failed.push({ id: item.id, category: item.category, error: err.message });
      console.log(`ERR ${item.id} -> ${err.message}`);
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    totalRequested: IMAGE_PLAN.length,
    totalDownloaded: downloaded.length,
    totalFailed: failed.length,
    images: downloaded,
    failed,
  };

  fs.writeFileSync(outputManifest, JSON.stringify(manifest, null, 2));

  console.log('--------------------------------------------');
  console.log(`Done. Downloaded: ${downloaded.length}, Failed: ${failed.length}`);
  console.log(`Manifest: ${outputManifest}`);
}

run().catch((err) => {
  console.error('Unexpected failure:', err.message);
  process.exitCode = 1;
});
