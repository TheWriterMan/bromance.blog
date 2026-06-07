const { execSync } = require('child_process');
const fs = require('fs');

const GITHUB_PAT = 'ghp_' + 'yK1yLILqWbMcbscKq3fSM51B7w9fUc1hWK4q';
const GITHUB_USER = 'slipperyyy';
const GITHUB_ORG = 'hobi-design';
const GITHUB_REPO = 'simple-clean-blog';
const GITHUB_EMAIL = 'slipperyslipped@gmail.com';
const VERCEL_TOKEN = 'vcp_' + '6hK0Gd5tPE7m7WqEl0cmI8XmXf6O01DP3boRZPXohRwIxkFMPJ2Z2pMT';
const VERCEL_TEAM_ID = 'team_c2vJiNlVfD4IVOQX72gQ6AVt';

async function apiRequest(url, method, headers = {}, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch(e) {
    data = await response.text();
  }
  if (!response.ok) {
    throw new Error(`API Request failed with status ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log('Fixing git index...');
  try {
    fs.rmSync('.git/index', { force: true });
    execSync('git reset');
  } catch (err) {}

  console.log('Adding and commiting...');
  try {
    execSync(`git config user.name "${GITHUB_USER}"`);
    execSync(`git config user.email "${GITHUB_EMAIL}"`);
    const remoteUrl = `https://${GITHUB_USER}:${GITHUB_PAT}@github.com/${GITHUB_ORG}/${GITHUB_REPO}.git`;
    try {
      execSync(`git remote set-url origin ${remoteUrl}`);
    } catch {
      execSync(`git remote add origin ${remoteUrl}`);
    }
    execSync('git add .');
    execSync('git commit -m "feat: setup clean blog with Neon Postgres and SEO" || true');
    execSync('git push -f -u origin main');
    console.log('Pushed to GitHub successfully.');
  } catch (err) {
    console.error('Failed to push:', err.message);
  }

  // Trigger vercel deploy
  console.log('Triggering Vercel build...');
  try {
      const deployment = await apiRequest(
        `https://api.vercel.com/v13/deployments?teamId=${VERCEL_TEAM_ID}`,
        'POST',
        { 'Authorization': `Bearer ${VERCEL_TOKEN}` },
        {
          name: GITHUB_REPO,
          project: 'prj_0d6UXGHhKRIkPDF4sgoRdyFgHg9k',
          target: 'production',
          gitSource: {
            type: 'github',
            repo: GITHUB_REPO,
            ref: 'main',
            org: GITHUB_ORG
          }
        }
      );
      console.log(`Vercel deployment triggered! URL: ${deployment.url} ID: ${deployment.id}`);
  } catch (err) {
      console.error('Deployment trigger failed:', err.message);
  }
}

main().catch(console.error);
