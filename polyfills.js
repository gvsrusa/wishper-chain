// React Native polyfills for Node.js modules

// Essential polyfills only
import 'react-native-url-polyfill/auto';

// Aggressive WebSocket disabling
import './websocket-disable';

// Minimal WebSocket and Node.js shims
if (typeof global !== 'undefined') {
  // Ensure our WebSocket mock is properly set
  console.log('✅ Polyfills loaded - WebSocket gracefully disabled for React Native');
  
  // Mock essential Node.js globals
  global.process = global.process || {
    env: {},
    nextTick: (cb) => setTimeout(cb, 0),
    platform: 'react-native',
    version: '18.0.0',
    cwd: () => '/',
  };
  
  // Mock Buffer if not already available
  if (typeof global.Buffer === 'undefined') {
    try {
      const { Buffer } = require('@craftzdog/react-native-buffer');
      global.Buffer = Buffer;
    } catch (e) {
      // Fallback if buffer not available
      global.Buffer = {
        from: (str) => str,
        isBuffer: () => false,
      };
    }
  }
}

export {};