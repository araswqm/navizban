const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.watchFolders = [
  path.resolve(__dirname, "../../lib"),
];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../../node_modules"),
];

// pnpm symlink yapısı için Metro'nun symlink'leri takip etmesi gerekir
config.resolver.resolveSymlinks = true;

module.exports = config;
