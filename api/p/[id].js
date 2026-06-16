const { list } = require('@vercel/blob');
const { patchPublishedHtml } = require('../published-share-ui');

const ID_PATTERN = /^[a-zA-Z0-9_-]{6,16}$/;

module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id || !ID_PATTERN.test(id)) {
    return res.status(400).send('Invalid id');
  }

  const pathnameCandidates = [`outlines/${id}.html`, `maps/${id}.html`];

  try {
    for (const pathname of pathnameCandidates) {
      const { blobs } = await list({ prefix: pathname, limit: 10 });
      const blob = blobs.find((b) => b.pathname === pathname);

      if (!blob) continue;

      const response = await fetch(blob.url);
      if (!response.ok) {
        return res.status(404).send('Not found');
      }

      const html = patchPublishedHtml(await response.text());

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
      return res.status(200).send(html);
    }

    return res.status(404).send('Not found');
  } catch (err) {
    console.error('Blob fetch failed:', err);
    return res.status(500).send('Server error');
  }
};
