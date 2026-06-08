/**
 * Navizban Build Script
 *
 * Kullanım:
 *   node scripts/build.js [android|ios|web]
 *
 * Bu script EAS Build'i tetikler veya Expo publish yapar.
 */

const { execSync } = require("child_process");
const platform = process.argv[2] || "android";

console.log(`🚆 Navizban v1.2 Beta — ${platform} build başlatılıyor...`);

const commands = {
  android: "npx eas build --platform android --profile preview",
  ios: "npx eas build --platform ios --profile preview",
  web: "npx expo export --platform web",
};

const cmd = commands[platform];
if (!cmd) {
  console.error(`❌ Bilinmeyen platform: ${platform}`);
  console.log("Kullanım: node scripts/build.js [android|ios|web]");
  process.exit(1);
}

try {
  execSync(cmd, { stdio: "inherit", cwd: __dirname + "/.." });
  console.log("✅ Build başarıyla tamamlandı!");
} catch (err) {
  console.error("❌ Build hatası:", err.message);
  process.exit(1);
}
