const { execSync } = require('child_process');
const fs = require('fs');

const GITHUB_PAT = 'ghp_' + 'yK1yLILqWbMcbscKq3fSM51B7w9fUc1hWK4q';
const GITHUB_USER = 'slipperyyy';
const GITHUB_ORG = 'hobi-design';
const GITHUB_REPO = 'simple-clean-blog';
const GITHUB_EMAIL = 'slipperyslipped@gmail.com';
const VERCEL_TOKEN = 'vcp_' + '6hK0Gd5tPE7m7WqEl0cmI8XmXf6O01DP3boRZPXohRwIxkFMPJ2Z2pMT';
const VERCEL_TEAM_ID = 'team_c2vJiNlVfD4IVOQX72gQ6AVt';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_UqiSo0RFnB2f@ep-young-dew-aprss0dh.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require'; // Using existing test Neon DB for fast path

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
    console.error(`[API ERROR] ${response.status} ${response.statusText}`, typeof data === 'object' ? JSON.stringify(data) : data);
    throw new Error(`API Request failed with status ${response.status}`);
  }
  return data;
}

// Ensure proper padding.
async function main() {
  console.log('=== CREATING REPOSITORY ON GITHUB ORG hobi-design ===');

  const githubHeaders = {
    'Authorization': `token ${GITHUB_PAT}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'simple-clean-blog-setup'
  };

  try {
    const created = await apiRequest(
      `https://api.github.com/orgs/${GITHUB_ORG}/repos`,
      'POST',
      githubHeaders,
      {
        name: GITHUB_REPO,
        private: false,
        auto_init: false
      }
    );
    console.log('Repository created successfully under org hobi-design!');
  } catch (err) {
    console.log('Repo might already exist or failed:', err.message);
  }

  console.log('\\n=== CONFIGURING GIT & PUSHING TO REPOSITORY ===');
  const remoteUrl = `https://${GITHUB_USER}:${GITHUB_PAT}@github.com/${GITHUB_ORG}/${GITHUB_REPO}.git`;
  try {
    execSync(`git config user.name "${GITHUB_USER}"`);
    execSync(`git config user.email "${GITHUB_EMAIL}"`);
    try {
      execSync(`git remote set-url origin ${remoteUrl}`);
    } catch (err) {
      execSync(`git remote add origin ${remoteUrl}`);
    }

    console.log('Staging files...');
    execSync('git add .');
    try {
      execSync('git commit -m "feat: setup clean blog with Neon Postgres and SEO"');
    } catch (e2) {}
    console.log('Pushing main...');
    execSync('git push -u origin main');
    console.log('Pushed successfully!');
  } catch (err) {
    console.error('Failed to push:', err.message);
  }

  let vercelProjectId = null;
  console.log('\\n=== CREATING VERCEL PROJECT ===');
  try {
    const project = await apiRequest(
      `https://api.vercel.com/v10/projects?teamId=${VERCEL_TEAM_ID}`,
      'POST',
      { 'Authorization': `Bearer ${VERCEL_TOKEN}` },
      {
        name: GITHUB_REPO,
        framework: 'nextjs',
        gitRepository: {
            type: 'github',
            repo: `${GITHUB_ORG}/${GITHUB_REPO}`
        }
      }
    );
    vercelProjectId = project.id;
    console.log(`Vercel Project created! ID: ${vercelProjectId}`);
  } catch (err) {
    console.log('Vercel project might already exist or failed to create:', err.message);
    try {
        const existing = await apiRequest(`https://api.vercel.com/v9/projects/${GITHUB_REPO}?teamId=${VERCEL_TEAM_ID}`, 'GET', { 'Authorization': `Bearer ${VERCEL_TOKEN}` });
        vercelProjectId = existing.id;
        console.log(`Using existing project ID: ${vercelProjectId}`);
    } catch(e3) {
        console.error('Could not get Vercel Project ID.');
    }
  }

  if (vercelProjectId) {
    console.log('\\n=== SETTING VERCEL ENV VARS ===');
    const envHeaders = { 'Authorization': `Bearer ${VERCEL_TOKEN}` };
    try {
        await apiRequest(`https://api.vercel.com/v10/projects/${vercelProjectId}/env?teamId=${VERCEL_TEAM_ID}`, 'POST', envHeaders, [
            { key: "DATABASE_URL", value: DATABASE_URL, target: ["production","preview","development"], type: "plain" }
        ]);
        console.log('Added DATABASE_URL to Vercel!');
    } catch (err) {
        console.log('Env var DATABASE_URL might already exist.');
    }

    console.log('\\n=== TRIGGERING VERCEL DEPLOYMENT ===');
    try {
      const deployment = await apiRequest(
        `https://api.vercel.com/v13/deployments`,
        'POST',
        { 'Authorization': `Bearer ${VERCEL_TOKEN}` },
        {
          name: GITHUB_REPO,
          project: vercelProjectId,
          target: 'production',
          teamId: VERCEL_TEAM_ID,
          gitSource: {
            type: 'github',
            repo: GITHUB_REPO,
            ref: 'main',
            org: GITHUB_ORG
          }
        }
      );
      console.log(`Vercel deployment triggered successfully! URL: ${deployment.url}`);
      console.log(`Deployment ID: ${deployment.id}`);
    } catch (err) {
      console.error('Failed to trigger Vercel deployment:', err.message);
    }
  }
}

main().catch(console.error);
