# D/U BI Tasarım Sistemi

Bu klasör, `index.html` içindeki stillerden çıkarılan renk, yazı, köşe ve gölge değerlerini (`tokens.json`), logo ve ikonları (`assets/`), bileşen stillerini ve önizlemelerini (`components/`) içerir. Uygulamanın kendisi bu klasöre bağlı değildir; `index.html` olduğu gibi çalışır.

D/U BI, tedarik zinciri stok verisini yönetici kararına çeviren bir performans kokpitidir. Görsel dili **obsidyen ve şampanya altını** üzerine kuruludur: sakin, yoğun, rakam odaklı bir yüzey ve ölçülü altın vurgular. Bu sistemi kullanan her ekran aşağıdaki kurallara uyar.

## İçerik ilkeleri

- Arayüz dili **Türkçe**dir. Etiketlerde cümle biçimi kullanın: "Veri Yükle", "Yönetici Özeti", "Önceki ay". Her kelimesi büyük harfle başlayan başlık biçimi kullanılmaz; kurum ve sistem adları (ATLAS, VEGA, ORION, FSN, MTRL) olduğu gibi yazılır.
- Eyebrow, KPI etiketi, tablo başlığı ve filtre etiketi **BÜYÜK HARF** ve geniş harf aralığıyla (`eyebrow`, `kpi-label`, `table-head`, `filter-label`) yazılır. Bunun dışındaki metinler normal yazılır. İtalik kullanılmaz; kaynak tüm öğelerde `font-style: normal` zorlar.
- Sayılar Türkçe yazımla **tr-TR** biçimindedir. Binlik ayırıcı nokta, ondalık ayırıcı virgüldür. Para birimi `$` önektir: `$48.215.300`. Kısa gösterimde `$48,1 Mn` yazılır. Yüzde işareti başa gelir ve gerekirse önüne yön işareti eklenir: `%12,5`, `+%4,2`, `-%7,8`. Eksik değer için `—` kullanılır. Rakamlar her yerde tabular olmalıdır (`font-variant-numeric: tabular-nums`, `.num` / `.tnum`).
- Değişim yön glifleriyle yazılır: `▲` artış, `▼` azalış, `●` değişim yok. Yorum renkle verilir (Delta bileşeni).
- Durumlar her zaman kelimeyle yazılır. Eşikler sabittir: **Hedefte** (skor ≥ 80, `pos`), **İzlenmeli** (50–79, `warn`), **Kritik** (< 50, `neg`), **Veri yok** (`muted`).
- Analiz metinleri **Ne oldu → Neden → Ne yapmalı** sırasını izler. Bu üç başlık sırayla `info`, `warn` ve `pos` renk kodlarını taşır. Önemli sayı ve isimler `<b>` ile `ink` renginde vurgulanır.
- Emoji rapor yüzeyinde kullanılmaz. Yalnızca sohbet asistanının samimi mesajlarında (👋, 💡) ve boş durum kutlamasında (🎉) yer alır.

## Renk

- Sayfa `bg` zemini üzerinde durur. İçerik `surface` kartlarına yerleşir. Kartın içindeki ikinci katman (tablo başlığı, mini KPI, bar izi, KPI alt şeridi) `surface-3` kullanır. Buton ve giriş alanları `surface-2` zemindedir.
- Metin üç kademelidir. Birincil metin ve rakamlar `ink`, açıklama ve gövde metni `ink-2`, etiket ve alt bilgi `muted` kullanır. `faint` yalnızca dekoratif öğeler içindir; her iki temada da metin kontrastı 4.5:1'in altında kalır.
- Kenarlıklar 1px'tir. Varsayılan `line`, buton, giriş alanı ve tablo başlığı için `line-2` kullanılır. Hover ve odak durumlarında kenarlık `gold-line` olur.
- **Altın** marka rengidir ve az kullanılır. Kullanım yerleri şunlardır:
  - Birincil eylem ve aktif sekme dolgusu: `gold-2 → gold → gold-3` geçişi, üzerindeki metin `gold-ink`.
  - İkonlar, odak halkası ve ince vurgu çizgileri: `gold`.
  - Altın renkli metin: her zaman `gold-text`. Açık temada `gold` metin olarak okunmaz (1.9:1).
  - Seçili ya da hover zeminleri: `gold-soft`.
- Bar ve sıralama dolguları açık temada `#FACC15 → #EAB308` (yani `gold-2 → gold`) 90° geçişiyle çizilir. İkincil seri dolgusu `c2`, olumsuz seri `neg`, bilgi serisi `info` kullanır.
- Durum renkleri `pos`, `warn`, `neg` ve `info`'dur. Her biri `*-soft` zeminiyle birlikte rozet olarak kullanılır. Açık temada `pos` (4.36:1) ve `warn` (3.6:1) beyaz üzerinde küçük metin eşiğinin altındadır. Bu renkleri rozet içinde ve kalın metinle kullanın; uzun metne vermeyin.
- Grafiklerde kategorik seri sırası `c1` (altın), `c2` (petrol), `c3` (mor), `c4` (mercan), `c5` (mavi), `c6` (zeytin) şeklindedir. Izgara çizgileri `grid`, eksen ve değer etiketleri `axis` ile 11px (`chart-label`) yazılır.
- Yapışkan başlık ve sekme çubuğu `glass` zemini ve `backdrop-filter: blur(16–18px)` kullanır.
- Açık tema varsayılandır. Bu temada uygulama başlığı tam genişlikte altın şerittir (`#FACC15 → #EAB308`); kart ve sekme çubuğu zemini düz beyazdır. Koyu temada başlık `glass` olur ve alt kenarında altın bir saç çizgisi bulunur. Koyu sayfa zemininde iki hafif ışık lekesi yer alır: sol üstte altın, sağ üstte petrol.

## Tipografi

- Tek yazı ailesi **Inter**'dir (Google Fonts, 400–800). Başlıklar da gövde metni de bu aileyle yazılır (`sans`, `display`). Inter `"cv11","ss01"` font özellikleriyle ve antialiasing açık olarak kullanılır.
- Gövde metni `body` (14px / 1.5) stilindedir. Özet ve açıklama satırları `lead` (13px / 1.55), buton, sekme ve hücre metni `ui` (12.5px / 600), alt bilgi `meta` (11.5px) kullanır.
- Kart başlığı `card-title` (17px / 700, -0.01em) ile yazılır. KPI değeri `kpi-value` (25px / 700, -0.015em) stilindedir. Kapak başlığı `cover-title` (30px / 800, -0.02em) kullanır.
- Ağırlık yelpazesi geniştir ama hiyerarşi boyuttan çok ağırlık ve renkle kurulur. Değerler 700–800, etiketler 700 ve `muted`, açıklamalar 400 ve `ink-2` kullanır.

## Biçim, boşluk ve derinlik

- Köşe yarıçapları büyük ve yumuşaktır:
  - Kart, kapak ve modal: `r-xl` (24px).
  - KPI kartı, filtre çubuğu ve iç paneller: `r-lg` (18px).
  - Tablo sarmalayıcı, mini KPI ve ipucu kutusu: `r-md` (14px).
  - Giriş alanı ve küçük kutular: doğrudan 12px veya 8–10px.
- Buton, segment, chip, pill, sekme ve bar izleri **hap** biçimindedir (`border-radius: 999px`).
- Boşluk tanımlı token değildir; kaynaktaki sabit değerleri kullanın:
  - Kart iç boşluğu 20px (≤640px'te 16px).
  - Izgara ve kart arası boşluk 16px, KPI arası 14px.
  - Kapsayıcı en fazla 1320px genişliktedir ve 24px yan boşluk bırakır (mobilde 16px).
- Kartlar `shadow`, yüzen katmanlar (açılır menü, tooltip, toast, modal, sohbet) `shadow-lg` kullanır. Kartın üst kenarında ortadan sönen 1px altın çizgi bulunur.
- Kontrol yükseklikleri sabittir: buton ve sekme 36px, küçük seçici 32px, giriş alanı 38–44px.

## Etkileşim ve hareket

- Hover durumunda kenarlık `gold-line` olur. Butonlar 1px, KPI kartları 2px yukarı kalkar. Satır hover zemini `gold-soft` kullanır.
- Odak göstergesi `:focus-visible` için 2px `gold` dış çizgi ve 2px boşluktur. Giriş alanlarında `gold-line` kenar ile 4px `gold-soft` halka kullanılır. Açık temada `gold` beyaz üzerinde 1.9:1'dir; kaynak değer korunmuştur ancak 3:1 odak eşiğinin altındadır.
- Geçiş eğrisi `cubic-bezier(.2,.7,.2,1)`'dir (`--ease`, bundle.css). Süreler 0.15–0.35 saniyedir. Barlar soldan büyüyerek gelir (0.9s), paneller 6px kayarak belirir. `prefers-reduced-motion` açıkken tüm animasyon ve geçişler kapanır.
- Tıklanabilir veri öğeleri (`[data-xf]`) çapraz filtre uygular. Hover'da metin `gold-text` olur ve altı çizilir.

## İkonografi

- İkonlar kaynağın kendi çizgi ikonlarıdır (`assets/Icons/`). 24×24 viewBox kullanırlar ve dolgusuzdur. Stroke kalınlığı 1.8, sekme ikonlarında 2'dir; uçlar yuvarlaktır. Satır içinde 14–16px, sekmede 15px boyutundadır.
- Kodda ikon rengi `currentColor` ile verilir: butonda `gold`, KPI ikon kutusunda `gold` üzerinde `gold-soft`. Dosyalardaki kopyalar `<img>` ile görünsün diye `#14161c` (`ink`, açık) mürekkebiyle kaydedildi. Satır içi SVG olarak kullanırken `stroke`'u yeniden `currentColor` yapın.
- Harici ikon kütüphanesi kullanılmaz. Eksik bir ikon gerekiyorsa aynı ölçü ve çizgi kalınlığında çizin.

## Logo

- `assets/Logos/du-bi-emblem.svg` dairesel amblemdir: altın halka, obsidyen disk, "D/U" ve "BI" yazısı. Başlıkta 44px, kapakta 72px, giriş ekranında 86px olarak kullanılır. Her zaman beyaz daire zemin içinde ve 2px beyaz ya da `gold-2` çerçeveyle gösterilir.
- Amblemin yanında ürün adı `brand-title` stiliyle "D/U **BI**" olarak yazılır; "BI" `gold` rengindedir (açık temadaki altın başlıkta `ink`).

## Not: GitHub'dan alınmayanlar

Dogan2200/du-bi `main@11a13a9` sürümünden aktarıldı. Aşağıdaki öğeler bilerek dışarıda bırakıldı:

- **Font dosyası yok.** Inter, Google Fonts üzerinden yükleniyor (`bundle.css` içinde `@import`).
- **Spacing token'ı yok.** Kaynakta boşluk için CSS değişkeni tanımlı değil.
- **`--ease` bir hareket değeri olduğu için token olarak alınmadı.** `--font` ve `--display` de `bundle.css`'te değişken olarak kaldı.
- **Satır içi sabit renkler token yapılmadı.** Bunlar şunlar:
  - Altın: `#FACC15`, `#EAB308`, `#CA8A04`, `#1f1703`.
  - ABC sınıfı: `#FCE7A0`/`#5b4505`, `#E7E5E4`/`#44403c`.
  - Excel yeşili: `#107C41`.
  - Grafik dışı gri: `#94a3b8`.
  - `color-mix()` ile türetilen gölgeler.
- **Bileşenler React kütüphanesi değil.** Kaynakta yalnızca CSS sınıfları var. Kaynağın stil bloğu `components/bundle.css` olarak taşındı. On bileşen (Button, Segment, Chip, Pill, Delta, KpiCard, Card, Tabs, Filter, DataTable), bu CSS ile işaretlenmiş statik önizlemeler olarak elle yazıldı.
- **Bileşen olarak alınmayan sayfa parçaları:** kapak sayfası düzeni (`.cv*`), sohbet asistanı (`.chat`, `.fab`), giriş ekranı, Pareto/ABC, min-max ve yaşlandırma panelleri, ısı haritası, grafikler. Bu parçaların stilleri `bundle.css` içinde mevcut.
