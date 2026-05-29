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

module.exports = config;
