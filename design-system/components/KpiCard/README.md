# KpiCard

Bir ana metriği, önceki döneme göre değişimini, eğilimini ve hedef durumunu tek kartta gösterir: `.kpi`.

**Yapı:** `.k-top` (`.k-lab` BÜYÜK HARF etiket + `.k-ic` 26px altın ikon kutusu) → `.k-val` (`kpi-value`, 25px / 700, tabular rakam) → `.k-mid` (Delta + `.k-pv` "önceki ay …") → `.k-spark-w` (34px tam genişlik sparkline) → `.k-foot` (`surface-3` alt şerit, durum noktası + kısa not).

- Üstteki 3px şerit, sparkline ve alt nokta rengi `--kc` ile verilir: varsayılan `gold`; hedef durumu için `pos` / `warn` / `neg`.
- Kartlar `.kpis` ızgarasında 4 sütun (≤1100px 2, ≤520px 1), 14px aralık.
- Hover: kenarlık `gold-line`, 2px yukarı.

**Tüketici sağlar:** etiket, biçimlenmiş değer, delta, önceki değer metni, sparkline serisi, alt not ve `--kc` durumu; ikon için `assets/Icons/kpi-*.svg` yollarından biri.

Statik görünüm (örnek değerlerle); kaynak: `index.html` `.kpi`, `renderKPIs()`.
