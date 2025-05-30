// Graceful WebSocket disabling for React Native
// This prevents WebSocket usage without throwing errors

// Mock WebSocket constructor that silently fails
function MockWebSocket(url, protocols) {
  console.warn('WebSocket disabled in React Native - using HTTP fallback');
  
  // Create a mock object that looks like WebSocket but doesn't actually connect
  this.url = url;
  this.readyState = MockWebSocket.CLOSED;
  this.bufferedAmount = 0;
  this.extensions = '';
  this.protocol = '';
  
  // Mock event handlers
  this.onopen = null;
  this.onclose = null;
  this.onmessage = null;
  this.onerror = null;
  
  // Immediately trigger closed state
  setTimeout(() => {
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'WebSocket disabled', wasClean: true });
    }
  }, 0);
}

// Mock WebSocket static methods
MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;

// Mock instance methods
MockWebSocket.prototype.send = function(data) {
  console.warn('WebSocket.send() called but WebSocket is disabled');
};

MockWebSocket.prototype.close = function(code, reason) {
  this.readyState = MockWebSocket.CLOSED;
  if (this.onclose) {
    this.onclose({ code: code || 1000, reason: reason || 'Closed', wasClean: true });
  }
};

MockWebSocket.prototype.addEventListener = function(type, listener) {
  if (type === 'open' && this.onopen === null) this.onopen = listener;
  if (type === 'close' && this.onclose === null) this.onclose = listener;
  if (type === 'message' && this.onmessage === null) this.onmessage = listener;
  if (type === 'error' && this.onerror === null) this.onerror = listener;
};

MockWebSocket.prototype.removeEventListener = function(type, listener) {
  // Mock implementation
};

// Override global WebSocket
if (typeof global !== 'undefined') {
  global.WebSocket = MockWebSocket;
  global.WebSocketConstructor = MockWebSocket;
  
  // Also disable in window if it exists (for web compatibility)
  if (typeof window !== 'undefined') {
    window.WebSocket = MockWebSocket;
  }
}

// For CommonJS/Node.js style imports
module.exports = MockWebSocket;