function parseMetadata(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  const descMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : null;

  const ogTitleMatch =
    html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : null;

  const ogDescMatch =
    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
  const ogDesc = ogDescMatch ? ogDescMatch[1].trim() : null;

  return {
    title: title || ogTitle || null,
    description: description || ogDesc || null,
  };
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; LightResearch/1.0)',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error('Direct fetch failed');
  return response.text();
}

async function fetchHtmlViaProxy(url) {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error('Proxy fetch failed');
  const data = await response.json();
  if (!data.contents) throw new Error('Empty proxy response');
  return data.contents;
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = req.query.url;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Invalid url' });
    }
  } catch (_) {
    return res.status(400).json({ error: 'Invalid url' });
  }

  try {
    let html;
    try {
      html = await fetchHtml(url);
    } catch (_) {
      html = await fetchHtmlViaProxy(url);
    }

    const metadata = parseMetadata(html);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).json(metadata);
  } catch (err) {
    return res.status(502).json({ error: 'Could not fetch url metadata' });
  }
};
