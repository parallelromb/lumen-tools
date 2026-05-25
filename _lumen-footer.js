// Shared widget injected into every Lumen tool. Adds a floating bottom-right
// dock with:
//   ❤ Like        — calls /api/rate, shows current count, dedup per visitor
//   ⬇ Download    — saves the live DOM state as a single-file HTML copy
//   🛠 Customize   — opens a modal explaining how to fork, edit defaults, host
//   ⭐ Star        — opens the GitHub repo
//   💬 Feedback   — opens a pre-filled GitHub issue scoped to this tool
//   ← All tools   — back to the index
//
// Plus fires the privacy-friendly analytics pixel.
(function () {
  if (window.__lumenFooterInjected) return;
  window.__lumenFooterInjected = true;

  // Load analytics pixel (see _lumen-analytics.js)
  const aScript = document.createElement('script');
  aScript.src = '/_lumen-analytics.js';
  aScript.async = true;
  document.head.appendChild(aScript);

  const path = location.pathname.split('/').pop() || 'index.html';
  const slug = path.replace(/\.html$/, '');
  if (slug === 'index' || slug === '') return; // landing page has its own UI

  const title = document.title || slug;
  const repoUrl = 'https://github.com/parallelromb/lumen-tools';
  const fileUrl = `${repoUrl}/blob/main/${path}`;
  const rawUrl = `https://raw.githubusercontent.com/parallelromb/lumen-tools/main/${path}`;
  const issueUrl =
    `${repoUrl}/issues/new?title=${encodeURIComponent('[' + slug + '] ')}&body=` +
    encodeURIComponent(`Tool: ${slug} (${title})\nURL: ${location.href}\n\n## What happened\n\n## What you expected\n\n`) +
    `&labels=${encodeURIComponent('tool: ' + slug)}`;

  // ── Styles, scoped + namespaced so we don't collide with tool CSS ──
  const css = document.createElement('style');
  css.textContent = `
    .lumen-dock { position: fixed; bottom: 12px; right: 12px; z-index: 99998;
      display: flex; gap: 6px; align-items: center;
      font: 500 12px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; }
    .lumen-dock button, .lumen-dock a {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 11px; border-radius: 9px; cursor: pointer;
      background: rgba(0,0,0,0.62); color: #fff; text-decoration: none;
      border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      transition: transform .12s, background .15s; font: inherit;
      white-space: nowrap; }
    .lumen-dock button:hover, .lumen-dock a:hover {
      background: rgba(0,113,227,0.85); transform: translateY(-1px); }
    .lumen-dock .lumen-like.liked { background: rgba(255,59,48,0.9); }
    .lumen-dock .lumen-count { opacity: 0.85; font-variant-numeric: tabular-nums; }

    /* Customize modal */
    .lumen-overlay { position: fixed; inset: 0; z-index: 99999; display: none;
      background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);
      align-items: center; justify-content: center; padding: 16px; }
    .lumen-overlay.open { display: flex; }
    .lumen-modal { background: #fff; color: #1d1d1f; border-radius: 16px;
      max-width: 560px; width: 100%; padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      font: 14px/1.55 -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; }
    .lumen-modal h3 { font-size: 18px; font-weight: 700; margin: 0 0 6px; letter-spacing: -0.01em; }
    .lumen-modal .lumen-sub { color: #6e6e73; font-size: 13px; margin-bottom: 18px; }
    .lumen-modal ol { padding-left: 18px; margin: 0; }
    .lumen-modal li { margin: 10px 0; }
    .lumen-modal code { background: #f5f5f7; padding: 1px 6px; border-radius: 4px;
      font: 12px 'JetBrains Mono', 'SF Mono', monospace; color: #1d1d1f; }
    .lumen-modal .lumen-cmd { display: block; background: #1d1d1f; color: #f5f5f7;
      padding: 10px 12px; border-radius: 8px; margin: 6px 0;
      font: 12px 'JetBrains Mono', 'SF Mono', monospace;
      overflow-x: auto; white-space: pre; }
    .lumen-modal .lumen-actions { margin-top: 22px; display: flex; gap: 8px; flex-wrap: wrap; }
    .lumen-modal .lumen-actions a, .lumen-modal .lumen-actions button {
      padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1);
      background: #f5f5f7; color: #1d1d1f; text-decoration: none; cursor: pointer;
      font: inherit; }
    .lumen-modal .lumen-actions .lumen-primary {
      background: #0071e3; color: #fff; border-color: #0071e3; }
    .lumen-modal .lumen-close { float: right; background: none; border: 0;
      font-size: 22px; cursor: pointer; color: #86868b; line-height: 1; padding: 0; }

    /* Toast */
    .lumen-toast { position: fixed; bottom: 70px; right: 12px; z-index: 99997;
      background: rgba(29,29,31,0.95); color: #fff;
      padding: 10px 14px; border-radius: 8px; font: 500 13px -apple-system, sans-serif;
      opacity: 0; transform: translateY(8px); transition: all .2s;
      pointer-events: none; backdrop-filter: blur(10px); }
    .lumen-toast.show { opacity: 1; transform: translateY(0); }

    @media (max-width: 520px) {
      .lumen-dock { right: 8px; bottom: 8px; gap: 4px; }
      .lumen-dock button, .lumen-dock a { padding: 6px 8px; font-size: 11px; }
      .lumen-dock .lumen-hide-mobile { display: none; }
    }
  `;
  document.head.appendChild(css);

  // ── Dock ────────────────────────────────────────────────────────
  const dock = document.createElement('div');
  dock.className = 'lumen-dock';
  dock.innerHTML = `
    <a class="lumen-hide-mobile" href="/" title="Back to all tools">← Tools</a>
    <button class="lumen-like" title="Like this tool">
      <span>❤</span><span class="lumen-count">…</span>
    </button>
    <button class="lumen-download" title="Download this tool as a single HTML file">⬇ Download</button>
    <button class="lumen-customize" title="Fork, customize, host on your own domain">🛠 Customize</button>
    <a class="lumen-hide-mobile" href="${repoUrl}" target="_blank" rel="noopener" title="Star the repo on GitHub">⭐ Star</a>
    <a class="lumen-hide-mobile" href="${issueUrl}" target="_blank" rel="noopener" title="Report a bug or suggest a fix">💬 Feedback</a>
  `;

  // ── Toast helper ────────────────────────────────────────────────
  const toast = document.createElement('div');
  toast.className = 'lumen-toast';
  function showToast(msg, ms = 2000) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), ms);
  }

  // ── Modal ───────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.className = 'lumen-overlay';
  overlay.innerHTML = `
    <div class="lumen-modal" role="dialog" aria-modal="true" aria-labelledby="lumen-modal-title">
      <button class="lumen-close" aria-label="Close">×</button>
      <h3 id="lumen-modal-title">Make it yours</h3>
      <p class="lumen-sub">This tool is a single HTML file under MIT. Take it, change the defaults, host it on your own domain — no build step, no backend.</p>
      <ol>
        <li><strong>Grab the file</strong> — click <em>⬇ Download</em> to save the current state, or fetch the latest:
          <span class="lumen-cmd">curl -O ${rawUrl}</span></li>
        <li><strong>Open it in your editor.</strong> Tool-specific defaults live near the top of the <code>&lt;script&gt;</code> tag — search for <code>PRESETS</code>, <code>DEFAULTS</code>, <code>CONFIG</code>, or the project names you want to replace.</li>
        <li><strong>Host it anywhere.</strong> Drop into Cloudflare Pages, GitHub Pages, Vercel, Netlify, or your own server:
          <span class="lumen-cmd">cp ${path} /var/www/html/</span></li>
      </ol>
      <div class="lumen-actions">
        <a class="lumen-primary" href="${fileUrl}" target="_blank" rel="noopener">View source on GitHub</a>
        <a href="${repoUrl}/fork" target="_blank" rel="noopener">Fork the repo</a>
        <a href="${repoUrl}#deploy" target="_blank" rel="noopener">Deploy guide</a>
      </div>
    </div>
  `;

  // ── Wire up after DOM is ready ──────────────────────────────────
  function mount() {
    document.body.appendChild(dock);
    document.body.appendChild(overlay);
    document.body.appendChild(toast);

    const likeBtn = dock.querySelector('.lumen-like');
    const countEl = dock.querySelector('.lumen-count');
    const dlBtn = dock.querySelector('.lumen-download');
    const customBtn = dock.querySelector('.lumen-customize');

    // Reflect prior local vote so it's instantly visible on revisit.
    const ratedKey = `lumen-rated:${slug}`;
    if (localStorage.getItem(ratedKey)) likeBtn.classList.add('liked');

    // Fetch initial count
    fetch(`/api/rate?tool=${encodeURIComponent(path)}`)
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((d) => { countEl.textContent = formatCount(d.count || 0); })
      .catch(() => { countEl.textContent = '·'; });

    likeBtn.addEventListener('click', async () => {
      // Soft client-side dedup; server enforces it too, but this hides the
      // round-trip and keeps the button feeling instant.
      if (likeBtn.classList.contains('liked')) {
        showToast('Already liked, thanks!');
        return;
      }
      likeBtn.classList.add('liked');
      try {
        const res = await fetch('/api/rate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: path }),
        });
        const d = await res.json();
        if (d.ok) {
          countEl.textContent = formatCount(d.count);
          localStorage.setItem(ratedKey, '1');
          showToast(d.alreadyRated ? 'Already liked from this IP' : 'Thanks!');
        }
      } catch {
        likeBtn.classList.remove('liked');
        showToast('Network error — try again');
      }
    });

    dlBtn.addEventListener('click', () => {
      // Save the live DOM so the user keeps whatever they've configured —
      // form fields, presets, notes. Strip the lumen-injected chrome (dock,
      // modal, toast, our script tags) so the downloaded file boots clean.
      const clone = document.documentElement.cloneNode(true);
      clone.querySelectorAll(
        '.lumen-dock, .lumen-overlay, .lumen-toast, ' +
        'script[src="/_lumen-footer.js"], script[src="/_lumen-analytics.js"]'
      ).forEach((n) => n.remove());
      const html = '<!DOCTYPE html>\n' + clone.outerHTML;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = path;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      showToast(`Saved ${path}`);
    });

    customBtn.addEventListener('click', () => overlay.classList.add('open'));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('lumen-close')) {
        overlay.classList.remove('open');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') overlay.classList.remove('open');
    });
  }

  function formatCount(n) {
    if (n < 1000) return String(n);
    if (n < 10000) return (n / 1000).toFixed(1) + 'k';
    return Math.round(n / 1000) + 'k';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
