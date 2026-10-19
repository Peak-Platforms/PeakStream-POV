// Wraps app.json. Setting APP_VARIANT=test (the "test" EAS build profile)
// builds a separate app, "StreamPal POV Test", with its own app ID, so it
// installs next to the regular StreamPal POV instead of replacing it.
module.exports = ({ config }) => {
  if (process.env.APP_VARIANT !== 'test') return config;
  return {
    ...config,
    name: 'StreamPal POV Test',
    scheme: 'peakstreamtest',
    ios: { ...config.ios, bundleIdentifier: 'com.peakplatforms.streampalpov.test' },
    android: { ...config.android, package: 'com.peakplatforms.streampalpov.test' },
  };
};
