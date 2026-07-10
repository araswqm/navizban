// Metro config for Expo export (Cloudflare Pages build)
// Expo loads metro.config.js from the project root (/opt/buildhome/repo/),
// NOT from artifacts/mobile/. This file bridges @/ imports to the mobile source.
const { getDefaultConfig } = require("@expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add lib package to watch folders
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, "lib"),
];

// Handle @/ imports → resolve to artifacts/mobile/
const projectRoot = __dirname;
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const filePath = path.join(projectRoot, "artifacts/mobile", moduleName.slice(2));
    return {
      filePath: path.normalize(filePath),
      type: "sourceFile",
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
