/* SEO- és linkellenőrzés a kész deploy/ mappán.  npm run ellenorzes

   Hibára (exit 1) a CI-ben a közzététel leáll:
   - törött belső link vagy #horgony
   - hiányzó kép / hiányzó alt
   - hiányzó vagy duplikált <title> / meta description
   - nem pontosan egy <h1>
   - indexelhető oldalon hiányzó vagy nem önmagára mutató canonical
   - hibás JSON-LD
   - rejtett (sr-only) szöveg címsorban
   - sitemapban nem létező vagy noindex oldal
   Figyelmeztetés: title / description hossza. */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'deploy';
const DOMAIN = JSON.parse(readFileSync('ceg-adatok.json', 'utf8')).domain;
const SITE = `https://${DOMAIN}`;

const errors = [];
const warns = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warns.push(`${f}: ${m}`);

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const htmlFiles = walk(OUT).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\\/g, '/'));
const urlOf = (f) => {
  const rel = f.slice(OUT.length);
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
};

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag);
  return m ? decode(m[1]) : null;
};

const pages = {};
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  pages[urlOf(f)] = { f, html, ids };
}

// cél feloldása: /x/ → deploy/x/index.html, /a.html → deploy/a.html
const resolve = (path) => {
  if (path.endsWith('/')) return pages[path] ? path : null;
  if (pages[path]) return path;
  if (existsSync(join(OUT, path))) return path;
  return null;
};

const titles = new Map();
const descs = new Map();

for (const [url, { f, html, ids }] of Object.entries(pages)) {
  const noindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
  const isAdmin = url === '/admin.html';

  // ---- title / description ----
  const title = (/<title>([^<]*)<\/title>/i.exec(html) || [])[1];
  const desc = attr((/<meta\s+name="description"[^>]*>/i.exec(html) || [''])[0], 'content');
  if (!title) err(f, 'nincs <title>');
  if (!isAdmin && !desc) err(f, 'nincs meta description');
  if (!noindex) {
    if (title) {
      if (titles.has(title)) err(f, `duplikált title (${titles.get(title)})`);
      titles.set(title, f);
      if (title.length > 65 || title.length < 25) warn(f, `title hossza ${title.length}: „${title}”`);
    }
    if (desc) {
      if (descs.has(desc)) err(f, `duplikált description (${descs.get(desc)})`);
      descs.set(desc, f);
      if (desc.length > 165 || desc.length < 70) warn(f, `description hossza ${desc.length}`);
    }
  }

  // ---- lang ----
  if (!/<html lang="hu">/.test(html)) err(f, 'hiányzik a <html lang="hu">');

  // ---- H1 ----
  const h1s = html.match(/<h1[\s>]/gi) || [];
  if (!isAdmin && h1s.length !== 1) err(f, `${h1s.length} db <h1>`);

  // ---- rejtett szöveg címsorban ----
  if (/<h[1-6][^>]*>(?:(?!<\/h[1-6]>)[\s\S])*class="sr-only"/i.test(html)) err(f, 'sr-only szöveg címsorban (rejtett szöveg)');

  // ---- canonical ----
  const canon = attr((/<link\s+rel="canonical"[^>]*>/i.exec(html) || [''])[0], 'href');
  if (!noindex) {
    if (!canon) err(f, 'nincs canonical');
    else if (canon !== SITE + url) err(f, `canonical nem önmagára mutat: ${canon}`);
    const ogUrl = attr((/<meta\s+property="og:url"[^>]*>/i.exec(html) || [''])[0], 'content');
    if (ogUrl && ogUrl !== SITE + url) err(f, `og:url eltér: ${ogUrl}`);
    if (!/<meta\s+property="og:image"/i.test(html)) err(f, 'nincs og:image');
  }

  // ---- JSON-LD ----
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = data['@graph'] || [data];
      for (const n of nodes) {
        if (!n['@type']) err(f, 'JSON-LD csomópont @type nélkül');
        if (n['@type'] === 'BreadcrumbList') {
          for (const li of n.itemListElement) {
            const u = li.item.replace(SITE, '');
            if (!resolve(u)) err(f, `BreadcrumbList cél nem létezik: ${li.item}`);
          }
        }
      }
      if (/AggregateRating|"review"/i.test(m[1])) err(f, 'értékelés-markup a JSON-LD-ben (Google irányelv!)');
    } catch (e) {
      err(f, `hibás JSON-LD: ${e.message}`);
    }
  }

  // ---- linkek ----
  for (const m of html.matchAll(/<a\s[^>]*>/gi)) {
    const href = attr(m[0], 'href');
    if (href == null) continue;
    if (/^(https?:|tel:|mailto:)/i.test(href)) {
      if (href.startsWith(SITE)) err(f, `abszolút belső link: ${href}`);
      if (/^tel:/.test(href) && !/^tel:\+36\d{8,9}$/.test(href)) err(f, `hibás tel: link: ${href}`);
      continue;
    }
    const [pathPart, hash] = href.split('#');
    let target = url;
    if (pathPart) {
      const abs = pathPart.startsWith('/') ? pathPart : new URL(pathPart, 'https://x' + url).pathname;
      target = resolve(abs);
      if (!target) { err(f, `törött link: ${href}`); continue; }
    }
    if (hash && pages[target] && !pages[target].ids.has(hash)) err(f, `nem létező horgony: ${href}`);
  }

  // ---- képek ----
  for (const m of html.matchAll(/<img\s[^>]*>/gi)) {
    const src = attr(m[0], 'src');
    const alt = attr(m[0], 'alt');
    if (alt == null) err(f, `alt nélküli kép: ${src}`);
    if (src && !/^(https?:|data:)/.test(src)) {
      const abs = src.startsWith('/') ? src : new URL(src.split('?')[0], 'https://x' + url).pathname;
      if (!existsSync(join(OUT, abs.split('?')[0]))) err(f, `hiányzó kép: ${src}`);
    }
    if (src && !/\swidth="/.test(m[0]) && !m[0].includes('lightboxImg')) warn(f, `kép width/height nélkül: ${src}`);
  }
  for (const m of html.matchAll(/<source\s[^>]*srcset="([^"]+)"/gi)) {
    for (const part of m[1].split(',')) {
      const src = part.trim().split(/\s+/)[0];
      const abs = src.startsWith('/') ? src : new URL(src, 'https://x' + url).pathname;
      if (!existsSync(join(OUT, abs))) err(f, `hiányzó <source> kép: ${src}`);
    }
  }

  // ---- maradék helyőrző ----
  if (/\{\{[^}]+\}\}/.test(html)) err(f, 'feldolgozatlan {{helyőrző}}');
}

// ---- sitemap ----
const sitemap = readFileSync(join(OUT, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const loc of locs) {
  const u = loc.replace(SITE, '');
  const p = pages[u];
  if (!p) { err('sitemap.xml', `nem létező URL: ${loc}`); continue; }
  if (/noindex/i.test((/<meta\s+name="robots"[^>]*>/i.exec(p.html) || [''])[0])) err('sitemap.xml', `noindex oldal a sitemapban: ${loc}`);
}
// árva oldal: indexelhető, de nincs a sitemapban
for (const [url, p] of Object.entries(pages)) {
  if (/noindex/i.test((/<meta\s+name="robots"[^>]*>/i.exec(p.html) || [''])[0])) continue;
  if (!locs.includes(SITE + url)) err(p.f, 'indexelhető, de hiányzik a sitemapból');
}
// belső bejövő linkek (árva oldal)
for (const [url, p] of Object.entries(pages)) {
  if (url === '/' || /noindex/i.test(p.html.slice(0, 2000))) continue;
  const linked = Object.entries(pages).some(([u, q]) => u !== url && q.html.includes(`href="${url}"`));
  if (!linked) err(p.f, 'árva oldal: egyetlen másik oldal sem linkel rá');
}

const robots = readFileSync(join(OUT, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) err('robots.txt', 'hiányzó Sitemap sor');

console.log(`Ellenőrizve: ${Object.keys(pages).length} HTML oldal, ${locs.length} sitemap URL.`);
if (warns.length) console.log(`\nFigyelmeztetés (${warns.length}):\n  ` + warns.join('\n  '));
if (errors.length) {
  console.error(`\nHIBA (${errors.length}):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log('\nMinden rendben.');
