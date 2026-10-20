# DataTable

Ayrıntı tablosu: `.table-wrap` (kaydırılabilir, `line` kenarlık, `r-md`, en fazla 620px yükseklik) içinde `table.dt`.

- Başlık: yapışkan, `surface-3` zemin, `table-head` stili (10.5px BÜYÜK HARF, 0.1em, `muted`), alt çizgi `line-2`.
- Hücre: 9px × 12px, 12.5px metin, satır ayırıcı `line`; satır hover `gold-soft`.
- Sayılar `.num`: sağa hizalı, tabular rakam, satır kırılmaz. Para `$` önekli, binlik ayırıcı nokta (tr-TR).
- Alt toplam `tfoot`: kalın, `surface-3`, altta yapışkan.
- Sıralanabilir/filtrelenebilir sürüm: `table.dt[data-sf="1"]`, başlık altında `.sf-filter` satırı; sıralama göstergesi `gold`.
- Durum sütununda Pill kullanın.

Statik görünüm (örnek değerlerle); kaynak: `index.html` `table.dt`.
