// TEST CACHE IMPLEMENTATION
// Run this in browser console to test caching

console.log('🧪 Testing Cache Implementation...\n');

// Test 1: Check if cache utilities exist
console.log('Test 1: Cache Utilities');
try {
  const { clearCache, getCacheStatus } = require('@/lib/api-fast');
  console.log('✅ Cache utilities imported successfully');
} catch (e) {
  console.log('⚠️ Import directly from browser, testing with localStorage...');
}

// Test 2: Check localStorage cache
console.log('\nTest 2: LocalStorage Cache');
const cacheKeys = Object.keys(localStorage).filter(k => k.startsWith('cf_cache_'));
console.log(`📊 Found ${cacheKeys.length} cached items:`);
cacheKeys.forEach(key => {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      const age = Date.now() - (parsed.createdAt || 0);
      const ttl = parsed.expires - Date.now();
      console.log(`  - ${key.replace('cf_cache_', '')}: Age=${Math.floor(age/1000)}s, TTL=${Math.floor(ttl/1000)}s`);
    }
  } catch (e) {
    console.log(`  - ${key}: Invalid`);
  }
});

// Test 3: Check auto-login credentials
console.log('\nTest 3: Auto-Login');
const rememberMe = localStorage.getItem('cf_remember');
if (rememberMe) {
  try {
    const decoded = JSON.parse(atob(rememberMe));
    const age = Date.now() - decoded.timestamp;
    const daysLeft = Math.floor((30 * 24 * 60 * 60 * 1000 - age) / (24 * 60 * 60 * 1000));
    console.log(`✅ Auto-login enabled`);
    console.log(`📅 Valid for ${daysLeft} more days`);
  } catch (e) {
    console.log('⚠️ Auto-login credentials corrupted');
  }
} else {
  console.log('ℹ️ No auto-login credentials saved');
}

// Test 4: Check authentication
console.log('\nTest 4: Authentication Status');
const token = localStorage.getItem('token');
const isAuth = localStorage.getItem('isAuthenticated');
console.log(`Token: ${token ? '✅ Present' : '❌ Missing'}`);
console.log(`Authenticated: ${isAuth === 'true' ? '✅ Yes' : '❌ No'}`);

// Test 5: Cache statistics
console.log('\nTest 5: Cache Statistics');
let totalSize = 0;
let activeCount = 0;
let expiredCount = 0;

cacheKeys.forEach(key => {
  const item = localStorage.getItem(key);
  if (item) {
    totalSize += item.length;
    try {
      const parsed = JSON.parse(item);
      if (Date.now() < parsed.expires) {
        activeCount++;
      } else {
        expiredCount++;
      }
    } catch (e) {}
  }
});

console.log(`📦 Total size: ${(totalSize / 1024).toFixed(2)} KB`);
console.log(`✅ Active caches: ${activeCount}`);
console.log(`⏰ Expired caches: ${expiredCount}`);

// Test 6: Server cache status (if server is running)
console.log('\nTest 6: Server Cache Status');
fetch('http://localhost:5000/cache/health')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Server cache healthy');
    console.log('📊 Server stats:', data.cacheStats);
  })
  .catch(e => {
    console.log('⚠️ Server not running or cache endpoint not available');
  });

// Helper functions for manual testing
console.log('\n🛠️ Helper Functions:');
console.log('To clear all caches: clearAllCaches()');
console.log('To check cache status: checkCacheStatus()');
console.log('To test API speed: testAPISpeed()');

window.clearAllCaches = function() {
  const keys = Object.keys(localStorage);
  let count = 0;
  keys.forEach(key => {
    if (key.startsWith('cf_cache_') || key === 'cf_remember') {
      localStorage.removeItem(key);
      count++;
    }
  });
  console.log(`🗑️ Cleared ${count} items`);
};

window.checkCacheStatus = function() {
  const cacheKeys = Object.keys(localStorage).filter(k => k.startsWith('cf_cache_'));
  console.log(`\n📊 Cache Status: ${cacheKeys.length} items`);
  cacheKeys.forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      console.log(`  ${key.replace('cf_cache_', '')}: ${(item.length / 1024).toFixed(2)} KB`);
    }
  });
};

window.testAPISpeed = async function() {
  console.log('\n⏱️ Testing API Speed...');
  
  const tests = [
    { name: 'Leagues', url: 'http://localhost:5000/leagues' },
    { name: 'Matches', url: 'http://localhost:5000/matches' },
    { name: 'Players', url: 'http://localhost:5000/players' }
  ];
  
  for (const test of tests) {
    const start = Date.now();
    try {
      await fetch(test.url);
      const time = Date.now() - start;
      console.log(`  ${test.name}: ${time}ms ${time < 100 ? '⚡' : time < 500 ? '✅' : '🐌'}`);
    } catch (e) {
      console.log(`  ${test.name}: ❌ Failed`);
    }
  }
};

console.log('\n✅ Cache test complete!\n');
