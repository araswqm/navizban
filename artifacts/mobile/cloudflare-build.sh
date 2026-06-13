#!/bin/bash
# ============================================================
# Navizban Cloudflare Pages Build Script
# Bu script hem Expo web export'u yapar hem de Cloudflare
# Pages için gerekli dosyaları dist/ klasörüne kopyalar.
#
# Cloudflare Pages build command olarak kullanın:
#   bash cloudflare-build.sh
# ============================================================

set -e

echo "🚆 Navizban Web - Cloudflare Pages Build"
echo "========================================"

# 1. Expo web export
echo "📦 Expo web export başlatılıyor..."
npx expo export --platform web
echo "✅ Expo export tamamlandı."

# 2. Cloudflare Pages yapılandırma dosyalarını kopyala
#    (_headers ve _redirects kök dizindeki web/ klasöründen alınır)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ -f "$REPO_ROOT/web/_headers" ]; then
  cp "$REPO_ROOT/web/_headers" "$SCRIPT_DIR/dist/_headers"
  echo "✅ _headers dist/ klasörüne kopyalandı."
else
  echo "⚠️  _headers dosyası bulunamadı: $REPO_ROOT/web/_headers"
fi

if [ -f "$REPO_ROOT/web/_redirects" ]; then
  cp "$REPO_ROOT/web/_redirects" "$SCRIPT_DIR/dist/_redirects"
  echo "✅ _redirects dist/ klasörüne kopyalandı."
else
  echo "⚠️  _redirects dosyası bulunamadı: $REPO_ROOT/web/_redirects"
fi

echo ""
echo "✅ Build tamamlandı! Çıktı: $SCRIPT_DIR/dist"
