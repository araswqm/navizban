#!/bin/bash
set -e
echo "Expo export baslatiliyor..."
cat > ../App.tsx << 'EOF'
import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
export function App() {
  const ctx = require.context("./artifacts/mobile/app");
  return <ExpoRoot context={ctx} />;
}
registerRootComponent(App);
EOF
npx expo export --platform web
cp web/_headers dist/ 2>/dev/null || true
cp web/_redirects dist/ 2>/dev/null || true
