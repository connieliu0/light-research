const { list } = require('@vercel/blob');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [{ blobs: outlineBlobs }, { blobs: mapBlobs }] = await Promise.all([
      list({ prefix: 'outlines/' }),
      list({ prefix: 'maps/' }),
    ]);

    const parseBlob = (blob, type) => {
      const match = blob.pathname.match(/(?:outlines|maps)\/([^.]+)\.html$/);
      const id = match ? match[1] : null;
      if (!id) return null;
      return {
        id,
        type,
        url: blob.url,
        uploadedAt: blob.uploadedAt,
        size: blob.size,
      };
    };

    const items = [
      ...outlineBlobs.map((blob) => parseBlob(blob, 'outline')),
      ...mapBlobs.map((blob) => parseBlob(blob, 'map')),
    ].filter(Boolean);

    // Sort by most recently uploaded
    items.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return res.status(200).json({ items });
  } catch (err) {
    console.error('Failed to list blobs:', err);
    return res.status(500).json({ error: 'Failed to load gallery' });
  }
};
