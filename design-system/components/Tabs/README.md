# Tabs

Rapor bölümleri arasında gezinme: `.tabs` (yapışkan, `glass` zemin + blur, 999px yarıçap, yatay kaydırma) içinde `.tab` düğmeleri.

- `.tab`: 36px, 12.5px / 600, `muted`; hover `ink`. İkon `.ti` 15px, stroke 2.
- `.tab.active`: `gold-2 → gold → gold-3` geçiş, metin `gold-ink`, altın gölge.
- `.badge`: kayıt sayısı rozeti — `neg-soft` / `neg`; aktif sekmede koyu saydam zemin. Sıfırsa gizleyin.
- Açık temada çubuk zemini düz beyaz. Mobilde (≤640px) yapışkanlık kalkar.

**Tüketici sağlar:** sekme etiketleri, `assets/Icons/tab-*.svg` ikonları, sayaçlar, `role="tablist"`.

Statik görünüm; kaynak: `index.html` `.tabs`, `.tab`.
