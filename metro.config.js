// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path'); // Import path module for resolving local files

const config = getDefaultConfig(__dirname);

// Get the absolute path to your 'empty.js' file
const emptyModule = path.resolve(__dirname, 'empty.js');

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: require.resolve('readable-stream'), // Keep this, it's specific
  // Use your local empty.js for general Node.js standard library modules
  http: emptyModule,
  https: emptyModule,
  url: emptyModule, // Use emptyModule for 'url'
  assert: emptyModule,
  // Add other Node.js core modules here if they cause errors later:
  util: emptyModule,
  buffer: emptyModule,
  crypto: emptyModule, // If issues arise, consider 'react-native-crypto'
  timers: emptyModule,
  process: emptyModule,
  fs: emptyModule,
  net: emptyModule,
  tls: emptyModule,
  dns: emptyModule,
  zlib: emptyModule,
  fs: emptyModule,
  path: emptyModule,
  os: emptyModule,
  child_process: emptyModule,
};

// This might also be needed for certain contexts, though less common for your error:
// config.resolver.sourceExts.push('cjs'); // For older CommonJS modules if needed

module.exports = config;