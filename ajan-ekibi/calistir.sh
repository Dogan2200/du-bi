#!/usr/bin/env bash
# Stok ekibi — deterministik adımlar: veri → KPI → iki bağımsız kontrol.
# Ajan adımları (analiz, anomali, denetim) ve rapor için: ajanlar/orkestrator.md
set -euo pipefail
cd "$(dirname "$0")"
rm -rf calisma && mkdir -p calisma
node motor/cek.mjs
for u in $(node -p "require('./calisma/veri_ozet.json').ulkeler.join(' ')"); do node motor/kpi.mjs "$u"; done
python3 kontrol/dogrula.py
node kontrol/dashboard_esitlik.mjs
echo "Hazır: calisma/ — sıradaki adım ajan analizi (ajanlar/orkestrator.md §2)."
