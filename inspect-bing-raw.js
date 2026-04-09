const items = process.argv.slice(2);

async function extractFirstMediaUrl(query) {
  const url = 'https://www.bing.com/images/search?q=' + encodeURIComponent(query);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const match = html.match(/mediaurl=([^&"'\s>]+)/i);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].replace(/&amp;/g, '&'));
  } catch (_) {
    return match[1];
  }
}

for (const item of items) {
  const mediaUrl = await extractFirstMediaUrl(item);
  console.log(item);
  console.log(mediaUrl || 'NO_MEDIA_URL');
  console.log('---');
}
