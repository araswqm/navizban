#!/bin/bash
# ============================================================
# Navizban Build Script
# Kullanım: bash scripts/build.sh [android|ios|web|api|all]
# ============================================================

set -e

PLATFORM="${1:-android}"

echo "🚆 Navizban v1.2 Beta Build - Platform: $PLATFORM"
echo "========================================"

case "$PLATFORM" in
  android)
    echo "📱 Android APK build başlatılıyor..."
    cd "$(dirname "$0")/../artifacts/mobile"
    npx eas build --platform android --profile preview
    ;;
  ios)
    echo "🍎 iOS build başlatılıyor..."
    cd "$(dirname "$0")/../artifacts/mobile"
    npx eas build --platform ios --profile preview
    ;;
  web)
    echo "🌐 Web export başlatılıyor..."
    cd "$(dirname "$0")/../artifacts/mobile"
    npx expo export --platform web
    ;;
  api)
    echo "🔧 API server build başlatılıyor..."
    cd "$(dirname "$0")/../artifacts/api-server"
    npm run build
    ;;
  all)
    echo "🔧 Tüm build'ler başlatılıyor..."
    cd "$(dirname "$0")/.."
    pnpm install
    pnpm build
    echo ""
    echo "✅ Tüm build'ler tamamlandı!"
    ;;
  *)
    echo "❌ Bilinmeyen platform: $PLATFORM"
    echo "Kullanım: bash scripts/build.sh [android|ios|web|api|all]"
    exit 1
    ;;
esac

echo "✅ Build tamamlandı!"
