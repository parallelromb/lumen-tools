// Tool rating endpoint — thumbs-up only.
// Stores per-tool count in Cloudflare KV.
//
// Required bindings (Pages → Settings → Functions → KV bindings):
//   RATINGS  — KV namespace
//
// Optional env (for ping notifications on milestones):
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

const ALLOWED_TOOLS_RE = /^[a-z0-9-]+\.html$/;

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const tool = String(body.tool || '');
  if (!ALLOWED_TOOLS_RE.test(tool)) {
    return json({ error: 'Invalid tool id' }, 400);
  }

  // Soft per-IP dedup so a single visitor can't farm a tool to 1000 votes
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const dedupKey = `dedup:${tool}:${ip}`;
  const existing = await env.RATINGS.get(dedupKey);
  if (existing) {
    const count = parseInt(await env.RATINGS.get(`count:${tool}`) || '0', 10);
    return json({ ok: true, count, alreadyRated: true });
  }

  // Increment count
  const countKey = `count:${tool}`;
  const before = parseInt(await env.RATINGS.get(countKey) || '0', 10);
  const after = before + 1;
  await env.RATINGS.put(countKey, String(after));
  // Dedup key expires after 30 days — long enough to be meaningful
  await env.RATINGS.put(dedupKey, '1', { expirationTtl: 60 * 60 * 24 * 30 });

  // Telegram ping on milestones (10, 50, 100, 500, 1000)
  if ([10, 50, 100, 500, 1000].includes(after)
      && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: `🎉 Tool milestone: ${tool} hit ${after} thumbs-ups`,
        disable_web_page_preview: true,
      }),
    }).catch(() => {});
  }

  return json({ ok: true, count: after, alreadyRated: false });
}

export async function onRequestGet({ request, env }) {
  // Return all counts so the landing page can show them
  const url = new URL(request.url);
  const tool = url.searchParams.get('tool');
  if (tool) {
    if (!ALLOWED_TOOLS_RE.test(tool)) return json({ error: 'Invalid tool' }, 400);
    const count = parseInt(await env.RATINGS.get(`count:${tool}`) || '0', 10);
    return json({ tool, count });
  }
  // Bulk: list all count: keys
  const list = await env.RATINGS.list({ prefix: 'count:' });
  const out = {};
  for (const k of list.keys) {
    const v = parseInt(await env.RATINGS.get(k.name) || '0', 10);
    out[k.name.slice('count:'.length)] = v;
  }
  return json({ counts: out });
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
