# Orkestratör — Stok Ekibi Haftalık Akışı

Bu dosya bir zamanlanmış görevin (veya elle çalıştırmanın) izlediği akıştır. Tüm yollar `ajan-ekibi/` klasörüne göredir.

## 1. Veri ve hesap (deterministik, ajan yok)
```bash
node motor/cek.mjs                         # kaynak.json'a göre veri → calisma/veri_*.json
for u in $(node -p "require('./calisma/veri_ozet.json').ulkeler.join(' ')"); do node motor/kpi.mjs $u; done
python3 kontrol/dogrula.py                 # bağımsız Python motoru
node kontrol/dashboard_esitlik.mjs         # dashboard'un kendi koduyla eşitlik
```
Herhangi biri hata verirse DUR, hatayı kullanıcıya bildir, rapor üretme.

## 2. Analiz (paralel ajanlar — tek mesajda başlat)
- Her ülke için bir **Ülke Analisti** (`ajanlar/ulke-analisti.md`)
- Bir **Anomali Analisti** (`ajanlar/anomali-analisti.md`)

Her ajana: rol dosyasının tamamını, ülke adını ve çalışma klasörünün mutlak yolunu ver.

## 3. Denetim
- **Kontrol Ajanı** (`ajanlar/kontrol-ajani.md`) — analizleri görmemiş, ayrı bir ajan.
- `DUZELTME` → yalnızca hatalı analizi, hata listesiyle ilgili ajana geri gönder; en fazla 2 tur. Sonra yeniden denetle.

## 4. Rapor
```bash
node rapor/olustur.mjs                     # calisma/ → rapor/cikti/stok-haftalik.html
```
Raporu yayınla (Artifact, aynı adres güncellenir). Kullanıcıya 3 satırlık özet gönder: genel sağlık, en büyük risk, bu haftanın 1 numaralı aksiyonu.
