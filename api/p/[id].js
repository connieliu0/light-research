const { list } = require('@vercel/blob');

const ID_PATTERN = /^[a-zA-Z0-9_-]{6,16}$/;

module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id || !ID_PATTERN.test(id)) {
    return res.status(400).send('Invalid id');
  }

  const pathname = `outlines/${id}.html`;

  try {
    const { blobs } = await list({ prefix: pathname, limit: 10 });
    const blob = blobs.find((b) => b.pathname === pathname);

    if (!blob) {
      return res.status(404).send('Not found');
    }

    const response = await fetch(blob.url);
    if (!response.ok) {
      return res.status(404).send('Not found');
    }

    const html = await response.text();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Blob fetch failed:', err);
    return res.status(500).send('Server error');
  }
};
