# Delta

Önceki döneme göre değişim rozeti: `.delta` + `.good` / `.bad` / `.flat`.

- Yön glifi metnin başında: artış `▲`, azalış `▼`, mutlak değişim < 0,05 ise `●`. Önceki değer yoksa "yeni", veri yoksa "—".
- Renk yöne değil **iyi/kötü** yorumuna göre: metriğin "iyi yönü" yukarıysa artış `good` (`pos` / `pos-soft`), aşağıysa azalış `good`. Nötr metrikler `flat` (`muted` / `surface-3`).
- Yüzde Türkçe yazımla: işaret, `%` önde, ondalık virgül: `+%12,5`.

**Tüketici sağlar:** güncel ve önceki değer, metriğin iyi yönü (`up` | `down` | `neutral`).

Statik görünüm; kaynak: `index.html` `.delta`, `deltaBadge()`.
