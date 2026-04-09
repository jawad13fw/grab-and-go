const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const outputDir = path.join(__dirname, 'frontend', 'public', 'product-images', 'rashid');
const manifestPath = path.join(outputDir, 'manifest.json');

const RASHID_PRODUCTS = [
  { id: 'vehari-groc-rgs-1', name: 'Falak Sella Rice' },
  { id: 'vehari-groc-rgs-2', name: 'Guard Basmati Rice' },
  { id: 'vehari-groc-rgs-3', name: 'Sunridge Atta' },
  { id: 'vehari-groc-rgs-4', name: 'Bake Parlor Besan' },
  { id: 'vehari-groc-rgs-5', name: 'Taj Daal Chana' },
  { id: 'vehari-groc-rgs-6', name: 'Shan Karahi Masala' },
  { id: 'vehari-groc-rgs-7', name: 'National Biryani Masala' },
  { id: 'vehari-groc-rgs-8', name: 'Mehran Chat Masala' },
  { id: 'vehari-groc-rgs-9', name: 'Laziza Tikka Boti Masala' },
  { id: 'vehari-groc-rgs-10', name: 'Ahmed Qorma Masala' },
  { id: 'vehari-groc-rgs-11', name: 'Sufi Cooking Oil' },
  { id: 'vehari-groc-rgs-12', name: 'Habib Banaspati Ghee' },
  { id: 'vehari-groc-rgs-13', name: 'Mezan Oil' },
  { id: 'vehari-groc-rgs-14', name: 'Eva Canola Oil' },
  { id: 'vehari-groc-rgs-15', name: 'Kisan Ghee' },
  { id: 'vehari-groc-rgs-16', name: 'Haleeb Milk' },
  { id: 'vehari-groc-rgs-17', name: 'Prema Milk' },
  { id: 'vehari-groc-rgs-18', name: 'Anhaar Milk' },
  { id: 'vehari-groc-rgs-19', name: 'Nurpur Cheese' },
  { id: 'vehari-groc-rgs-20', name: 'Adams Cheese' },
  { id: 'vehari-groc-rgs-21', name: 'LU Gala Biscuits' },
  { id: 'vehari-groc-rgs-22', name: 'Peek Freans Sooper' },
  { id: 'vehari-groc-rgs-23', name: 'Prince Chocolate Biscuits' },
  { id: 'vehari-groc-rgs-24', name: 'English Biscuit Manufacturers Cake Rusk' },
  { id: 'vehari-groc-rgs-25', name: 'Dawn Cake' },
  { id: 'vehari-groc-rgs-26', name: 'Candyland Now Chocolate' },
  { id: 'vehari-groc-rgs-27', name: 'Nestle Munch' },
  { id: 'vehari-groc-rgs-28', name: 'Cadbury Perk' },
  { id: 'vehari-groc-rgs-29', name: 'Lays Masala Chips' },
  { id: 'vehari-groc-rgs-30', name: 'Kurkure Snacks' },
  { id: 'vehari-groc-rgs-31', name: 'Knorr Chicken Noodles' },
  { id: 'vehari-groc-rgs-32', name: 'Maggi Noodles' },
  { id: 'vehari-groc-rgs-33', name: 'Kolson Macaroni' },
  { id: 'vehari-groc-rgs-34', name: 'Bake Parlor Pasta' },
  { id: 'vehari-groc-rgs-35', name: 'National Kheer Mix' },
  { id: 'vehari-groc-rgs-36', name: 'Pakola Ice Cream Soda' },
  { id: 'vehari-groc-rgs-37', name: 'Gourmet Cola' },
  { id: 'vehari-groc-rgs-38', name: 'Shezan Mango Juice' },
  { id: 'vehari-groc-rgs-39', name: 'Fruita Vitals Juice' },
  { id: 'vehari-groc-rgs-40', name: 'Rooh Afza Sharbat' },
  { id: 'vehari-groc-rgs-41', name: 'Wheel Washing Powder' },
  { id: 'vehari-groc-rgs-42', name: 'Ariel Laundry Powder' },
  { id: 'vehari-groc-rgs-43', name: 'Express Dishwash Bar' },
  { id: 'vehari-groc-rgs-44', name: 'Robin Blue Fabric Whitener' },
  { id: 'vehari-groc-rgs-45', name: 'Finis Floor Cleaner' },
  { id: 'vehari-groc-rgs-46', name: 'Lifebuoy Soap' },
  { id: 'vehari-groc-rgs-47', name: 'Safeguard Soap' },
  { id: 'vehari-groc-rgs-48', name: 'Clear Shampoo' },
  { id: 'vehari-groc-rgs-49', name: 'Pantene Shampoo' },
  { id: 'vehari-groc-rgs-50', name: 'Medicam Soap' },
  { id: 'vehari-groc-rgs-51', name: 'Matchbox Ship Match' },
  { id: 'vehari-groc-rgs-52', name: 'Candles Local Brand' },
  { id: 'vehari-groc-rgs-53', name: 'Mosquito Coils Mortein Coil' },
  { id: 'vehari-groc-rgs-54', name: 'Aluminum Foil Butterfly Foil' },
  { id: 'vehari-groc-rgs-55', name: 'Plastic Bags' }
];

const IMAGE_OVERRIDES = {
  'vehari-groc-rgs-1': 'http://www.memonsupermarket.ca/cdn/shop/files/e170ee3c595ca2b81c00b887d6997694.jpg?v=1686358140',
  'vehari-groc-rgs-2': 'https://i0.wp.com/nepsto.dk/wp-content/uploads/2023/06/np_IMG-2568.jpg',
  'vehari-groc-rgs-3': 'https://www.designerpeople.com/wp-content/uploads/2023/10/atta-flour-packaging-header.jpg',
  'vehari-groc-rgs-4': 'https://static.wixstatic.com/media/caf46b_cd1eaffe3b33460ca9defd9adc38b260~mv2.jpg/v1/fit/w_500,h_500,q_90/file.jpg',
  'vehari-groc-rgs-5': 'https://www.gosupps.com/media/catalog/product/cache/25/small_image/375x450/9df78eab33525d08d6e5fb8d27136e95/9/1/91xk14DvrYL.jpg',
  'vehari-groc-rgs-6': 'https://i0.wp.com/basicvending.com/wp-content/uploads/2020/04/shan-karahi-masala.jpg?fit=1024%2C1024&ssl=1',
  'vehari-groc-rgs-7': 'https://pictures.grocerapps.com/original/grocerapp-national-biryani-masala-mix-5e6be6cdbe469.jpeg',
  'vehari-groc-rgs-8': 'https://baticrom.com/public/medies/Dec_2023/1701508376.656af5184e114.jpg',
  'vehari-groc-rgs-9': 'https://www.mulackal.com/images/thumbs/0000369_laziza-tikka-boti-masala-6x100g.png',
  'vehari-groc-rgs-10': 'https://karachiistanbul.com/wp-content/uploads/2021/02/country-qorma.png',
  'vehari-groc-rgs-11': 'https://punjabistore.com.pk/wp-content/uploads/2022/10/sufi-sunflower-cooking-oil-5-ltr-600x600.jpg',
  'vehari-groc-rgs-12': 'https://www.24mycart.pk/cdn/shop/products/6297000027197_1200x1200.jpg?v=1593610450',
  'vehari-groc-rgs-13': 'https://pictures.grocerapps.com/original/grocerapp-mezan-cooking-oil-5e6ce840da1ce.png',
  'vehari-groc-rgs-14': 'https://pictures.grocerapps.com/original/grocerapp-eva-canola-oil-bottle-5e6c749b595b2.png',
  'vehari-groc-rgs-15': 'https://kisan.com.pk/cdn/shop/files/KisanBanaspatil5KgTin409671905_PK-1961460148_5db0c56a-4904-47d6-a7ea-28d8783aacee_500x.jpg?v=1689053303',
  'vehari-groc-rgs-16': 'https://cdn.bazaar.technology/live/images/product/55ec6ac9-0524-44fd-bb75-45b70fbb5f80.webp',
  'vehari-groc-rgs-17': 'https://prema.pk/wp-content/uploads/2019/08/milk-estore-1-450x450.png',
  'vehari-groc-rgs-18': 'https://alfatah.pk/cdn/shop/files/afp-000115679.png?v=1690208249&width=1946',
  'vehari-groc-rgs-19': 'https://cdn.bazaar.technology/live/images/product/2babda9e-8661-4482-b71f-96cd1034d523.webp',
  'vehari-groc-rgs-20': 'https://adamscheese.shop/wp-content/uploads/2020/01/17_original-600x600.jpeg'
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function requestBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const hardTimeout = setTimeout(() => {
      controller.abort();
    }, 20000);

    const req = https.get(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GrabGoImageBot/1.0)'
      }
    }, (res) => {
      const status = res.statusCode || 0;

      if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
        clearTimeout(hardTimeout);
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
        clearTimeout(hardTimeout);
        reject(new Error(`HTTP ${status}`));
        return;
      }

      const chunks = [];
      res.setTimeout(20000, () => {
        req.destroy(new Error('Response timeout'));
      });
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        clearTimeout(hardTimeout);
        resolve(Buffer.concat(chunks));
      });
    });

    req.setTimeout(20000, () => {
      req.destroy(new Error('Request timeout'));
    });

    req.on('error', (err) => {
      clearTimeout(hardTimeout);
      reject(err);
    });
  });
}

async function requestJson(url) {
  const data = await requestBuffer(url);
  return JSON.parse(data.toString('utf8'));
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function makeKeyword(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .trim()
    .replace(/\s+/g, ',');
}

function hashBuffer(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function getExistingImage(productId) {
  const fileName = `${productId}.jpg`;
  const filePath = path.join(outputDir, fileName);
  if (!fs.existsSync(filePath)) return null;

  const data = fs.readFileSync(filePath);
  if (!data || data.length < 8000) return null;

  return {
    fileName,
    bytes: data.length,
    hash: hashBuffer(data)
  };
}

async function searchBingFirstMediaUrl(query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
  const res = await requestBuffer(url);
  const html = res.toString('utf8');
  const match = html.match(/mediaurl=([^&"'\s>]+)/i);
  if (!match) return null;

  let mediaUrl = match[1];
  mediaUrl = decodeHtmlEntities(mediaUrl);
  try {
    return decodeURIComponent(mediaUrl);
  } catch (_) {
    return mediaUrl;
  }
}

function dedupeUrls(urls) {
  const seen = new Set();
  const out = [];
  for (const url of urls) {
    if (typeof url !== 'string' || !url.startsWith('http')) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

async function buildCandidateUrls(product, index) {
  if (IMAGE_OVERRIDES[product.id]) {
    return [IMAGE_OVERRIDES[product.id]];
  }

  const queryVariants = [
    product.name,
    `${product.name} pack`,
    `${product.name} product`
  ];

  const sourceUrls = [];
  for (const query of queryVariants) {
    const mediaUrl = await searchBingFirstMediaUrl(query);
    if (mediaUrl) {
      sourceUrls.push(mediaUrl);
    }
  }

  const keyword = makeKeyword(product.name);
  const fallbackUrls = [
    `https://loremflickr.com/1000/1000/${keyword},packaging,product?lock=${index + 1}`,
    `https://loremflickr.com/1000/1000/${keyword},grocery,pack?lock=${index + 301}`,
    `https://picsum.photos/seed/${product.id}-${index + 1}/1000/1000`
  ];

  return dedupeUrls([...sourceUrls, ...fallbackUrls]);
}

async function downloadProductImage(product, index, usedHashes) {
  const urls = await buildCandidateUrls(product, index);
  let lastError = null;

  for (const url of urls) {
    try {
      const data = await requestBuffer(url);
      if (!data || data.length < 8000) {
        continue;
      }

      const hash = hashBuffer(data);
      if (usedHashes.has(hash)) {
        continue;
      }

      const fileName = `${product.id}.jpg`;
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, data);
      usedHashes.add(hash);

      return {
        id: product.id,
        name: product.name,
        file: `/product-images/rashid/${fileName}`,
        bytes: data.length,
        hash,
        source: url
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('No usable image data returned');
}

async function run() {
  ensureDir(outputDir);

  const downloaded = [];
  const failed = [];
  const usedHashes = new Set();

  console.log(`Downloading ${RASHID_PRODUCTS.length} Rashid product images...`);

  for (let i = 0; i < RASHID_PRODUCTS.length; i += 1) {
    const product = RASHID_PRODUCTS[i];
    try {
      const result = await downloadProductImage(product, i, usedHashes);
      downloaded.push(result);
      console.log(`OK  ${i + 1}/${RASHID_PRODUCTS.length} ${product.id}`);
    } catch (err) {
      const existing = getExistingImage(product.id);
      if (existing && !usedHashes.has(existing.hash)) {
        usedHashes.add(existing.hash);
        downloaded.push({
          id: product.id,
          name: product.name,
          file: `/product-images/rashid/${existing.fileName}`,
          bytes: existing.bytes,
          hash: existing.hash,
          source: 'existing-local-file'
        });
        console.log(`OK  ${i + 1}/${RASHID_PRODUCTS.length} ${product.id} (reused)`);
      } else {
        failed.push({ id: product.id, name: product.name, error: err.message });
        console.log(`ERR ${product.id} -> ${err.message}`);
      }
    }
  }

  // Reconcile any missing products from existing local files.
  const downloadedIds = new Set(downloaded.map((item) => item.id));
  const reconciledFailed = [];
  for (const product of RASHID_PRODUCTS) {
    if (downloadedIds.has(product.id)) continue;

    const existing = getExistingImage(product.id);
    if (existing) {
      downloaded.push({
        id: product.id,
        name: product.name,
        file: `/product-images/rashid/${existing.fileName}`,
        bytes: existing.bytes,
        hash: existing.hash,
        source: 'existing-local-file-reconciled'
      });
      downloadedIds.add(product.id);
      console.log(`OK  reconciled ${product.id}`);
    } else {
      reconciledFailed.push(product.id);
    }
  }

  if (reconciledFailed.length > 0) {
    const failedById = new Map(failed.map((item) => [item.id, item]));
    failed.length = 0;
    for (const id of reconciledFailed) {
      failed.push(failedById.get(id) || { id, name: id, error: 'No local file available after retries' });
    }
  } else {
    failed.length = 0;
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    totalRequested: RASHID_PRODUCTS.length,
    totalDownloaded: downloaded.length,
    totalFailed: failed.length,
    images: downloaded,
    failed
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('--------------------------------------------');
  console.log(`Done. Downloaded: ${downloaded.length}, Failed: ${failed.length}`);
  console.log(`Manifest: ${manifestPath}`);
}

run().catch((err) => {
  console.error('Unexpected failure:', err.message);
  process.exitCode = 1;
});
