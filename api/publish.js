const { put } = require('@vercel/blob');
const crypto = require('crypto');

const MAX_HTML_BYTES = 5 * 1024 * 1024;

function parseBody(req) {
  const body = req.body;
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
    return body;
  }
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (_) {
      return null;
    }
  }
  return null;
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = parseBody(req);
  const html = parsed && parsed.html;

  if (!html || typeof html !== 'string') {
    return res.status(400).json({ error: 'Missing html' });
  }

  if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
    return res.status(413).json({ error: 'HTML too large' });
  }

  const id = crypto.randomBytes(6).toString('base64url');
  const pathname = `outlines/${id}.html`;

  try {
    await put(pathname, html, {
      access: 'public',
      contentType: 'text/html; charset=utf-8',
      addRandomSuffix: false,
    });
  } catch (err) {
    console.error('Blob upload failed:', err);
    return res.status(500).json({ error: 'Failed to publish' });
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const url = `${proto}://${host}/p/${id}`;

  return res.status(200).json({ id, url });
};
