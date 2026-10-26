#!/usr/bin/env python3
"""BAĞIMSIZ DOĞRULAMA MOTORU — KPI'ları ham veriden, birincil motordan (motor/kpi.mjs) ayrı olarak
Python'da yeniden hesaplar ve kpi_<ULKE>.json ile karşılaştırır. Tolerans: %0,01 (yuvarlama).
Kullanım: python3 kontrol/dogrula.py [calisma_klasoru]   → çıkış kodu 0 = tüm kontroller geçti
Çıktı: calisma/dogrulama.json
"""
import json, sys, unicodedata
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
DIR = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "calisma"
S = json.loads((ROOT / "kaynak.json").read_text(encoding="utf-8"))["ayarlar"]


def plain(s):
    s = str(s or "").replace("İ", "I").replace("ı", "i")
    return "".join(ch for ch in unicodedata.normalize("NFD", s) if not unicodedata.combining(ch)).lower()


def balance(r):
    d, g, x = r.get("Devreden") or 0, r.get("Giren") or 0, r.get("Cikan") or 0
    return d + g - x if (d or g or x) else (r.get("Kalan") or 0)


def in_transit(r):
    return "goods in transit" in plain(r.get("DepoSinifi")) or "goods in transit" in plain(r.get("Depo"))


def key(r):
    return f"{r.get('Depo') or '—'} • {r.get('StokAdi') or '—'}"


def recompute(rows):
    months = sorted({r["Donem"] for r in rows})
    by = defaultdict(list)
    for r in rows:
        by[r["Donem"]].append(r)
    cur = months[-1]
    i = len(months) - 1
    avg_win = months[max(0, i - S["avgMonths"] + 1): i + 1]
    dead_win = months[max(0, i - S["deadMonths"] + 1): i + 1]

    out_by_key = defaultdict(float)
    for m in avg_win:
        for r in by[m]:
            out_by_key[key(r)] += r.get("Cikan") or 0
    avg_out = {k: v / len(avg_win) for k, v in out_by_key.items()}
    active = {key(r) for m in dead_win for r in by[m] if (r.get("Giren") or 0) or (r.get("Cikan") or 0)}

    rs = by[cur]
    total = {"dev": 0.0, "kal": 0.0, "nongit": 0.0}
    min_def = below = 0
    max_def = 0
    below_gap = above_gap = dead = cov_x = 0.0
    dead_n = cov_n = 0
    for r in rs:
        b = balance(r)
        total["dev"] += r.get("Devreden") or 0
        total["kal"] += b
        git = in_transit(r)
        if not git:
            total["nongit"] += b
        mn, mx = r.get("MinTutar") or 0, r.get("MaxTutar") or 0
        if mn > 0:
            min_def += 1
            if b < mn:
                below += 1
                below_gap += mn - b
        if mx > 0:
            max_def += 1
            if b > mx:
                above_gap += b - mx
        if not git and b > 0 and key(r) not in active:
            dead_n += 1
            dead += b
        if not git and b > 0:
            a = avg_out.get(key(r), 0)
            if a > 0 and b / a * 30 > S["covMax"]:
                cov_n += 1
                cov_x += b - a * S["covTarget"] / 30

    monthly_out = sum((r.get("Cikan") or 0) for m in avg_win for r in by[m]) / len(avg_win)
    doh = total["kal"] / monthly_out * 30 if monthly_out > 0 else None
    turn = monthly_out * 12 / ((total["dev"] + total["kal"]) / 2) if monthly_out > 0 and total["dev"] + total["kal"] > 0 else None
    vals = {
        "doh": doh, "turn": turn,
        "stockout": below / min_def * 100 if min_def else None,
        "excess": above_gap / total["kal"] * 100 if max_def and total["kal"] > 0 else (0 if max_def else None),
        "dead": dead / total["nongit"] * 100 if total["nongit"] > 0 else 0,
    }
    better = {"doh": "low", "turn": "high", "stockout": "low", "excess": "low", "dead": "low"}
    num = den = 0
    for k, v in vals.items():
        if v is None:
            continue
        p = S["kpi"][k]
        t, w = p["target"], p["worst"]
        ratio = (w - v) / (w - t) if better[k] == "low" else (v - w) / (t - w)
        sc = round(min(1, max(0, ratio)) * 100)
        num += sc * p["w"]
        den += p["w"]
    health = round(num / den) if den else None
    return {
        "donem": cur, "kalan": total["kal"], "gunKapsami": doh, "devirHizi": turn,
        "minAltiKalem": below, "minAltiAcik": below_gap, "maxUstuFazla": above_gap,
        "oluStokKalem": dead_n, "oluStok": dead, "asiriKapsamKalem": cov_n, "asiriKapsamFazla": cov_x,
        "serbestBirakilabilirSermaye": above_gap + dead + cov_x, "saglikSkoru": health,
    }


def close(a, b):
    if a is None or b is None:
        return a is None and b is None
    return abs(a - b) <= max(0.02, abs(b) * 1e-4)


ozet = json.loads((DIR / "veri_ozet.json").read_text(encoding="utf-8"))
report, ok_all = {"demo": ozet.get("demo"), "ulkeler": {}}, True
for u in ozet["ulkeler"]:
    rows = json.loads((DIR / f"veri_{u}.json").read_text(encoding="utf-8"))
    kpi = json.loads((DIR / f"kpi_{u}.json").read_text(encoding="utf-8"))
    mine, theirs = recompute(rows), kpi["ozet"]
    checks = []
    for f, v in mine.items():
        if f == "donem":
            good = v == kpi["donem"]
        else:
            good = close(theirs.get(f), v)
        checks.append({"alan": f, "motor": theirs.get(f) if f != "donem" else kpi["donem"], "bagimsiz": round(v, 2) if isinstance(v, float) else v, "uyumlu": good})
        ok_all &= good
    # veri bütünlüğü: devreden + giren − çıkan = kalan (satır bazında)
    broken = sum(1 for r in rows if (r.get("Devreden") or r.get("Giren") or r.get("Cikan"))
                 and abs((r.get("Devreden") or 0) + (r.get("Giren") or 0) - (r.get("Cikan") or 0) - (r.get("Kalan") or 0)) > 0.05)
    neg = sum(1 for r in rows if (r.get("Kalan") or 0) < -0.005)
    # veri kalitesi (engellemez): tutarı olup miktarı 0 olan hareket/bakiye satırları
    qty_gap = sum(1 for r in rows if any((r.get(t) or 0) > 0 and not (r.get(m) or 0)
                  for t, m in (("Giren", "GirenM"), ("Cikan", "CikanM"), ("Kalan", "KalanM"))))
    report["ulkeler"][u] = {"kontroller": checks, "bakiyeTutarsizSatir": broken, "negatifBakiyeSatir": neg,
                            "tutarVarMiktarYokSatir": qty_gap,
                            "gecti": all(c["uyumlu"] for c in checks)}

report["gecti"] = ok_all
(DIR / "dogrulama.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
for u, r in report["ulkeler"].items():
    bad = [c["alan"] for c in r["kontroller"] if not c["uyumlu"]]
    print(f"{u}: {'GEÇTİ' if r['gecti'] else 'UYUMSUZ → ' + ', '.join(bad)} · bakiye tutarsız {r['bakiyeTutarsizSatir']} · negatif {r['negatifBakiyeSatir']} · tutar var/miktar 0: {r['tutarVarMiktarYokSatir']}")
sys.exit(0 if ok_all else 1)
