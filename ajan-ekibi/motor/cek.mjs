// VERİ KATMANI — kaynak.json'a göre stok verisini çeker, normalize eder, ülkelere böler.
// mod=demo : dashboard'un (../index.html) kendi demo üreticisini çalıştırır → dashboard ile birebir aynı veri.
// mod=url  : her ülkenin raw .xlsx/.csv/.json bağlantısını okur (dashboard'un normalizeRows mantığıyla).
// Kullanım: node motor/cek.mjs [cikti_klasoru]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(process.argv[2] || join(ROOT, 'calisma'));
const CFG = JSON.parse(readFileSync(join(ROOT, 'kaynak.json'), 'utf8'));
const HTML = readFileSync(join(ROOT, '..', 'index.html'), 'utf8');

// index.html'den bir kod bloğunu başlangıç işaretinden bitiş işaretine kadar keser
function cut(startRe, endRe) {
  const s = HTML.search(startRe); if (s < 0) throw new Error('index.html içinde bulunamadı: ' + startRe);
  const rest = HTML.slice(s); const e = rest.search(endRe); if (e < 0) throw new Error('Bitiş bulunamadı: ' + endRe);
  return rest.slice(0, e);
}
const helpers = [
  cut(/const deaccent = /, /\nconst debounce/),
  cut(/function toNum\(/, /\nconst MONTH_TR/),
  'const pad2 = n => ("0" + n).slice(-2);',
  cut(/function normMonth\(/, /\nfunction fmtMonth/),
  cut(/function normalizeRows\(/, /\n\/\* CSV/),
  'const DEFAULT_COUNTRY = "ATLAS";',
  'const normCountry = v => String(v || "").trim().toLocaleUpperCase("tr-TR");',
].join('\n');

function demoRows() {
  const code = helpers + '\n' +
    cut(/const DEMO_COMPANY = /, /\nfunction loadDemo/) + '\n' +
    cut(/const SAMPLE_DEFS = /, /\nlet SAMPLE_SET/) + '\n' +
    cut(/function hash01\(/, /\nfunction withSamples/) + '\n' +
    `const base = buildDemoData();
     let out = base;
     SAMPLE_DEFS.forEach(d => { out = out.concat(synthCountry(base, d)); });
     return { rows: out, company: DEMO_COMPANY };`;
  return new Function(code)();
}

async function urlRows() {
  const normalizeRows = new Function(helpers + '\nreturn normalizeRows;')();
  const parseCSV = new Function(helpers + '\n' + cut(/function parseCSV\(/, /\nfunction parseWorkbook/) + '\nreturn parseCSV;')();
  const all = [];
  for (const { ulke, url } of CFG.ulkeler.filter(x => x.url)) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${ulke}: HTTP ${res.status}`);
    const clean = url.split('?')[0].toLowerCase(); let rows;
    if (clean.endsWith('.csv')) rows = parseCSV(await res.text());
    else if (clean.endsWith('.json')) rows = normalizeRows(await res.json());
    else {
      const XLSX = await import('xlsx').catch(() => { throw new Error('Excel için: npm i xlsx'); });
      const wb = XLSX.read(new Uint8Array(await res.arrayBuffer()), { type: 'array' });
      rows = wb.SheetNames.map(n => normalizeRows(XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '' })))
        .sort((a, b) => b.length - a.length)[0] || [];
    }
    if (!rows.length) throw new Error(`${ulke}: tanınan satır yok (başlıkları kontrol edin)`);
    rows.forEach(r => { r.Ulke = String(r.Ulke || ulke).trim().toLocaleUpperCase('tr-TR') || ulke; });
    all.push(...rows);
  }
  return { rows: all, company: 'Gerçek veri' };
}

const { rows, company } = CFG.mod === 'url' ? await urlRows() : demoRows();
mkdirSync(OUT, { recursive: true });
const ulkeler = [...new Set(rows.map(r => r.Ulke))].sort();
const donemler = [...new Set(rows.map(r => r.Donem))].sort();
for (const u of ulkeler) writeFileSync(join(OUT, `veri_${u}.json`), JSON.stringify(rows.filter(r => r.Ulke === u)));
const ozet = { mod: CFG.mod, sirket: company, demo: CFG.mod !== 'url', satir: rows.length, ulkeler,
  donemler, sonDonem: donemler.at(-1), olusturma: new Date().toISOString() };
writeFileSync(join(OUT, 'veri_ozet.json'), JSON.stringify(ozet, null, 2));
console.log(JSON.stringify(ozet));
