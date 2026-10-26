// DASHBOARD EŞİTLİK KONTROLÜ — index.html'deki monthMetrics fonksiyonunu doğrudan çalıştırır ve
// motor çıktısıyla karşılaştırır. Amaç: raporun rakamları dashboard'da görünen rakamlarla aynı olsun.
// Kullanım: node kontrol/dashboard_esitlik.mjs [calisma_klasoru]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = resolve(process.argv[2] || join(ROOT, 'calisma'));
const HTML = readFileSync(join(ROOT, '..', 'index.html'), 'utf8');
const cut = (a, b) => { const s = HTML.search(a); const r = HTML.slice(s); return r.slice(0, r.search(b)); };
const factory = new Function('MULTI_COUNTRY', [
  "const deaccent = (s='') => String(s).replaceAll('İ','I').replaceAll('ı','i').normalize('NFD').replace(/\\p{Diacritic}/gu,'').toLowerCase();",
  'const sum = (arr, f) => arr.reduce((a,b) => a + (typeof f === "function" ? f(b) : (b[f]||0)), 0);',
  'const clamp = (v,a,b) => Math.max(a, Math.min(b, v));',
  cut(/function bal\(r, c\)/, /\n/),
  cut(/const thr = /, /\nfunction healthGrade/),
  'return { monthMetrics, c: {dev:"Devreden", gir:"Giren", cik:"Cikan", kal:"Kalan", minKey:"MinTutar", maxKey:"MaxTutar"} };',
].join('\n'));
const { monthMetrics, c } = factory(false);

const ozet = JSON.parse(readFileSync(join(DIR, 'veri_ozet.json'), 'utf8'));
const map = { kal: 'kalan', doh: 'gunKapsami', turn: 'devirHizi', belowN: 'minAltiKalem', belowGap: 'minAltiAcik', aboveGap: 'maxUstuFazla',
  deadN: 'oluStokKalem', deadV: 'oluStok', covN: 'asiriKapsamKalem', covX: 'asiriKapsamFazla', opp: 'serbestBirakilabilirSermaye', health: 'saglikSkoru' };
const res = {}; let ok = true;
for (const u of ozet.ulkeler) {
  const rows = JSON.parse(readFileSync(join(DIR, `veri_${u}.json`), 'utf8'));
  const kpi = JSON.parse(readFileSync(join(DIR, `kpi_${u}.json`), 'utf8'));
  const months = [...new Set(rows.map(r => r.Donem))].sort(); const by = new Map();
  rows.forEach(r => { if (!by.has(r.Donem)) by.set(r.Donem, []); by.get(r.Donem).push(r); });
  const d = monthMetrics(months.at(-1), by, months, c);
  const diff = Object.entries(map).filter(([k, f]) => { const a = d[k], b = kpi.ozet[f]; return a == null ? b != null : Math.abs(a - b) > Math.max(0.02, Math.abs(a) * 1e-4); }).map(([, f]) => f);
  res[u] = { gecti: !diff.length, farkli: diff }; ok &&= !diff.length;
  console.log(`${u}: ${diff.length ? 'FARK → ' + diff.join(', ') : 'dashboard ile birebir aynı'}`);
}
writeFileSync(join(DIR, 'dashboard_esitlik.json'), JSON.stringify({ gecti: ok, ulkeler: res }, null, 2));
process.exit(ok ? 0 : 1);
