// Lumen Analytics — track endpoint
// Captures one pageview event. Aggressive bot filtering, privacy-friendly.

const BOT_UA_RE = /(bot|crawl|spider|slurp|wget|curl|headless|scrape|fetch|monitor|preview|googleother|gptbot|claudebot|claude-web|perplexity|cohere-ai|amazonbot|bytespider|petalbot|semrushbot|ahrefs|seznam|yandex|baidu|sogou)/i;
const ALLOWED_ORIGINS_RE = /^https?:\/\/([a-z0-9-]+\.)*(parallelromb\.dev|smara\.io|mcpdoctor\.(ai|io)|lumen-tools\.pages\.dev|cron-builder.*\.pages\.dev)(:\d+)?$/i;

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  if (!ALLOWED_ORIGINS_RE.test(origin) && !origin.startsWith('http://localhost')) {
    return json({ error: 'Origin not allowed' }, 403, origin);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }

  // Bot UA classification — server-side check, can't be lied to from client
  const ua = request.headers.get('User-Agent') || '';
  let ua_class = 'human';
  if (BOT_UA_RE.test(ua)) ua_class = 'bot';
  else if (ua.length < 20 || !/Mozilla/i.test(ua)) ua_class = 'likely_bot';

  // CF metadata
  const cf = request.cf || {};
  const country = (cf.country || '').slice(0, 2).toUpperCase() || null;
  const ip = request.headers.get('CF-Connecting-IP') || '';

  // Daily rotating salted hash (no raw IP stored)
  const today = new Date().toISOString().slice(0, 10);
  const salt = (env.ANALYTICS_SALT || 'lumen-default-salt') + ':' + today;
  const hashed = await sha256Hex(ip + '|' + ua.slice(0, 200) + '|' + salt);

  // Validate + truncate input fields
  const site = String(body.site || '').slice(0, 100);
  const path = String(body.path || '/').slice(0, 200);
  const referrer_host = body.referrer_host ? String(body.referrer_host).slice(0, 100) : null;
  const screen_w = parseInt(body.screen_w, 10) || null;
  const tz_offset = parseInt(body.tz_offset, 10) || null;

  const device_type = (() => {
    if (!screen_w) return null;
    if (screen_w < 768) return 'mobile';
    if (screen_w < 1100) return 'tablet';
    return 'desktop';
  })();

  await env.ANALYTICS.prepare(
    `INSERT INTO pageviews (ts, site, path, referrer_host, country, device_type, screen_w, tz_offset, hashed_visitor, ua_class)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(Date.now(), site, path, referrer_host, country, device_type, screen_w, tz_offset, hashed.slice(0, 32), ua_class).run();

  return json({ ok: true }, 200, origin);
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('Origin') || '') });
}

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function json(obj, status = 200, origin = '') {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}
// sendBeacon is always a credentialed request, and browsers refuse `*` for those —
// echo the (already allow-listed) origin so beacons from smara.io, mcpdoctor.ai,
// cron.parallelromb.dev and parallelromb.dev actually land.
function corsHeaders(origin = '') {
  const allowed = ALLOWED_ORIGINS_RE.test(origin) || origin.startsWith('http://localhost');
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://tools.parallelromb.dev',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}
