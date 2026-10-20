# Pill

Tablo ve listelerde durum rozeti: `.pill` + durum sınıfı, isteğe bağlı `<i class="d">` nokta.

| Sınıf | Zemin / metin | Anlamı |
| --- | --- | --- |
| `.crit` | `neg-soft` / `neg` | Kritik (skor < 50) |
| `.mid` | `warn-soft` / `warn` | İzlenmeli (50–79) |
| `.low` | `pos-soft` / `pos` | Hedefte (≥ 80) |
| `.info` | `info-soft` / `info` | Bilgi |
| `.gold` | `gold-soft` / `gold` | Marka vurgusu |

Durumu her zaman kelimeyle de yazın ("Kritik", "İzlenmeli", "Hedefte"); yalnızca renge güvenmeyin. 11px / 700 metin. Açık temada `warn` beyaz üzerinde 3.6:1 olduğundan bu rozet kalın metinle kullanılır.

Statik görünüm; kaynak: `index.html` `.pill`, `.tag`.
