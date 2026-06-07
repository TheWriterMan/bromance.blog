const { execSync } = require('child_process');
const fs = require('fs');

console.log('=== RESETTING LOCAL GIT REPOSITORY ===');
try {
  fs.rmSync('.git', { recursive: true, force: true });
  console.log('Removed old .git directory.');
} catch (e) {
  console.log('No .git folder to remove or folder already deleted.', e.message);
}

try {
  execSync('git init -b main');
  execSync('git config user.name "slipperyyy"');
  execSync('git config user.email "slipperyslipped@gmail.com"');
  console.log('Re-initialized Git with branch main.');
} catch (e) {
  console.error('Failed to configure Git:', e.message);
}
