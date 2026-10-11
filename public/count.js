// Anonymous counting for Ley's dashboard: one event name (and a mood or Soft/Loud) per beacon — no cookies,
// no IDs, never the words or pictures. A "seen today" flag stays on this device so a visitor is counted once a
// day. Browsers that send Do Not Track or Global Privacy Control are not counted at all.
const off = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';

export function count(e, k = '', extra = {}) {
  if (off || !navigator.sendBeacon) return;
  try { navigator.sendBeacon('hit.php', new Blob([JSON.stringify({ e, k, ...extra })], { type: 'application/json' })); } catch { /* never break the page */ }
}

function source() {
  const ua = navigator.userAgent;
  if (/musical_ly|Bytedance|TikTok/i.test(ua)) return 'tiktok';   // in-app browsers often send no referrer
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return /Messenger|FBAN\/MessengerForiOS|Orca/i.test(ua) ? 'messenger' : 'facebook';
  let host = '';
  try { host = new URL(document.referrer).hostname; } catch { return 'direct'; }
  if (!host || host === location.hostname) return 'direct';
  if (/tiktok\./.test(host)) return 'tiktok';
  if (/instagram\./.test(host)) return 'instagram';
  if (/messenger\./.test(host)) return 'messenger';
  if (/facebook\.|fb\.me/.test(host)) return 'facebook';
  if (/google\./.test(host)) return 'google';
  if (/leyzays|leysays/.test(host)) return 'leyzays';
  return 'other';
}

export function visit(page) {
  const day = new Date().toLocaleDateString('en-CA');
  let first = 0;
  try { if (localStorage.getItem('overleyz-seen') !== day) { localStorage.setItem('overleyz-seen', day); first = 1; } } catch { /* private mode */ }
  count('visit', page, first ? { u: 1, r: source(), d: matchMedia('(pointer: coarse)').matches ? 'phone' : 'computer' } : {});
}
