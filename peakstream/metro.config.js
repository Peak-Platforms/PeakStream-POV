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

// The Mentra packages expose subpaths (e.g. "@mentra/bluetooth-sdk/react",
// "@mentra/cloud-protocol/photo-compression") through package "exports", which
// this Metro version does not read. Resolve them by hand from the exports map.
const fs = require('fs');
const mentraNodeModules = path.join(__dirname, 'node_modules', '@mentra');

function pickTarget(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    for (const cond of ['react-native', 'import', 'default', 'require']) {
      if (cond in value) {
        const t = pickTarget(value[cond]);
        if (t) return t;
      }
    }
  }
  return null;
}

function resolveMentraSubpath(moduleName) {
  const match = /^@mentra\/([^/]+)\/(.+)$/.exec(moduleName);
  if (!match) return null;
  const pkgName = match[1];
  const sub = './' + match[2];
  let pkgRoot = path.join(mentraNodeModules, pkgName);
  if (pkgName === 'bluetooth-sdk' && sdkPackagePath) pkgRoot = path.resolve(sdkPackagePath);
  const pkgJsonPath = path.join(pkgRoot, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) return null;
  const exportsMap = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).exports;
  if (!exportsMap || typeof exportsMap !== 'object') return null;

  let target = pickTarget(exportsMap[sub]);
  if (!target && exportsMap['./*']) {
    const pattern = pickTarget(exportsMap['./*']);
    if (pattern) target = pattern.replace('*', match[2]);
  }
  if (!target) return null;
  const filePath = path.join(pkgRoot, target);
  return fs.existsSync(filePath) ? { type: 'sourceFile', filePath } : null;
}

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolved = resolveMentraSubpath(moduleName);
  if (resolved) return resolved;
  return (defaultResolveRequest || context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
