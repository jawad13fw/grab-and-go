const items = [
  'Falak Sella Rice',
  'Guard Basmati Rice',
  'Sunridge Atta',
  'Bake Parlor Besan',
  'Taj Daal Chana',
  'Shan Karahi Masala',
  'National Biryani Masala',
  'Mehran Chat Masala',
  'Laziza Tikka Boti Masala',
  'Ahmed Qorma Masala'
];

async function searchCommons(query) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(query) + '&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json&origin=*';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const json = await res.json();
  const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
  return pages.map((page) => ({
    title: page.title || '',
    url: page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url || ''
  }));
}

async function searchOff(query) {
  const url = 'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(query) + '&search_simple=1&action=process&json=1&page_size=5';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) return [];
  const text = await res.text();
  if (!text.trim().startsWith('{')) return [];
  const json = JSON.parse(text);
  const products = Array.isArray(json.products) ? json.products : [];
  return products.map((product) => ({
    title: product.product_name || product.product_name_en || '',
    url: product.image_front_url || product.image_url || '',
    brands: product.brands || ''
  }));
}

for (const name of items) {
  console.log('### ' + name);
  const [commons, off] = await Promise.all([
    searchCommons(name),
    searchOff(name)
  ]);

  console.log('COMMONS');
  for (const item of commons.slice(0, 3)) {
    console.log(item.title);
    console.log(item.url);
    console.log('---');
  }

  console.log('OFF');
  for (const item of off.slice(0, 3)) {
    console.log(item.title);
    console.log(item.url);
    console.log(item.brands);
    console.log('---');
  }
}
