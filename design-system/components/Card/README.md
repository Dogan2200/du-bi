# Card

Raporun temel kabı: `.card` — `surface → surface-2` dikey geçiş, `line` kenarlık, `r-xl` (24px) yarıçap, `shadow`, 20px iç boşluk; üst kenarda ortadan sönen ince altın çizgi.

**Başlık (`.card-h`):** `.eyebrow` (BÜYÜK HARF, 0.16em, önünde 14×3px altın çizgi) → `.card-t` (`card-title`, 17px / 700) → `.card-s` (12.5px, `muted`). Sağda isteğe bağlı araçlar (`.chart-tools`, Button).

- Ardışık kartlar arasında 16px; ızgaralarda `.grid .g2 / .g3 / .g-73 / .g-37`, 16px aralık.
- Açık temada kart zemini düz beyaz (geçiş yok).
- Gövde: bar listesi (`.bars`, `.bar-row`), grafik (`.chart`), tablo (DataTable) vb.

Statik görünüm; kaynak: `index.html` `.card`, `.card-h`, `.bar-row`.
