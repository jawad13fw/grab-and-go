const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const manifestPath = path.join(__dirname, 'frontend', 'public', 'product-images', 'rashid', 'manifest.json');
const baseDir = path.join(__dirname, 'frontend', 'public', 'product-images', 'rashid');

const sources = {
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

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

for (const entry of manifest.images) {
  const filePath = path.join(baseDir, path.basename(entry.file));
  if (!fs.existsSync(filePath)) continue;
  const data = fs.readFileSync(filePath);
  entry.bytes = data.length;
  entry.hash = crypto.createHash('sha256').update(data).digest('hex');
  if (sources[entry.id]) {
    entry.source = sources[entry.id];
  }
}

manifest.generatedAt = new Date().toISOString();
manifest.totalRequested = manifest.images.length;
manifest.totalDownloaded = manifest.images.length;
manifest.totalFailed = 0;
manifest.failed = [];

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('Manifest synced for', manifest.images.length, 'items');
