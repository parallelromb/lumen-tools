// Lumen Analytics — stats endpoint
// Returns aggregated stats for the dashboard.
// Query params:
//   site=tools.parallelromb.dev   (optional, filters to one site)
//   days=7                         (default 7)
//   include_bots=1                 (default: humans only)

export async function onRequestGet({ request, env }) {
  // Locked-down — only callers with STATS_SECRET (Lumen dashboard) can read.
  // The /api/track endpoint stays public so any site can fire pageview beacons.
  const auth = request.headers.get('Authorization') || '';
  const expected = `Bearer ${env.STATS_SECRET || ''}`;
  if (!env.STATS_SECRET || auth !== expected) {
    return json({ error: 'Forbidden' }, 403);
  }

  const url = new URL(request.url);
  const site = url.searchParams.get('site');
  const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('days') || '7', 10)));
  const includeBots = url.searchParams.get('include_bots') === '1';

  const since = Date.now() - days * 86400 * 1000;
  const uaFilter = includeBots ? '' : `AND ua_class = 'human'`;
  const siteFilter = site ? `AND site = ?` : '';
  const params = site ? [since, site] : [since];

  // 1) Daily counts
  const daily = await env.ANALYTICS.prepare(
    `SELECT date(ts/1000, 'unixepoch') AS day,
            COUNT(*) AS views,
            COUNT(DISTINCT hashed_visitor) AS uniques
     FROM pageviews
     WHERE ts >= ? ${siteFilter} ${uaFilter}
     GROUP BY day
     ORDER BY day ASC`
  ).bind(...params).all();

  // 2) Top paths
  const topPaths = await env.ANALYTICS.prepare(
    `SELECT site, path, COUNT(*) AS views, COUNT(DISTINCT hashed_visitor) AS uniques
     FROM pageviews
     WHERE ts >= ? ${siteFilter} ${uaFilter}
     GROUP BY site, path
     ORDER BY views DESC
     LIMIT 20`
  ).bind(...params).all();

  // 3) Top referrers
  const topReferrers = await env.ANALYTICS.prepare(
    `SELECT COALESCE(referrer_host, '(direct)') AS source,
            COUNT(*) AS views
     FROM pageviews
     WHERE ts >= ? ${siteFilter} ${uaFilter}
     GROUP BY source
     ORDER BY views DESC
     LIMIT 15`
  ).bind(...params).all();

  // 4) Top countries
  const topCountries = await env.ANALYTICS.prepare(
    `SELECT COALESCE(country, '??') AS country, COUNT(*) AS views, COUNT(DISTINCT hashed_visitor) AS uniques
     FROM pageviews
     WHERE ts >= ? ${siteFilter} ${uaFilter}
     GROUP BY country
     ORDER BY views DESC
     LIMIT 15`
  ).bind(...params).all();

  // 5) Bot vs human breakdown (always shows split, ignores include_bots)
  const breakdown = await env.ANALYTICS.prepare(
    `SELECT ua_class, COUNT(*) AS views, COUNT(DISTINCT hashed_visitor) AS uniques
     FROM pageviews
     WHERE ts >= ? ${siteFilter}
     GROUP BY ua_class`
  ).bind(...params).all();

  // 6) Sites overview
  const sites = await env.ANALYTICS.prepare(
    `SELECT site, COUNT(*) AS views, COUNT(DISTINCT hashed_visitor) AS uniques
     FROM pageviews
     WHERE ts >= ? ${uaFilter}
     GROUP BY site
     ORDER BY views DESC`
  ).bind(since).all();

  // 7) Device split
  const devices = await env.ANALYTICS.prepare(
    `SELECT COALESCE(device_type, 'unknown') AS device, COUNT(*) AS views
     FROM pageviews
     WHERE ts >= ? ${siteFilter} ${uaFilter}
     GROUP BY device
     ORDER BY views DESC`
  ).bind(...params).all();

  return json({
    days,
    site,
    include_bots: includeBots,
    daily: daily.results,
    top_paths: topPaths.results,
    top_referrers: topReferrers.results,
    top_countries: topCountries.results,
    devices: devices.results,
    breakdown: breakdown.results,
    sites: sites.results,
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
