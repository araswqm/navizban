// Metro config for Expo export (Cloudflare Pages build)
// Expo loads metro.config.js from the project root (/opt/buildhome/repo/),
// NOT from artifacts/mobile/. This file bridges @/ imports to the mobile source.
const { getDefaultConfig } = require("@expo/metro-config");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);

// Add lib package to watch folders
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, "lib"),
];

const projectRoot = __dirname;
const originalResolveRequest = config.resolver.resolveRequest;

// Metro extensions in priority order
const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs", ".json"];

function resolveFilePath(basePath) {
  // Exact match
  if (fs.existsSync(basePath)) {
    const stat = fs.statSync(basePath);
    if (stat.isFile()) return path.normalize(basePath);
    // Directory → index file
    for (const ext of EXTENSIONS) {
      const indexPath = path.join(basePath, "index" + ext);
      if (fs.existsSync(indexPath)) return path.normalize(indexPath);
    }
    return null;
  }
  // Try adding extensions
  for (const ext of EXTENSIONS) {
    const filePath = basePath + ext;
    if (fs.existsSync(filePath)) return path.normalize(filePath);
  }
  return null;
}

// Handle @/ imports → resolve to artifacts/mobile/ with full extension resolution
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const basePath = path.join(projectRoot, "artifacts/mobile", moduleName.slice(2));
    const resolved = resolveFilePath(basePath);
    if (resolved) {
      return {
        filePath: resolved,
        type: "sourceFile",
      };
    }
    // If file not found, fall through to default resolver so Metro can produce
    // a proper "module not found" error rather than a confusing SHA-1 error.
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
