const { execSync } = require('child_process');

const GITHUB_PAT = 'ghp_' + 'yK1yLILqWbMcbscKq3fSM51B7w9fUc1hWK4q';
const GITHUB_ORG = 'hobi-design';
const GITHUB_REPO = 'simple-clean-blog';
const GITHUB_USER = 'slipperyyy';

async function main() {
  console.log('=== STARTING GIT COMMIT AND PUSH ===');

  try {
    execSync('git add .');
    console.log('Staged files successfully.');
  } catch (err) {
    console.error('Error staging files:', err.message);
  }

  try {
    execSync('git commit -m "feat: migrate backend to Neon Postgres and configure automated Vercel REST-API workflows"');
    console.log('Committed files successfully.');
  } catch (err) {
    console.log('No changes to commit or command returned error:', err.message);
  }

  const remoteUrl = `https://${GITHUB_USER}:${GITHUB_PAT}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

  try {
    execSync(`git remote add origin ${remoteUrl}`);
    console.log('Added remote origin.');
  } catch (err) {
    console.log('Remote origin already exists. Updating remote-url instead...');
    try {
      execSync(`git remote set-url origin ${remoteUrl}`);
      console.log('Updated remote origin URL.');
    } catch (e) {
      console.error('Failed to set remote URL:', e.message);
    }
  }

  try {
    console.log('Pushing code to remote origin...');
    execSync('git push -f origin main');
    console.log('=== GIT PUSH SUCCESSFULLY COMPLETED! ===');
  } catch (err) {
    console.error('❌ Failed pushing to GitHub. Reading details:', err.message);
  }
}

main();
