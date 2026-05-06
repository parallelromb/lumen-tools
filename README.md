# Lumen Tools

> **58 self-contained browser tools.** No signup, no tracking, no backend. Built in one night.

🌐 Live at **[tools.parallelromb.dev](https://tools.parallelromb.dev)**

## What is this?

I run a self-hosted AI system at home called [Lumen](https://parallelromb.dev). On the night of April 29, 2026, I built 58 small browser tools to fill in the gaps in my daily workflow. JSON formatters, cron builders, kanban boards, habit trackers, the works.

Each tool is a single self-contained HTML file. No frameworks, no build step, no telemetry. Open one, use it, close the tab. Your data lives in your browser's `localStorage`.

I'm publishing them under MIT so anyone can fork, embed, or self-host. They're not novel — there's a JSON formatter on every dev's bookmarks bar — but they're the ones *I* built, polished enough to use every day, and packaged together so you don't need 58 different tabs.

## Why "Lumen Tools"?

Because they were built for [Lumen](https://parallelromb.dev), my self-hosted AI system. Some defaults reference my other products (Smara, MCP Doctor, Scoper) — they're examples, fully editable.

## Run locally

It's static HTML. Pick your favorite:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .

# Or just open index.html in your browser
open index.html
```

## Deploy

It's static HTML. Drop the folder anywhere:

- **Cloudflare Pages** (one-click) — connect this repo, leave build command empty, output dir `/`
- **GitHub Pages** — Settings → Pages → Deploy from branch `main`, root `/`
- **Vercel / Netlify** — same, no build config needed
- **Your own server** — `cp -r * /var/www/html/`

## The tools

### 🛠 Dev Tools (14)
| Tool | What it does |
|------|---|
| [JSON Formatter](json.html) | Syntax highlighting, tree view, diff compare, YAML/CSV/TS export |
| [Regex Tester](regex.html) | 24 patterns, explanation engine, replace/split modes |
| [REST API Tester](api-tester.html) | Mini Postman with collections, env vars, cURL export |
| [Text Diff](diff.html) | LCS diff, inline/side-by-side/unified, merge tool |
| [Encoder/Decoder](encoder.html) | Base64, URL, HTML, JWT, Hash, Unicode, Hex, Binary |
| [Cron Builder](cron.html) | Visual builder, 22 presets, export crontab/launchd/systemd/GitHub Actions |
| [chmod Calculator](chmod.html) | Visual grid, numeric/symbolic, setuid/setgid/sticky |
| [IP Network Tools](ip-tools.html) | My IP, lookup, subnet calc, IPv4/6, DNS over HTTPS |
| [Epoch Converter](epoch.html) | Live clock, 26 timezones, duration calc, date math |
| [Unit Converter](units.html) | CSS/color/time/data/temp/angle, spacing scale, box model |
| [Color Palette](colors.html) | 6 harmony modes, WCAG contrast, gradient generator |
| [Markdown Editor](markdown.html) | Split pane, vanilla parser, multi-doc tabs, find/replace |
| [Password Generator](passwords.html) | Crypto-secure, passphrase, strength checker, bulk generate |
| [Lorem Ipsum](lorem.html) | 5 themes, placeholder images, fake data generator |

### ⚡ Productivity (13)
Kanban Board · Budget Planner · Meal Planner · Presentation Timer · Browser Start Page · Git Activity Heatmap · Pomodoro · Daily Standup · Daily Planner · Meeting Notes · Invoice Generator · Content Calendar · Sprint Retro

### 🎯 Strategy (6)
Competitor Tracker · A/B Headline Tester · OKR Tracker · Decision Log · Ideas Board · Goals Tracker

### 🌱 Wellness (7)
Affirmations · Sleep Tracker · Energy Tracker · Fitness Tracker · Gratitude Journal · Personal Journal · Habits

### 💰 Finance (3)
Wealth Dashboard · Cost Dashboard · Expense Tracker

### 📚 Learning (5)
Reading List · Skill Matrix · Interview Prep · Learning Tracker · Bookmarks Manager

### 🔧 Operations (9)
Morning Dashboard · API Usage Tracker · Project Health · System Health · Timezone Converter · Network CRM · Quick Notes · Secrets Reference · Weekly Review

## Privacy

All tools run **entirely in your browser**. No data is sent anywhere — there's no backend to send it to. Your kanban cards, budget figures, journal entries, and everything else live in your browser's `localStorage` for that origin.

If you clear your browser data, your data is gone. There is no cloud sync. That's a feature.

## Contributing

PRs and issues welcome. Some directions worth taking:

- **Bug fixes** — anything that's broken
- **Polish on existing tools** — better mobile, accessibility, edge cases
- **New tools** that fit the constraint: single HTML file, no backend, no signup
- **Themes** — currently Apple-style frosted glass; dark theme would be welcome
- **Translations** — UI strings to other languages

Big rewrites or framework migrations: please open an issue first to discuss.

## License

[MIT](LICENSE) — do whatever you want, just keep the copyright notice if you redistribute.

## Author

Built by **Sri** ([parallelromb.dev](https://parallelromb.dev)) — solo hacker building [Lumen](https://parallelromb.dev), [Smara](https://smara.io), [MCP Doctor](https://mcpdoctor.ai), [Scoper](https://github.com/parallelromb/scoper), and a few other things.

Built with help from Claude (Anthropic) — pair programming, late-night marathon edition.
