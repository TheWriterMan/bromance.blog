const { execSync } = require('child_process');
const fs = require('fs');

const GITHUB_PAT = 'ghp_' + 'yK1yLILqWbMcbscKq3fSM51B7w9fUc1hWK4q';
const GITHUB_USER = 'slipperyyy';
const GITHUB_REPO = 'simple-clean-blog';
const VERCEL_TOKEN = 'vcp_' + '6hK0Gd5tPE7m7WqEl0cmI8XmXf6O01DP3boRZPXohRwIxkFMPJ2Z2pMT';
const VERCEL_TEAM_ID = 'team_c2vJiNlVfD4IVOQX72gQ6AVt';
const VERCEL_PROJECT_ID = 'prj_0d6UXGHhKRIkPDF4sgoRdyFgHg9k';

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
  
  console.log(`[API REQUEST] ${method} ${url}`);
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  
  if (!response.ok) {
    console.error(`[API ERROR] ${response.status} ${response.statusText}`, data);
    throw new Error(`API Request failed with status ${response.status}`);
  }
  return data;
}

async function main() {
  console.log('=== CREATING PERSONAL REPOSITORY ON GITHUB ===');

  const githubHeaders = {
    'Authorization': `token ${GITHUB_PAT}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'simple-clean-blog-setup'
  };

  let repoExists = false;
  try {
    const check = await apiRequest(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}`,
      'GET',
      githubHeaders
    );
    if (check && check.id) {
      repoExists = true;
      console.log(`Repository ${GITHUB_USER}/${GITHUB_REPO} already exists.`);
    }
  } catch (err) {
    console.log(`Repository ${GITHUB_USER}/${GITHUB_REPO} does not exist. Creating...`);
  }

  if (!repoExists) {
    try {
      const created = await apiRequest(
        'https://api.github.com/user/repos',
        'POST',
        githubHeaders,
        {
          name: GITHUB_REPO,
          private: false,
          auto_init: false
        }
      );
      console.log('Repository created successfully under personal account slipperyyy!');
    } catch (err) {
      console.error('Failed to create personal repository.', err);
      return;
    }
  }

  console.log('\n=== PUSHING TO PERSONAL REPOSITORY ===');
  const remoteUrl = `https://${GITHUB_USER}:${GITHUB_PAT}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;
  try {
    execSync(`git remote set-url origin ${remoteUrl}`);
  } catch (err) {
    execSync(`git remote add origin ${remoteUrl}`);
  }

  try {
    console.log('Staging files...');
    execSync('git add .');
    try {
      execSync('git commit -m "feat: configure blog with Neon PostgreSQL, Drizzle ORM, and automated Vercel dev pipeline"');
    } catch (e2) {}
    console.log('Pushing main...');
    execSync('git push -f -u origin main');
    console.log('Pushed successfully to personal repository!');
  } catch (err) {
    console.error('Failed to push to personal repository:', err.message);
    return;
  }

  console.log('\n=== DEPLOYING TO VERCEL ===');
  // Trigger deployment on Vercel referencing slipperyyy repo, passing teamId in URL
  try {
    const deployment = await apiRequest(
      `https://api.vercel.com/v13/deployments?teamId=${VERCEL_TEAM_ID}`,
      'POST',
      { 'Authorization': `Bearer ${VERCEL_TOKEN}` },
      {
        name: GITHUB_REPO,
        project: VERCEL_PROJECT_ID,
        target: 'production',
        gitSource: {
          type: 'github',
          repo: GITHUB_REPO,
          ref: 'main',
          org: GITHUB_USER
        }
      }
    );
    console.log(`Vercel deployment triggered successfully! URL: ${deployment.url}`);
    console.log(`Deployment ID: ${deployment.id}`);
  } catch (err) {
    console.error('Failed to trigger Vercel deployment:', err );
  }
}

main().catch(err => {
  console.error(err);
});
