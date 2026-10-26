# D/U BI Stok Ekibi

D/U BI dashboard'unun verisinden her hafta ülke bazlı stok raporu üreten ajan ekibi.

## Ekip

| Katman | Kim | Ne yapar |
|---|---|---|
| Veri | `motor/cek.mjs` | Veriyi çeker ve ülkelere böler. Demo modunda dashboard'un kendi demo üreticisini çalıştırır. |
| Hesap | `motor/kpi.mjs` | Dashboard'la birebir aynı KPI formülleri: kapsam, devir, min/max, ölü stok, sağlık skoru, risk listeleri, Pareto. |
| Kontrol 1 | `kontrol/dogrula.py` | KPI'ları ayrı bir Python motoruyla sıfırdan yeniden hesaplar ve veri bütünlüğünü kontrol eder. |
| Kontrol 2 | `kontrol/dashboard_esitlik.mjs` | Rakamları dashboard'un kendi `monthMetrics` koduyla karşılaştırır. |
| Analiz | `ajanlar/ulke-analisti.md` | Her ülke için bir ajan. Paralel çalışırlar, rakam üretmezler, yorumlarlar. |
| Analiz | `ajanlar/anomali-analisti.md` | Tüm ülkelerde sıra dışı hareketleri sınıflandırır. |
| Denetim | `ajanlar/kontrol-ajani.md` | Analizlerdeki her sayıyı ve kalem adını kaynağa karşı denetler. Onay vermezse rapor çıkmaz. |
| Rapor | `rapor/olustur.mjs` | D/U BI tasarımında yönetici raporu üretir. |

Akışın tamamı `ajanlar/orkestrator.md` dosyasında.

## Güvenlik kilitleri

Şu durumlarda rapor üretilmez:
- İki kontrol motorundan biri uyuşmazsa,
- Kontrol ajanı `ONAY` vermezse.

## Gerçek veriye geçiş

`kaynak.json` içinde iki değişiklik yeterli:
1. `"mod": "demo"` değerini `"url"` yap.
2. Her ülkenin raw `.xlsx`, `.csv` veya `.json` bağlantısını gir.

Kolon başlıkları dashboard'un tanıdığı başlıklarla aynıdır (Dönem, Ülke, Depo, Stok Adı, Devreden/Giren/Çıkan/Kalan Tutar ve Miktar, Min/Max Seviye…). Excel için bir kez `npm i xlsx` çalıştır.

## Elle çalıştırma

```bash
./calistir.sh          # veri + KPI + iki kontrol
```

Ajan adımları için orkestratör akışına bak.
