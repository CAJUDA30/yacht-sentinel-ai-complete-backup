// Force clear React Query cache and reload fresh data
// Run this in your browser console AFTER opening the app

console.log('🧹 FORCE CLEARING ALL CACHES...');

// 1. Clear React Query cache
if (window.queryClient) {
  window.queryClient.clear();
  console.log('✅ React Query cache cleared');
}

// 2. Clear localStorage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('provider') || key.includes('api') || key.includes('backup'))) {
    keysToRemove.push(key);
  }
}
keysToRemove.forEach(key => localStorage.removeItem(key));
console.log(`✅ Cleared ${keysToRemove.length} localStorage keys:`, keysToRemove);

// 3. Clear sessionStorage
sessionStorage.clear();
console.log('✅ Session storage cleared');

// 4. Reload the page to fetch fresh data
console.log('🔄 Reloading page in 2 seconds to fetch fresh data...');
setTimeout(() => {
  window.location.reload();
}, 2000);
