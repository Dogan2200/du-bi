// HESAP MOTORU (birincil) — D/U BI dashboard'undaki formüllerin birebir karşılığı (tutar bazlı).
// Ajanlar rakam HESAPLAMAZ; bu motorun çıktısını yorumlar. Bağımsız doğrulama: kontrol/dogrula.py
// Kullanım: node motor/kpi.mjs <ULKE> [calisma_klasoru]  →  calisma/kpi_<ULKE>.json
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ULKE = process.argv[2]; if (!ULKE) { console.error('Ülke verin: node motor/kpi.mjs ATLAS'); process.exit(1); }
const DIR = resolve(process.argv[3] || join(ROOT, 'calisma'));
const S = JSON.parse(readFileSync(join(ROOT, 'kaynak.json'), 'utf8')).ayarlar;
const rows = JSON.parse(readFileSync(join(DIR, `veri_${ULKE}.json`), 'utf8'));

const c = { dev: 'Devreden', gir: 'Giren', cik: 'Cikan', kal: 'Kalan', minKey: 'MinTutar', maxKey: 'MaxTutar' };
const deaccent = (s = '') => String(s).replaceAll('İ', 'I').replaceAll('ı', 'i').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const sum = (a, f) => a.reduce((t, x) => t + (typeof f === 'function' ? f(x) : (x[f] || 0)), 0);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const bal = r => { const d = r[c.dev] || 0, g = r[c.gir] || 0, x = r[c.cik] || 0, k = r[c.kal] || 0; return (d || g || x) ? d + g - x : k; };
const thr = r => ({ min: r[c.minKey] || 0, max: r[c.maxKey] || 0 });
const isGIT = r => deaccent(r.DepoSinifi).includes('goods in transit') || deaccent(r.Depo).includes('goods in transit');
const rowKey = r => (r.Depo || '—') + ' • ' + (r.StokAdi || '—');
const r2 = v => v == null ? null : Math.round(v * 100) / 100;

const allMonths = [...new Set(rows.map(r => r.Donem))].sort();
const byMonth = new Map(); for (const r of rows) { if (!byMonth.has(r.Donem)) byMonth.set(r.Donem, []); byMonth.get(r.Donem).push(r); }
const win = (m, n) => { const i = allMonths.indexOf(m); return i < 0 ? [] : allMonths.slice(Math.max(0, i - n + 1), i + 1); };
function avgOutMap(m) { const w = win(m, S.avgMonths), mp = new Map(); w.forEach(x => (byMonth.get(x) || []).forEach(r => mp.set(rowKey(r), (mp.get(rowKey(r)) || 0) + (r[c.cik] || 0)))); mp.forEach((v, k) => mp.set(k, v / (w.length || 1))); return mp; }
function movedKeys(m) { const s = new Set(); win(m, S.deadMonths).forEach(x => (byMonth.get(x) || []).forEach(r => { if ((r[c.gir] || 0) || (r[c.cik] || 0)) s.add(rowKey(r)); })); return s; }

const KPI = [['doh', 'low'], ['turn', 'high'], ['stockout', 'low'], ['excess', 'low'], ['dead', 'low']];
function score(id, better, v) { const p = S.kpi[id]; if (v == null || !isFinite(v)) return null; const t = +p.target, w = +p.worst; const r = better === 'low' ? (w - v) / (w - t) : (v - w) / (t - w); return Math.round(clamp(r, 0, 1) * 100); }
function scorecard(vals) {
  const rs = KPI.map(([id, b]) => ({ id, v: vals[id], score: score(id, b, vals[id]), w: S.kpi[id].w }));
  const used = rs.filter(r => r.score != null && r.w > 0), tw = sum(used, 'w');
  return { rows: rs.map(r => ({ ...r, v: r2(r.v) })), health: tw ? Math.round(sum(used, r => r.score * r.w) / tw) : null };
}

function monthMetrics(m) {
  const rs = byMonth.get(m) || [], avgOut = avgOutMap(m), moved = movedKeys(m);
  let dev = 0, gir = 0, cik = 0, kal = 0, git = 0, nonGit = 0, minDef = 0, belowN = 0, belowGap = 0, maxDef = 0, aboveN = 0, aboveGap = 0, deadN = 0, deadV = 0, covN = 0, covX = 0;
  for (const r of rs) {
    const b = bal(r), k = rowKey(r); dev += r[c.dev] || 0; gir += r[c.gir] || 0; cik += r[c.cik] || 0; kal += b;
    const g = isGIT(r); if (g) git += b; else nonGit += b;
    const t = thr(r);
    if (t.min > 0) { minDef++; if (b < t.min) { belowN++; belowGap += t.min - b; } }
    if (t.max > 0) { maxDef++; if (b > t.max) { aboveN++; aboveGap += b - t.max; } }
    if (!g && b > 0 && !moved.has(k)) { deadN++; deadV += b; }
    if (!g && b > 0) { const a = avgOut.get(k) || 0; if (a > 0 && b / a * 30 > S.covMax) { covN++; covX += b - a * S.covTarget / 30; } }
  }
  const w = win(m, S.avgMonths), outWin = sum(w, x => sum(byMonth.get(x) || [], r => r[c.cik] || 0)) / (w.length || 1);
  const doh = outWin > 0 ? kal / outWin * 30 : null;
  const turn = (dev + kal) > 0 && outWin > 0 ? (outWin * 12) / ((dev + kal) / 2) : null;
  const sMin = minDef ? belowN / minDef : 0, sMax = kal > 0 ? aboveGap / kal : 0, sDead = nonGit > 0 ? deadV / nonGit : 0;
  const sc = scorecard({ doh, turn, stockout: minDef ? sMin * 100 : null, excess: maxDef ? sMax * 100 : null, dead: sDead * 100 });
  return { donem: m, satir: rs.length, devreden: r2(dev), giren: r2(gir), cikan: r2(cik), kalan: r2(kal), transit: r2(git),
    gunKapsami: r2(doh), devirHizi: r2(turn), minAltiKalem: belowN, minAltiAcik: r2(belowGap), minAltiOran: r2(sMin * 100),
    maxUstuKalem: aboveN, maxUstuFazla: r2(aboveGap), maxUstuOran: r2(sMax * 100), oluStokKalem: deadN, oluStok: r2(deadV),
    oluStokOran: r2(sDead * 100), asiriKapsamKalem: covN, asiriKapsamFazla: r2(covX),
    serbestBirakilabilirSermaye: r2(aboveGap + deadV + covX), saglikSkoru: sc.health, karne: sc.rows };
}

const cur = allMonths.at(-1), prev = allMonths.at(-2) ?? null, curRows = byMonth.get(cur) || [];
const item = r => ({ depo: r.Depo, stok: r.StokAdi, ustGrup: r.UstGrup, fsn: r.FSN, departman: r.Departman });
const top = (a, n = 15) => a.sort((x, y) => Math.abs(y.etki) - Math.abs(x.etki)).slice(0, n);

const moved = movedKeys(cur), avg = avgOutMap(cur);
const risk = {
  hareketsiz: top(curRows.filter(r => !isGIT(r) && bal(r) > 0 && !moved.has(rowKey(r))).map(r => ({ ...item(r), bakiye: r2(bal(r)), etki: r2(bal(r)) }))),
  minAlti: top(curRows.filter(r => thr(r).min > 0 && bal(r) < thr(r).min).map(r => ({ ...item(r), bakiye: r2(bal(r)), min: r2(thr(r).min), etki: r2(thr(r).min - bal(r)), karsilama: r2(bal(r) / thr(r).min * 100) }))),
  maxUstu: top(curRows.filter(r => thr(r).max > 0 && bal(r) > thr(r).max).map(r => ({ ...item(r), bakiye: r2(bal(r)), max: r2(thr(r).max), etki: r2(bal(r) - thr(r).max) }))),
  asiriKapsam: top(curRows.filter(r => !isGIT(r)).map(r => { const b = bal(r), a = avg.get(rowKey(r)) || 0; if (!(b > 0 && a > 0)) return null; const d = b / a * 30; if (d <= S.covMax) return null; return { ...item(r), bakiye: r2(b), gun: Math.round(d), etki: r2(b - a * S.covTarget / 30) }; }).filter(Boolean)),
};

// Pareto (ABC) — dashboard paretoList: kalem (depo • stok) bazında son ay çıkış tutarı
const pAgg = new Map(); for (const r of curRows) { const k = rowKey(r); pAgg.set(k, (pAgg.get(k) || 0) + (r[c.cik] || 0)); }
const pList = [...pAgg].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]); const pTot = sum(pList, x => x[1]) || 1; let run = 0;
const abc = { A: { kalem: 0, tutar: 0 }, B: { kalem: 0, tutar: 0 }, C: { kalem: 0, tutar: 0 } };
pList.forEach(([, v]) => { const s = run / pTot * 100 < 80 ? 'A' : run / pTot * 100 < 95 ? 'B' : 'C'; run += v; abc[s].kalem++; abc[s].tutar += v; });
Object.values(abc).forEach(x => x.tutar = r2(x.tutar));

// Hareket sapmaları — kalemin son ay girişi/çıkışı, kendi önceki 11 ayına göre Z ≥ 3 (anomali ajanı için ham aday listesi)
const hist = new Map(); for (const r of rows) { const k = rowKey(r); if (!hist.has(k)) hist.set(k, []); hist.get(k).push(r); }
const sapma = [];
for (const [k, rs] of hist) {
  const now = rs.find(r => r.Donem === cur); if (!now) continue;
  for (const f of ['Giren', 'Cikan']) {
    const past = rs.filter(r => r.Donem !== cur).map(r => r[f] || 0); if (past.length < 6) continue;
    const mu = sum(past, x => x) / past.length, sd = Math.sqrt(sum(past, x => (x - mu) ** 2) / past.length);
    const v = now[f] || 0, z = sd > 0 ? (v - mu) / sd : (v > mu * 3 && v > 0 ? 99 : 0);
    if (Math.abs(z) >= 3 && Math.abs(v - mu) > 1000) sapma.push({ ...item(now), alan: f, deger: r2(v), ortalama: r2(mu), z: r2(Math.min(z, 99)) });
  }
}
sapma.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));

const grp = key => { const m = new Map(); curRows.forEach(r => { const k = r[key] || '—'; const g = m.get(k) || { ad: k, kalan: 0, cikan: 0 }; g.kalan += bal(r); g.cikan += r[c.cik] || 0; m.set(k, g); }); return [...m.values()].map(g => ({ ...g, kalan: r2(g.kalan), cikan: r2(g.cikan) })).sort((a, b) => b.kalan - a.kalan); };

const out = { ulke: ULKE, donem: cur, oncekiDonem: prev, birim: 'tutar', ayarlar: S,
  ozet: monthMetrics(cur), onceki: prev ? monthMetrics(prev) : null,
  trend: allMonths.slice(-12).map(m => { const x = monthMetrics(m); return { donem: m, kalan: x.kalan, cikan: x.cikan, gunKapsami: x.gunKapsami, devirHizi: x.devirHizi, saglikSkoru: x.saglikSkoru }; }),
  risk,
  pareto: abc, hareketSapmalari: sapma.slice(0, 20), hareketSapmaSayisi: sapma.length,
  depolar: grp('Depo'), ustGruplar: grp('UstGrup') };
writeFileSync(join(DIR, `kpi_${ULKE}.json`), JSON.stringify(out, null, 2));
console.log(`${ULKE} ${cur}: sağlık ${out.ozet.saglikSkoru}, kapsam ${out.ozet.gunKapsami} gün, devir ${out.ozet.devirHizi}×, sermaye fırsatı ${out.ozet.serbestBirakilabilirSermaye}`);
