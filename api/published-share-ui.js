const QR_BUTTON =
  '<button type="button" class="lr-qr-btn" id="lr-qr-btn" aria-label="Show QR code">QR code</button>';

const SHARE_STYLES = [
  '.export-header { display: flex; align-items: center; gap: 0.6rem; margin: 0 0 1.5rem; border-bottom: 1px dotted #ccc; padding-bottom: 0.5rem; flex-shrink: 0; }',
  '.export-header .export-title { margin: 0; border-bottom: none; padding-bottom: 0; flex: 0 1 auto; min-width: 0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; font-size: 0.72rem; letter-spacing: 0.04em; }',
  '.lr-qr-btn { flex-shrink: 0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; font-size: 0.68rem; letter-spacing: 0.04em; color: #666; background: transparent; border: 1px solid #ddd; border-radius: 0; padding: 0.25rem 0.5rem; cursor: pointer; white-space: nowrap; }',
  '.lr-qr-btn:hover { color: #333; border-color: #ccc; }',
  '.lr-qr-overlay { position: fixed; inset: 0; z-index: 9100; display: flex; align-items: center; justify-content: center; padding: 1.5rem; background: rgba(0,0,0,0.35); }',
  '.lr-qr-overlay[hidden] { display: none; }',
  '.lr-qr-modal { position: relative; width: min(100%, 20rem); padding: 1.5rem 1.25rem 1.25rem; background: #fffef9; border: 1px solid #ddd; border-radius: 0; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }',
  '.lr-qr-close { position: absolute; top: 0.5rem; right: 0.65rem; background: none; border: none; font-size: 1.25rem; line-height: 1; color: #bbb; cursor: pointer; padding: 0; }',
  '.lr-qr-close:hover { color: #666; }',
  '.lr-qr-title { margin: 0 0 1rem; font-size: 0.78rem; font-weight: normal; color: #666; letter-spacing: 0.06em; text-transform: uppercase; }',
  '.lr-qr-overlay .lr-qr-img { display: block; margin: 0 auto; border: none; border-radius: 0; background: #fff; }',
  '.lr-qr-url { margin: 0.85rem 0 0; font-size: 0.72rem; color: #999; word-break: break-all; line-height: 1.35; }',
].join('\n');

const SHARE_MARKUP =
  '<div class="lr-qr-overlay" id="lr-qr-overlay" hidden>' +
  '<div class="lr-qr-modal" role="dialog" aria-modal="true" aria-labelledby="lr-qr-title">' +
  '<button type="button" class="lr-qr-close" id="lr-qr-close" aria-label="Close">&times;</button>' +
  '<h2 class="lr-qr-title" id="lr-qr-title">Scan to open</h2>' +
  '<img class="lr-qr-img" id="lr-qr-img" alt="QR code for this page" width="240" height="240">' +
  '<p class="lr-qr-url" id="lr-qr-url"></p>' +
  '</div></div>';

const SHARE_SCRIPT =
  '<script>(function(){' +
  'var btn=document.getElementById("lr-qr-btn");' +
  'var overlay=document.getElementById("lr-qr-overlay");' +
  'var img=document.getElementById("lr-qr-img");' +
  'var urlEl=document.getElementById("lr-qr-url");' +
  'var closeBtn=document.getElementById("lr-qr-close");' +
  'if(!btn||!overlay||!img)return;' +
  'function openQr(){var u=location.href;urlEl.textContent=u;' +
  'img.src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data="+encodeURIComponent(u);overlay.hidden=false;}' +
  'function closeQr(){overlay.hidden=true;}' +
  'btn.addEventListener("click",openQr);' +
  'closeBtn.addEventListener("click",closeQr);' +
  'overlay.addEventListener("click",function(e){if(e.target===overlay)closeQr();});' +
  'document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!overlay.hidden)closeQr();});' +
  '})();<\/script>';

function stripLegacyShareUi(html) {
  let out = html;

  out = out.replace(/<style>\s*\.export-header[\s\S]*?\.lr-qr-url\s*\{[^}]+\}\s*<\/style>\s*/g, '');

  out = out.replace(/<div class="lr-qr-overlay"[\s\S]*?<\/div>\s*<\/div>\s*/g, '');

  out = out.replace(
    /<script>\(function\(\)\{var btn=document\.getElementById\("lr-qr-btn"\)[\s\S]*?<\/script>\s*/g,
    ''
  );
  out = out.replace(
    /<script>\(function\(\)\{var img=document\.getElementById\("lr-qr-img"\)[\s\S]*?<\/script>\s*/g,
    ''
  );

  out = out.replace(
    /<div class="export-header">\s*(<h1 class="export-title">[\s\S]*?<\/h1>)\s*(?:<img\b[^>]*\bclass="lr-qr-img"[^>]*>|<button[^>]*\blr-qr-btn\b[^>]*>[\s\S]*?<\/button>)?\s*<\/div>/gi,
    '$1'
  );

  return out;
}

function appendPublishedShareUi(html) {
  const normalized = stripLegacyShareUi(html);
  const withHeader = normalized.replace(
    /(<h1 class="export-title">[\s\S]*?<\/h1>)/,
    '<div class="export-header">$1' + QR_BUTTON + '</div>'
  );
  const injection = '<style>\n' + SHARE_STYLES + '\n</style>\n' + SHARE_MARKUP + '\n' + SHARE_SCRIPT;
  return withHeader.replace('</body>', injection + '\n</body>');
}

function patchPublishedHtml(html) {
  if (!html.includes('export-title')) return html;
  return appendPublishedShareUi(html);
}

module.exports = {
  appendPublishedShareUi,
  patchPublishedHtml,
  stripLegacyShareUi,
};
