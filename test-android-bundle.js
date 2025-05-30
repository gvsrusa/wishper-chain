#!/usr/bin/env node

// Simple test script to check if Android bundling works
const { execSync } = require('child_process');

console.log('🧪 Testing Android bundle creation...');

try {
  // Start Metro bundler in background
  console.log('📦 Starting Metro bundler...');
  const metro = execSync('npx expo start --web > metro.log 2>&1 &', { 
    stdio: 'inherit',
    timeout: 5000 
  });
  
  // Wait a bit for Metro to start
  console.log('⏳ Waiting for Metro to initialize...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Try to create Android bundle
  console.log('🔨 Creating Android bundle...');
  const result = execSync('curl -f http://localhost:8081/index.bundle?platform=android -o test_bundle.js', {
    stdio: 'pipe',
    timeout: 30000
  });
  
  console.log('✅ Android bundle created successfully!');
  
} catch (error) {
  console.error('❌ Android bundle failed:', error.message);
  
  // Show Metro logs if available
  try {
    const logs = execSync('tail -20 metro.log', { encoding: 'utf8' });
    console.log('\n📋 Metro logs:');
    console.log(logs);
  } catch (e) {
    console.log('No Metro logs available');
  }
}

// Cleanup
try {
  execSync('pkill -f "expo start"');
} catch (e) {
  // Ignore cleanup errors
}