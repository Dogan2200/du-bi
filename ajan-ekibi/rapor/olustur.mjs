// RAPOR ÜRETİCİ — calisma/ klasöründeki motor + ajan çıktılarından D/U BI tasarımında haftalık yönetici raporu üretir.
// Kullanım: node rapor/olustur.mjs [calisma_klasoru]  →  rapor/cikti/stok-haftalik.html
// Rakamlar yalnızca kpi_*.json'dan basılır; ajan metinleri kontrol.json onayı olmadan basılmaz.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = resolve(process.argv[2] || join(ROOT, 'calisma'));
const J = f => JSON.parse(readFileSync(join(DIR, f), 'utf8'));
const opt = f => existsSync(join(DIR, f)) ? J(f) : null;

const ozet = J('veri_ozet.json'), dog = J('dogrulama.json'), esit = J('dashboard_esitlik.json');
const kontrol = opt('kontrol.json'), anomali = opt('anomali.json');
if (!dog.gecti || !esit.gecti) { console.error('Motor kontrolleri geçmedi — rapor üretilmedi.'); process.exit(1); }
if (!kontrol || kontrol.karar !== 'ONAY') { console.error('Kontrol ajanı onayı yok (' + (kontrol?.karar || 'kontrol.json yok') + ') — rapor üretilmedi.'); process.exit(1); }

const U = ozet.ulkeler.map(u => ({ u, k: J(`kpi_${u}.json`), a: opt(`analiz_${u}.json`) }));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nf0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }), nf1 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const usd = n => n == null ? '—' : (n < 0 ? '-' : '') + '$' + nf0.format(Math.abs(Math.round(n)));
const usdC = n => { if (n == null) return '—'; const a = Math.abs(n); const s = a >= 1e6 ? nf1.format(a / 1e6) + ' Mn' : a >= 1e3 ? nf1.format(a / 1e3) + ' B' : nf0.format(a); return (n < 0 ? '-' : '') + '$' + s; };
const pct = v => v == null ? '—' : '%' + nf1.format(v);
const MON = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const ay = ym => { const [y, m] = String(ym).split('-'); return `${MON[+m]} ${y}`; };
const ayK = ym => { const [y, m] = String(ym).split('-'); return `${MON[+m].slice(0, 3)} ${y.slice(2)}`; };
const rag = s => s == null ? ['muted', 'Veri yok'] : s >= 80 ? ['pos', 'Hedefte'] : s >= 50 ? ['warn', 'İzlenmeli'] : ['neg', 'Kritik'];
// yön: better='low' ise düşüş iyi
function delta(cur, prev, better, fmt) {
  if (cur == null || prev == null) return '';
  const d = cur - prev; if (Math.abs(d) < 1e-9) return `<span class="dl flat">● ${fmt(0)}</span>`;
  const good = better === 'low' ? d < 0 : d > 0;
  return `<span class="dl ${good ? 'good' : 'bad'}">${d > 0 ? '▲' : '▼'} ${fmt(Math.abs(d))}</span>`;
}
const KNAME = { doh: 'Gün kapsamı', turn: 'Devir hızı', stockout: 'Min altı oranı', excess: 'Max üstü oranı', dead: 'Ölü stok oranı' };
const kfmt = (id, v) => v == null ? '—' : id === 'doh' ? nf0.format(Math.round(v)) + ' gün' : id === 'turn' ? nf1.format(v) + '×' : pct(v);

function spark(vals, w = 220, h = 56) {
  const v = vals.map(x => x ?? null), ok = v.filter(x => x != null); if (ok.length < 2) return '';
  const lo = Math.min(...ok), hi = Math.max(...ok), pad = 6, span = hi - lo || 1;
  const X = i => pad + i * (w - 2 * pad) / (v.length - 1), Y = x => h - pad - (x - lo) / span * (h - 2 * pad);
  const pts = v.map((x, i) => x == null ? null : [X(i), Y(x)]).filter(Boolean);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${pts.at(-1)[0].toFixed(1)} ${h - pad} L${pts[0][0].toFixed(1)} ${h - pad} Z`;
  const e = pts.at(-1);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <line x1="${pad}" x2="${w - pad}" y1="${h - pad}" y2="${h - pad}" class="sg"/>
    <path d="${area}" class="sa"/><path d="${line}" class="sl"/><circle cx="${e[0].toFixed(1)}" cy="${e[1].toFixed(1)}" r="3.2" class="se"/></svg>`;
}

const tot = U.reduce((t, { k }) => ({ kalan: t.kalan + k.ozet.kalan, firsat: t.firsat + k.ozet.serbestBirakilabilirSermaye, minAcik: t.minAcik + k.ozet.minAltiAcik, minN: t.minN + k.ozet.minAltiKalem }), { kalan: 0, firsat: 0, minAcik: 0, minN: 0 });
const healthW = Math.round(U.reduce((s, { k }) => s + k.ozet.saglikSkoru * k.ozet.kalan, 0) / (tot.kalan || 1));
const donem = U[0].k.donem;
const allActs = U.flatMap(({ u, a }) => (a?.aksiyonlar || []).map(x => ({ ...x, ulke: u }))).sort((x, y) => (y.etki_usd || 0) - (x.etki_usd || 0));
const topAct = allActs[0];

const countryCard = ({ u, k, a }) => {
  const o = k.ozet, p = k.onceki || {}, [rc, rt] = rag(o.saglikSkoru);
  return `<article class="cc" id="u-${u}">
    <header class="cc-h"><div><div class="eyebrow">${esc(u)}</div><div class="cc-score"><span class="num">${o.saglikSkoru ?? '—'}</span><span class="of">/100</span></div></div>
      <span class="pill ${rc}">${rt}</span></header>
    <div class="cc-trend">${spark(k.trend.map(t => t.saglikSkoru))}<div class="meta">Sağlık skoru · ${ayK(k.trend[0].donem)} – ${ayK(k.trend.at(-1).donem)}</div></div>
    <dl class="kv">
      <div><dt>Kalan stok</dt><dd class="num">${usdC(o.kalan)} ${delta(o.kalan, p.kalan, 'low', usdC)}</dd></div>
      <div><dt>Gün kapsamı</dt><dd class="num">${kfmt('doh', o.gunKapsami)} ${delta(o.gunKapsami, p.gunKapsami, 'low', v => nf0.format(Math.round(v)) + ' g')}</dd></div>
      <div><dt>Devir hızı</dt><dd class="num">${kfmt('turn', o.devirHizi)} ${delta(o.devirHizi, p.devirHizi, 'high', v => nf1.format(v) + '×')}</dd></div>
      <div><dt>Sermaye fırsatı</dt><dd class="num">${usdC(o.serbestBirakilabilirSermaye)}</dd></div>
    </dl>
    ${a ? `<p class="cc-msg">${esc(a.baslik)}</p>` : ''}
  </article>`;
};

const countrySection = ({ u, k, a }) => {
  const o = k.ozet;
  const card = o.karne.map(r => { const [c] = rag(r.score); return `<tr><td>${KNAME[r.id]}</td><td class="num">${kfmt(r.id, r.v)}</td><td class="num muted">${kfmt(r.id, k.ayarlar.kpi[r.id].target)}</td><td><span class="bar"><i class="${c}" style="width:${r.score ?? 0}%"></i></span></td><td class="num"><b>${r.score ?? '—'}</b></td></tr>`; }).join('');
  const risks = (a?.riskler || []).map(r => `<li><div class="ri-h"><b>${esc(r.baslik)}</b><span class="num">${usd(r.tutar)}</span></div><p>${esc(r.aciklama)}</p>${r.kalemler?.length ? `<div class="chips">${r.kalemler.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : ''}</li>`).join('');
  const acts = (a?.aksiyonlar || []).map(x => `<tr><td class="num">${x.oncelik}</td><td>${esc(x.aksiyon)}</td><td>${esc(x.sorumlu)}</td><td class="num">${usd(x.etki_usd)}</td><td><span class="chip">${esc(x.sure)}</span></td></tr>`).join('');
  return `<section class="card sec" aria-labelledby="h-${u}">
    <div class="sec-h"><div><div class="eyebrow">${esc(u)} · ${ay(k.donem)}</div><h2 id="h-${u}">${esc(a?.baslik || u)}</h2></div><a class="up" href="#ozet">Özete dön</a></div>
    <div class="grid2">
      <div class="col">
        <h3 class="lab info">Ne oldu</h3><ul class="dots">${(a?.durum || []).map(d => `<li>${esc(d)}</li>`).join('')}</ul>
        <h3 class="lab">Performans karnesi</h3>
        <div class="tw"><table class="dt"><thead><tr><th>KPI</th><th class="num">Gerçek</th><th class="num">Hedef</th><th>Puan</th><th class="num"></th></tr></thead><tbody>${card}</tbody></table></div>
      </div>
      <div class="col"><h3 class="lab warn">Neden · en büyük riskler</h3><ul class="risks">${risks || '<li class="muted">Belirgin risk yok.</li>'}</ul></div>
    </div>
    <h3 class="lab pos">Ne yapmalı</h3>
    <div class="tw"><table class="dt"><thead><tr><th class="num">#</th><th>Aksiyon</th><th>Sorumlu</th><th class="num">Etki</th><th>Süre</th></tr></thead><tbody>${acts}</tbody></table></div>
  </section>`;
};

const SINIF = { tek_seferlik_alim: 'Tek seferlik alım', tuketim_sicramasi: 'Tüketim sıçraması', olasi_kayit_hatasi: 'Olası kayıt hatası', yapisal_degisim: 'Yapısal değişim' };
const anomSec = anomali ? `<section class="card sec" aria-labelledby="h-an">
  <div class="sec-h"><div><div class="eyebrow">Anomali analisti · tüm ülkeler</div><h2 id="h-an">Sıra dışı hareketler</h2></div></div>
  <p class="lead">${esc(anomali.ozet)}</p>
  <div class="tw"><table class="dt an"><thead><tr><th>Ülke</th><th>Kalem</th><th>Alan</th><th class="num">Bu ay</th><th class="num">Ortalama</th><th>Sınıf</th><th>Öneri</th></tr></thead><tbody>
  ${(anomali.bulgular || []).map(b => `<tr><td><b>${esc(b.ulke)}</b></td><td>${esc(b.stok)}<div class="meta">${esc(b.depo)}</div></td><td>${b.alan === 'Giren' ? 'Giriş' : 'Çıkış'}</td><td class="num">${usd(b.deger)}</td><td class="num muted">${usd(b.ortalama)}</td><td><span class="pill ${b.sinif === 'olasi_kayit_hatasi' ? 'neg' : 'warn'}">${SINIF[b.sinif] || esc(b.sinif)}</span>${b.teyit_gerekli ? '<div class="meta">Teyit gerekli</div>' : ''}</td><td>${esc(b.oneri)}</td></tr>`).join('')}
  </tbody></table></div>
  ${anomali.ulkeler_arasi ? `<p class="note"><b>Ülkeler arası:</b> ${esc(anomali.ulkeler_arasi)}</p>` : ''}
</section>` : '';

const nCheck = Object.values(dog.ulkeler).reduce((s, x) => s + x.kontroller.length, 0);
const auditSec = `<section class="card sec audit" aria-labelledby="h-au">
  <div class="sec-h"><div><div class="eyebrow">Denetim katmanı</div><h2 id="h-au">Bu rapor nasıl doğrulandı</h2></div></div>
  <div class="steps">
    <div class="step"><span class="pill pos">Geçti</span><b>Bağımsız motor</b><p>KPI'lar ayrı bir Python motoruyla ham veriden yeniden hesaplandı. ${nCheck} karşılaştırmanın tamamı uyumlu.</p></div>
    <div class="step"><span class="pill pos">Geçti</span><b>Dashboard eşitliği</b><p>Rakamlar D/U BI dashboard'unun kendi hesap koduyla birebir aynı.</p></div>
    <div class="step"><span class="pill pos">Onay</span><b>Kontrol ajanı</b><p>Analiz metinlerindeki ${nf0.format(kontrol.kontrol_edilen_sayi_adedi || 0)} sayı ve kalem adı kaynağa karşı tek tek denetlendi.</p></div>
  </div>
  ${(() => { const E = Object.entries(dog.ulkeler), q = E.filter(([, x]) => x.tutarVarMiktarYokSatir > 0), d = E.filter(([, x]) => x.devirKopuklukGecis > 0);
    return (q.length ? `<p class="note"><span class="pill warn">Veri kalitesi</span> Tutarı olup miktarı 0 olan satırlar: ${q.map(([u, x]) => `<b>${esc(u)}</b> ${x.tutarVarMiktarYokSatir}`).join(', ')}. Tutar bazlı KPI'lar etkilenmez; miktar bazlı görünüm bu satırlarda güvenilir değildir.</p>` : '')
      + (d.length ? `<p class="note"><span class="pill warn">Veri kalitesi</span> Açılış miktarı önceki ayın kapanışını tutmayan ay geçişleri: ${d.map(([u, x]) => `<b>${esc(u)}</b> ${nf0.format(x.devirKopuklukGecis)}`).join(', ')}. Son ay KPI'ları etkilenmez; aylar arası kalem karşılaştırmalarında dikkat edilmeli.</p>` : ''); })()}
  ${(kontrol.uyarilar || []).length ? `<details><summary>Denetçi notları (${kontrol.uyarilar.length})</summary><ul class="dots">${kontrol.uyarilar.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}
</section>`;

const EMBLEM = readFileSync(join(ROOT, '..', 'design-system', 'assets', 'Logos', 'du-bi-emblem.svg'), 'utf8').replace('<svg ', '<svg class="emb" aria-hidden="true" ');

const html = `<title>D/U BI Haftalık Stok Raporu</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
<style>
/* Layout: altın başlık şeridi → grup özeti + ülke kartları → ülke bölümleri (Ne oldu / Neden / Ne yapmalı) → anomali → denetim. Tokenlar: design-system/tokens.json */
:root{--bg:#ffffff;--surface:#ffffff;--surface-3:#f8f8f6;--line:rgba(20,22,28,.08);--line-2:rgba(20,22,28,.13);--ink:#14161c;--ink-2:#3b404c;--muted:#6b7280;--faint:#9aa1ad;
--gold:#eab308;--gold-2:#facc15;--gold-3:#ca8a04;--gold-ink:#1f1703;--gold-text:#9a6a05;--gold-soft:rgba(234,179,8,.12);--gold-line:rgba(202,138,4,.40);
--pos:#0f8a5f;--pos-soft:rgba(15,138,95,.10);--neg:#c8323f;--neg-soft:rgba(200,50,63,.09);--warn:#b7791f;--warn-soft:rgba(183,121,31,.10);--info:#2f6fd6;--info-soft:rgba(47,111,214,.09);
--grid:rgba(20,22,28,.07);--head:linear-gradient(90deg,#FACC15,#EAB308);--head-ink:#1f1703;--head-sub:rgba(31,23,3,.72);
--shadow:0 1px 2px rgba(20,22,28,.05),0 14px 34px -20px rgba(20,22,28,.22);--sans:"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0a0c11;--surface:#121620;--surface-3:#1d2331;--line:rgba(255,255,255,.07);--line-2:rgba(255,255,255,.12);--ink:#eef0f5;--ink-2:#c3c8d4;--muted:#8a93a6;--faint:#5d6578;
--gold:#d6b25e;--gold-2:#f1d993;--gold-3:#a8812e;--gold-ink:#1a1408;--gold-text:#f1d993;--gold-soft:rgba(214,178,94,.12);--gold-line:rgba(214,178,94,.32);
--pos:#3fcf8e;--pos-soft:rgba(63,207,142,.12);--neg:#f0636f;--neg-soft:rgba(240,99,111,.12);--warn:#f2b84b;--warn-soft:rgba(242,184,75,.12);--info:#6ea8fe;--info-soft:rgba(110,168,254,.12);
--grid:rgba(255,255,255,.06);--head:rgba(14,17,24,.92);--head-ink:#eef0f5;--head-sub:#c3c8d4;--shadow:0 1px 0 rgba(255,255,255,.04) inset,0 20px 50px -20px rgba(0,0,0,.7);color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0a0c11;--surface:#121620;--surface-3:#1d2331;--line:rgba(255,255,255,.07);--line-2:rgba(255,255,255,.12);--ink:#eef0f5;--ink-2:#c3c8d4;--muted:#8a93a6;--faint:#5d6578;
--gold:#d6b25e;--gold-2:#f1d993;--gold-3:#a8812e;--gold-ink:#1a1408;--gold-text:#f1d993;--gold-soft:rgba(214,178,94,.12);--gold-line:rgba(214,178,94,.32);
--pos:#3fcf8e;--pos-soft:rgba(63,207,142,.12);--neg:#f0636f;--neg-soft:rgba(240,99,111,.12);--warn:#f2b84b;--warn-soft:rgba(242,184,75,.12);--info:#6ea8fe;--info-soft:rgba(110,168,254,.12);
--grid:rgba(255,255,255,.06);--head:rgba(14,17,24,.92);--head-ink:#eef0f5;--head-sub:#c3c8d4;--shadow:0 1px 0 rgba(255,255,255,.04) inset,0 20px 50px -20px rgba(0,0,0,.7);color-scheme:dark}
*{box-sizing:border-box;font-style:normal}
body{background:var(--bg);color:var(--ink);font:400 14px/1.5 var(--sans);font-feature-settings:"cv11","ss01";-webkit-font-smoothing:antialiased}
.num,.dt td.num{font-variant-numeric:tabular-nums}
.wrap{max-width:1180px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.top{background:var(--head);color:var(--head-ink);border-bottom:1px solid var(--gold-line)}
.top .wrap{display:flex;align-items:center;gap:14px;padding-block:18px;flex-wrap:wrap}
.emb{width:46px;height:46px;flex:none}
.top h1{margin:0;font-size:20px;font-weight:800;letter-spacing:-.01em}
.top .sub{font-size:12.5px;color:var(--head-sub);font-weight:600}
.top .r{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}
.tag{font:700 11px/1 var(--sans);letter-spacing:.08em;text-transform:uppercase;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.55);color:var(--gold-ink);border:1px solid rgba(31,23,3,.15)}
:root[data-theme="dark"] .tag{background:var(--gold-soft);color:var(--gold-text);border-color:var(--gold-line)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .tag{background:var(--gold-soft);color:var(--gold-text);border-color:var(--gold-line)}}
.demo{background:var(--warn-soft);border:1px solid var(--warn);color:var(--ink);border-radius:14px;padding:10px 14px;font-size:13px;margin-top:18px}
main{display:flex;flex-direction:column;gap:20px;padding-block:20px 48px}
.eyebrow,.lab,dt,.dt th{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.card{background:var(--surface);border:1px solid var(--line);border-radius:24px;box-shadow:var(--shadow)}
.hero{padding:22px;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:22px}
.hero h2{margin:6px 0 10px;font-size:24px;font-weight:800;letter-spacing:-.02em;text-wrap:balance}
.big{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.mk{background:var(--surface-3);border-radius:14px;padding:12px}
.mk .v{font-size:22px;font-weight:700;letter-spacing:-.015em;margin-top:4px}
.mk .s{font-size:11.5px;color:var(--muted)}
.prio{border:1px solid var(--gold-line);background:var(--gold-soft);border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:6px}
.prio b.t{font-size:15px}
.prio .meta{display:flex;gap:8px;flex-wrap:wrap}
.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.cc{background:var(--surface);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);padding:16px;display:flex;flex-direction:column;gap:10px}
.cc-h{display:flex;justify-content:space-between;align-items:flex-start}
.cc-score .num{font-size:34px;font-weight:800;letter-spacing:-.02em}.cc-score .of{color:var(--muted);font-weight:600;margin-left:2px}
.spark{width:100%;height:56px;display:block}.sg{stroke:var(--grid)}.sa{fill:var(--gold-soft)}.sl{fill:none;stroke:var(--gold);stroke-width:2}.se{fill:var(--gold);stroke:var(--surface);stroke-width:2}
.kv{display:grid;grid-template-columns:1fr 1fr;gap:10px 12px;margin:0}.kv dd{margin:2px 0 0;font-weight:700}
.cc-msg{margin:0;font-size:13px;color:var(--ink-2);border-top:1px solid var(--line);padding-top:10px}
.dl{font-size:11.5px;font-weight:700;margin-left:4px;white-space:nowrap}.dl.good{color:var(--pos)}.dl.bad{color:var(--neg)}.dl.flat{color:var(--muted)}
.pill{display:inline-block;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:999px;white-space:nowrap}
.pill.pos{background:var(--pos-soft);color:var(--pos)}.pill.warn{background:var(--warn-soft);color:var(--warn)}.pill.neg{background:var(--neg-soft);color:var(--neg)}.pill.muted{background:var(--surface-3);color:var(--muted)}
.chip{display:inline-block;font-size:11.5px;font-weight:600;padding:3px 8px;border-radius:8px;background:var(--surface-3);color:var(--ink-2);border:1px solid var(--line)}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.sec{padding:22px;display:flex;flex-direction:column;gap:14px}
.sec-h{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.sec h2{margin:4px 0 0;font-size:17px;font-weight:700;letter-spacing:-.01em;text-wrap:balance}
.up{font-size:12px;font-weight:600;color:var(--gold-text);text-decoration:none;white-space:nowrap}.up:hover,.up:focus-visible{text-decoration:underline}
a:focus-visible{outline:2px solid var(--gold);outline-offset:2px;border-radius:4px}
.grid2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px}
.col{display:flex;flex-direction:column;gap:10px;min-width:0}
h3.lab{margin:6px 0 0}.lab.info{color:var(--info)}.lab.warn{color:var(--warn)}.lab.pos{color:var(--pos)}
.dots{margin:0;padding-left:18px;color:var(--ink-2);display:flex;flex-direction:column;gap:4px}
.risks{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.risks li{background:var(--surface-3);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:6px}
.risks p{margin:0;color:var(--ink-2);font-size:13px}.ri-h{display:flex;justify-content:space-between;gap:10px}.ri-h .num{font-weight:700;white-space:nowrap}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:14px}
.dt{width:100%;border-collapse:collapse;font-size:12.5px}
.dt th{background:var(--surface-3);text-align:left;padding:9px 10px;border-bottom:1px solid var(--line-2);white-space:nowrap}
.dt td{padding:9px 10px;border-top:1px solid var(--line);vertical-align:top;color:var(--ink-2)}.dt td b{color:var(--ink)}
.dt .num{text-align:right}
.dt.an{min-width:980px}.dt.an td:nth-child(2){min-width:190px}.dt.an td:nth-child(6){min-width:130px}.dt.an td:nth-child(7){min-width:340px}.dt.an td.num{white-space:nowrap}.muted{color:var(--muted)}.meta{font-size:11.5px;color:var(--muted)}
.bar{display:block;width:90px;height:8px;border-radius:99px;background:var(--surface-3);overflow:hidden;margin-top:5px}.bar i{display:block;height:100%;border-radius:99px}
.bar i.pos{background:var(--pos)}.bar i.warn{background:var(--warn)}.bar i.neg{background:var(--neg)}.bar i.muted{background:var(--faint)}
.lead{margin:0;color:var(--ink-2);max-width:75ch}.note{margin:0;font-size:13px;color:var(--ink-2)}
.steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.step{background:var(--surface-3);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:6px;align-items:flex-start}.step p{margin:0;font-size:13px;color:var(--ink-2)}
details summary{cursor:pointer;font-weight:600;font-size:13px;color:var(--gold-text)}
footer{font-size:11.5px;color:var(--muted);padding-block:0 32px}
@media (max-width:860px){.hero,.grid2{grid-template-columns:1fr}.cards,.steps{grid-template-columns:1fr}}
@media (max-width:480px){.big{grid-template-columns:1fr 1fr}.top .r{margin-left:0}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
<header class="top"><div class="wrap">${EMBLEM}<div><h1>Haftalık Stok Raporu</h1><div class="sub">D/U BI · Stok ekibi · ${ay(donem)} kapanışı</div></div>
<div class="r"><span class="tag">${U.map(x => x.u).join(' · ')}</span><span class="tag">USD · tutar bazlı</span></div></div></header>
<div class="wrap">
${ozet.demo ? `<div class="demo" role="note"><b>Deneme çalıştırması.</b> Bu rapordaki tüm şirket, depo ve rakamlar dashboard'un kurgusal demo verisidir (${esc(ozet.sirket)}). Gerçek veri bağlandığında aynı akış gerçek rakamlarla çalışır.</div>` : ''}
<main>
<section class="card hero" id="ozet" aria-labelledby="h-oz">
  <div><div class="eyebrow">Grup özeti · ${U.length} ülke</div>
    <h2 id="h-oz">Grup stok sağlığı ${healthW}/100 · ${usdC(tot.firsat)} serbest bırakılabilir sermaye</h2>
    <div class="big">
      <div class="mk"><div class="eyebrow">Toplam stok</div><div class="v num">${usdC(tot.kalan)}</div><div class="s">${U.length} ülke, son ay</div></div>
      <div class="mk"><div class="eyebrow">Sermaye fırsatı</div><div class="v num">${usdC(tot.firsat)}</div><div class="s">Stoğun ${pct(tot.firsat / tot.kalan * 100)}'i</div></div>
      <div class="mk"><div class="eyebrow">Min altı açık</div><div class="v num">${usdC(tot.minAcik)}</div><div class="s">${nf0.format(tot.minN)} kalem, duruş riski</div></div>
    </div></div>
  ${topAct ? `<div class="prio"><div class="eyebrow">Bu haftanın 1 numaralı aksiyonu</div><b class="t">${esc(topAct.aksiyon)}</b>
    <div class="meta"><span class="chip">${esc(topAct.ulke)}</span><span class="chip">${esc(topAct.sorumlu)}</span><span class="chip">${esc(topAct.sure)}</span></div>
    <div class="meta">Tahmini etki <b class="num">${usd(topAct.etki_usd)}</b></div></div>` : ''}
</section>
<div class="cards">${U.map(countryCard).join('')}</div>
${U.map(countrySection).join('')}
${anomSec}
${auditSec}
</main>
<footer>Üretim ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })} · Rakamlar hesap motorundan, yorumlar analist ajanlarından; tümü kontrol ajanınca denetlendi.</footer>
</div>`;
const OUTDIR = join(ROOT, 'rapor', 'cikti'); mkdirSync(OUTDIR, { recursive: true });
writeFileSync(join(OUTDIR, 'stok-haftalik.html'), html);
console.log('Rapor: ' + join(OUTDIR, 'stok-haftalik.html') + ` (${(html.length / 1024).toFixed(0)} KB)`);
