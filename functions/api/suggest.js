// Tool suggestion submission → relays to Telegram bot
// Required env vars (Pages → Settings → Environment variables):
//   TELEGRAM_BOT_TOKEN  — the bot's token
//   TELEGRAM_CHAT_ID    — the chat to post to (Sri's chat: 8710467825)

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { name = '', idea = '', email = '', honeypot = '' } = body;

  // Honeypot — bots fill hidden fields
  if (honeypot) return json({ ok: true }); // pretend success, drop silently

  if (!idea || idea.length < 10) {
    return json({ error: 'Tell us a bit more about the idea (min 10 chars)' }, 400);
  }
  if (idea.length > 2000) {
    return json({ error: 'Too long (max 2000 chars)' }, 400);
  }

  // Build Telegram message
  const safeName = (name || 'Anonymous').slice(0, 80);
  const safeEmail = email ? ` <${email.slice(0, 100)}>` : '';
  const safeIdea = idea.slice(0, 2000);
  const cf = request.cf || {};
  const meta = `${cf.country || '??'} · ${cf.city || ''}`.trim();

  const text = [
    `💡 New tool suggestion`,
    ``,
    `From: ${safeName}${safeEmail}`,
    `Where: ${meta}`,
    ``,
    safeIdea,
  ].join('\n');

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json({ error: 'Server not configured' }, 500);
  }

  const tgRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      disable_web_page_preview: true,
    }),
  });
  if (!tgRes.ok) {
    return json({ error: 'Could not relay suggestion' }, 502);
  }

  return json({ ok: true });
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
