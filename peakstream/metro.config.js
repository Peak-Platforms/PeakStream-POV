const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Support local SDK override via MENTRA_BLUETOOTH_SDK_PACKAGE_PATH env var
const sdkPackagePath = process.env.MENTRA_BLUETOOTH_SDK_PACKAGE_PATH;
if (sdkPackagePath) {
  const resolvedSdkPath = path.resolve(sdkPackagePath);
  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    '@mentra/bluetooth-sdk': resolvedSdkPath,
  };
  config.watchFolders = [...(config.watchFolders || []), resolvedSdkPath];
}

// The Mentra SDK exposes its React hooks at "@mentra/bluetooth-sdk/react" through
// package "exports", which this Metro version does not read. Map it by hand.
const mentraRoot = sdkPackagePath
  ? path.resolve(sdkPackagePath)
  : path.join(__dirname, 'node_modules', '@mentra', 'bluetooth-sdk');
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@mentra/bluetooth-sdk/react') {
    return {
      type: 'sourceFile',
      filePath: path.join(mentraRoot, 'src', 'react', 'index.ts'),
    };
  }
  return (defaultResolveRequest || context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
