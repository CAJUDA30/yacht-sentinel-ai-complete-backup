// Script to clear Supabase session from localStorage
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔍 Session Cleanup Script');
console.log('========================\n');
console.log('To clear your browser session:');
console.log('1. Open browser DevTools (F12)');
console.log('2. Go to Console tab');
console.log('3. Paste this command:\n');
console.log('\x1b[33m%s\x1b[0m', 'localStorage.clear(); sessionStorage.clear(); location.reload();');
console.log('\n✅ This will clear all sessions and reload the page.\n');

process.exit(0);
