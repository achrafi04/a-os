/* ============================================================
 * reskin.js — convert the whole A.OS suite to the green / serif
 * theme in one pass. Run from the repo root:  node reskin.js
 *
 * Safe to re-run. Rewrites the violet colour literals, swaps
 * Space Grotesk -> Newsreader (italic headings), rebrands
 * Rowan -> A.OS. Does NOT touch the `patron_*` storage keys or
 * the `Patron` JS object, so data + theme switcher keep working.
 * ============================================================ */
const fs = require('fs');
const path = require('path');

const SKIP = new Set(['theme.css', 'preview.html', 'research.html', 'reskin.js']);
const EXT = new Set(['.html', '.js', '.webmanifest', '.css']);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const HEX = {
  '#8B7CFF':'#34C796', '#C7BBFF':'#74EBC2', '#130E2E':'#04130D',
  '#8B7BFF':'#2FD9A0', '#B9ABFF':'#7CF2CC', '#0A0922':'#03130C',
  '#6A45FF':'#0E9E72', '#8E6BFF':'#3FC79A', '#7C6BFF':'#2FD9A0',
  '#0C0C12':'#070B0A', '#15151F':'#0E1614', '#080913':'#04100C', '#12131F':'#0A1A14',
  '#F3F2FA':'#F1F6F3', '#171622':'#0F1A16', '#F3F2F8':'#E9F1EC', '#FBBF24':'#E8B84B',
};
const RGBA = {
  'rgba(139,124,255':'rgba(52,199,150', 'rgba(139,123,255':'rgba(47,217,160',
  'rgba(124,107,255':'rgba(47,217,160', 'rgba(150,160,255':'rgba(90,255,205',
  'rgba(160,170,255':'rgba(90,255,205', 'rgba(106,69,255':'rgba(14,158,114',
  'rgba(140,130,255':'rgba(60,230,170', 'rgba(243,242,248':'rgba(233,241,236',
  'rgba(23,22,60':'rgba(15,40,30', 'rgba(23,22,34':'rgba(15,26,22',
  'rgba(10,10,16':'rgba(6,11,10', 'rgba(26,26,36':'rgba(14,22,20',
};

function convert(file, raw) {
  let s = raw, hits = 0;
  const sub = (pat, rep, flags='g') => {
    const re = new RegExp(typeof pat === 'string' ? esc(pat) : pat, flags);
    s = s.replace(re, (...a) => { hits++; return typeof rep === 'function' ? rep(...a) : rep; });
  };
  for (const [o,n] of Object.entries(HEX))  sub(o, n, 'gi');
  for (const [o,n] of Object.entries(RGBA)) sub(o, n, 'g');
  sub("'Space Grotesk'", "'Newsreader'");
  sub(/family=Space\+Grotesk:[^&"']*/g,
      "family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500;1,6..72,600");
  sub("'Newsreader', -apple-system, sans-serif", "'Newsreader', Georgia, serif");
  sub("'Newsreader', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", "'Newsreader', Georgia, serif");
  // italic on every heading that uses the display font (var or inline)
  sub(/font-family:\s*var\(--font-(display|serif)\)(?!\s*;\s*font-style)/g, m => m + '; font-style: italic');
  sub(/font-family:\s*'Newsreader'[^;}]*/g, m => /font-style/.test(m) ? m : m + '; font-style: italic');
  s = s.replace(/(;\s*font-style:\s*italic)(\s*;\s*font-style:\s*italic)+/g, '$1');
  // main page title always italic — function-based so .title is preserved (no $1)
  sub(/\.title\{font-family:\s*var\(--font-(?:serif|display)\);font-style:\s*normal/g,
      m => m.replace(/font-style:\s*normal/, 'font-style:italic'));
  // rebrand (Patron JS object untouched)
  sub('Rowan', 'A.OS');
  if (path.basename(file) === 'manifest.webmanifest') {
    sub('"Patron — A.OS"', '"A.OS"');
    sub('"short_name": "Patron"', '"short_name": "A.OS"');
  }
  return { s, hits };
}

let total = 0;
for (const f of fs.readdirSync('.')) {
  if (SKIP.has(f) || !EXT.has(path.extname(f))) continue;
  const raw = fs.readFileSync(f, 'utf8');
  const { s, hits } = convert(f, raw);
  if (hits > 0 && s !== raw) { fs.writeFileSync(f, s); console.log(`  ${f.padEnd(22)} ${hits} replacements`); total += hits; }
}
console.log(`\nDone — ${total} replacements across the suite.`);
