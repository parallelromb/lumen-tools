// Shared widget injected into every Lumen tool — adds a small footer link
// for filing a GitHub issue scoped to this tool, plus fires the analytics pixel.
(function () {
  if (window.__lumenFooterInjected) return;
  window.__lumenFooterInjected = true;

  // Load analytics pixel (privacy-friendly, no cookies, see _lumen-analytics.js)
  const aScript = document.createElement('script');
  aScript.src = '/_lumen-analytics.js';
  aScript.async = true;
  document.head.appendChild(aScript);

  const path = location.pathname.split('/').pop() || 'index.html';
  const slug = path.replace(/\.html$/, '');
  if (slug === 'index' || slug === '') return; // landing page already has its own footer

  const title = document.title || slug;
  const issueTitle = encodeURIComponent(`[${slug}] `);
  const issueBody = encodeURIComponent(
    `Tool: ${slug} (${title})\nURL: ${location.href}\n\n## What happened\n\n## What you expected\n\n`
  );
  const issueUrl = `https://github.com/parallelromb/lumen-tools/issues/new?title=${issueTitle}&body=${issueBody}&labels=${encodeURIComponent('tool: ' + slug)}`;

  const wrap = document.createElement('div');
  wrap.style.cssText =
    'position:fixed;bottom:8px;right:8px;z-index:9999;display:flex;gap:6px;' +
    'font:500 11px -apple-system,BlinkMacSystemFont,"Inter",sans-serif;';

  const link = (href, label, title) => {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.title = title;
    a.textContent = label;
    a.style.cssText =
      'padding:6px 10px;border-radius:8px;background:rgba(0,0,0,0.55);color:#fff;' +
      'text-decoration:none;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
      'border:1px solid rgba(255,255,255,0.1);transition:all .15s';
    a.onmouseenter = () => (a.style.background = 'rgba(0,113,227,0.85)');
    a.onmouseleave = () => (a.style.background = 'rgba(0,0,0,0.55)');
    return a;
  };

  wrap.appendChild(link('/', '← All tools', 'Back to Lumen Tools'));
  wrap.appendChild(link(issueUrl, '💬 Feedback', 'Report a bug or suggest a fix on GitHub'));
  wrap.appendChild(link('https://github.com/parallelromb/lumen-tools', '⭐ Star', 'Star the repo on GitHub'));

  // Defer to after page renders
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(wrap));
  } else {
    document.body.appendChild(wrap);
  }
})();
