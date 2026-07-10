// Root entry for pnpm hoisted builds (Cloudflare Pages)
// pnpm node-linker=hoisted puts everything in root node_modules,
// so expo/AppEntry.js looks for ../../App at the repo root.
// This bridges that gap for expo-router projects.
import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";

export function App() {
  const ctx = require.context("./artifacts/mobile/app");
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
