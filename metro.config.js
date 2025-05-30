const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure resolver to handle Node.js modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add polyfills and module aliases
config.resolver.alias = {
  // Core polyfills
  crypto: 'react-native-crypto',
  stream: 'stream-browserify',
  buffer: '@craftzdog/react-native-buffer',
  
  // Block WebSocket and related modules that cause issues
  'ws': require.resolve('./websocket-disable.js'),
  'ws/lib/stream': require.resolve('./stub.js'),
  'ws/lib/websocket': require.resolve('./stub.js'),
  'ws/index.js': require.resolve('./websocket-disable.js'),
  'ws/index': require.resolve('./websocket-disable.js'),
  'ws/lib': require.resolve('./stub.js'),
  'utf-8-validate': require.resolve('./stub.js'),
  'bufferutil': require.resolve('./stub.js'),
  
  // Block problematic web-streams polyfill
  'web-streams-polyfill': require.resolve('./stub.js'),
  'web-streams-polyfill/ponyfill/es6': require.resolve('./stub.js'),
};

// Block problematic Node.js modules
config.resolver.blockList = [
  // Block entire ws module and all its files
  /node_modules\/ws\/.*$/,
  /node_modules\/utf-8-validate\/.*$/,
  /node_modules\/bufferutil\/.*$/,
  /node_modules\/web-streams-polyfill\/.*$/,
];

module.exports = config;