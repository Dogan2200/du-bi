# Filter

Çok seçimli rapor filtresi: `.filters` ızgarası içinde `.ddbox` kutuları ve sonda "Temizle" (`.btn.ghost.btn-clear`).

- `.ddbox > button`: üstte `<b>` etiket (`filter-label`, 9.5px BÜYÜK HARF, `muted`), altta `.lab` seçili değer (12.5px / 600, taşarsa üç nokta); sağda dönen ok. `surface-2` zemin, `line` kenarlık, 12px yarıçap.
- `.ddbox.active` (bir değer seçili): `gold-line` kenar + `gold-soft` zemin. `.open`: açılır `.dd` paneli görünür.
- `.dd`: `surface`, `line-2`, 14px yarıçap, `shadow-lg`; üstte yapışkan arama, satırlar `.row` (hover `surface-3`), checkbox `accent-color: gold`.
- Izgara: geniş ekranda otomatik, ≤1180px 4 sütun, ≤640px 2 sütun.
- Değer yoksa "Tümü" yazın.

**Tüketici sağlar:** boyut adı, seçenek listesi, seçim durumu.

Statik görünüm; kaynak: `index.html` `.filters`, `.ddbox`, `.dd`.
