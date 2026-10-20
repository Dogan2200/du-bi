# Button

Hap (pill) biçimli eylem butonu: `.btn`, 36px yükseklik, 999px yarıçap, `ui` metin stili (12.5px / 600).

**Varyantlar**
- `.btn` — varsayılan: `surface-2` zemin, `line-2` kenarlık, `ink` metin; ikon `gold` renginde. Hover'da kenarlık `gold-line` olur ve 1px yukarı kalkar.
- `.btn.gold` — birincil eylem: `gold-2 → gold → gold-3` 135° geçiş, metin ve ikon `gold-ink`. Bir ekranda tek birincil eylem.
- `.btn.ghost` — saydam zemin; "Temizle" gibi ikincil eylemler.
- `.btn.icon` — 36×36 yalnız ikon; mutlaka `title` verin.
- `[disabled]` — %50 opaklık, tıklanamaz.

**Tüketici sağlar:** etiket metni (Türkçe, Başlık Biçimi değil cümle biçimi: "Veri Yükle", "Kaydet"), isteğe bağlı 16px satır ikonu (`<svg viewBox="0 0 24 24">`, stroke 1.8, `currentColor`).

Statik görünüm; kaynak: `index.html` `.btn` kuralları (bundle.css).
