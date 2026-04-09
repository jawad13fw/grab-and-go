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

async function searchBingImages(query) {
  const url = 'https://www.bing.com/images/search?q=' + encodeURIComponent(query);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });
  const html = await res.text();
  const entries = [];
  const regex = /\[Explore this image\]\((https:\/\/www\.bing\.com\/images\/search\?view=detailV2[^)]+?mediaurl=([^&\)]+)[^)]+?)\)\s+\[([^\]]+)\]/g;
  let match;
  while ((match = regex.exec(html)) && entries.length < 8) {
    const detailUrl = match[1];
    const mediaUrl = decodeURIComponent(match[2]);
    const sourceTitle = match[3];
    entries.push({ detailUrl, mediaUrl, sourceTitle });
  }
  return entries;
}

for (const name of items) {
  console.log('### ' + name);
  try {
    const results = await searchBingImages(name);
    for (const result of results.slice(0, 5)) {
      console.log(result.sourceTitle);
      console.log(result.mediaUrl);
      console.log('---');
    }
  } catch (error) {
    console.log('ERROR', error.message);
  }
}
