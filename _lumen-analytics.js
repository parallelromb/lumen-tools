// Lumen Analytics pixel — single-shot pageview beacon.
// Privacy: no cookies, no localStorage, no fingerprinting.
// What gets sent: hostname, path, referrer-hostname, screen width, timezone offset.
// IP + UA are seen by the server but only stored as a daily-rotating salted hash.
(function () {
  if (window.__lumenAnalyticsSent) return;
  window.__lumenAnalyticsSent = true;

  // Honor Do Not Track
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1') return;

  // Don't track localhost in dev
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;

  let referrer_host = null;
  try {
    if (document.referrer) {
      const r = new URL(document.referrer);
      if (r.hostname !== location.hostname) referrer_host = r.hostname;
    }
  } catch {}

  const payload = {
    site: location.hostname,
    path: location.pathname,
    referrer_host,
    screen_w: window.screen?.width || null,
    tz_offset: new Date().getTimezoneOffset(),
  };

  const send = () => {
    const url = 'https://tools.parallelromb.dev/api/track';
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  };

  // Defer briefly so it doesn't compete with first paint
  if (document.readyState === 'complete') {
    setTimeout(send, 100);
  } else {
    window.addEventListener('load', () => setTimeout(send, 100), { once: true });
  }
})();
