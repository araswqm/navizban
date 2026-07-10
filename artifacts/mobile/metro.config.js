const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
const projectRoot = path.resolve(__dirname);

config.watchFolders = [
  path.resolve(__dirname, "../../lib"),
];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../../node_modules"),
];

// Intercept @/ imports at Metro resolver level (Babel transforms run AFTER resolution)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const filePath = path.join(projectRoot, moduleName.slice(2));
    return {
      filePath: path.normalize(filePath),
      type: "sourceFile",
    };
  }
  // Fall through to default resolver
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.resolveSymlinks = true;

module.exports = config;
