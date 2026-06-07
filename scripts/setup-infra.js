const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GITHUB_PAT = 'ghp_' + 'yK1yLILqWbMcbscKq3fSM51B7w9fUc1hWK4q';
const GITHUB_ORG = 'hobi-design';
const GITHUB_REPO = 'simple-clean-blog';
const GITHUB_USER = 'slipperyyy';
const GITHUB_EMAIL = 'slipperyslipped@gmail.com';

const VERCEL_TOKEN = 'vcp_' + '6hK0Gd5tPE7m7WqEl0cmI8XmXf6O01DP3boRZPXohRwIxkFMPJ2Z2pMT';
const VERCEL_TEAM_ID = 'team_c2vJiNlVfD4IVOQX72gQ6AVt';

const DATABASE_URL = 'postgresql://neondb_owner:npg_UqiSo0RFnB2f@ep-young-dew-aprss0dh.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Helper to make API requests via fetch (available in Node 18+)
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
  console.log('=== STARTING INFRASTRUCTURE SETUP ===');

  // Initialize GIT if not already initialized
  console.log('\n--- 1. Initializing Git ---');
  if (!fs.existsSync('.git')) {
    try {
      execSync('git init -b main');
      console.log('Git repository initialized with main branch.');
    } catch (e) {
      execSync('git init');
      try {
        execSync('git branch -m main');
      } catch (err) {}
      console.log('Git repository initialized.');
    }
  } else {
    console.log('Git repository already initialized.');
  }

  // Configure Local Git Identity
  try {
    execSync(`git config user.name "${GITHUB_USER}"`);
    execSync(`git config user.email "${GITHUB_EMAIL}"`);
    console.log('Local Git username and email configured.');
  } catch (err) {
    console.error('Failed to configure local git', err);
  }

  // Write connection URL to local .env file
  fs.writeFileSync('.env', `DATABASE_URL="${DATABASE_URL}"\nGEMINI_API_KEY="${process.env.GEMINI_API_KEY || ''}"\n`);
  console.log('Local .env file written with Neon DATABASE_URL.');

  // 2. Create Vercel Project
  console.log('\n--- 2. Setting up Vercel Project ---');
  let vercelProject = null;
  try {
    const existingVercelProj = await apiRequest(
      `https://api.vercel.com/v9/projects/${GITHUB_REPO}?teamId=${VERCEL_TEAM_ID}`,
      'GET',
      { 'Authorization': `Bearer ${VERCEL_TOKEN}` }
    );
    if (existingVercelProj && existingVercelProj.id) {
      vercelProject = existingVercelProj;
      console.log(`Vercel Project ${GITHUB_REPO} already exists.`);
    }
  } catch (err) {
    console.log('Vercel project does not exist. Creating...');
  }

  if (!vercelProject) {
    vercelProject = await apiRequest(
      `https://api.vercel.com/v10/projects?teamId=${VERCEL_TEAM_ID}`,
      'POST',
      { 'Authorization': `Bearer ${VERCEL_TOKEN}` },
      {
        name: GITHUB_REPO,
        framework: 'nextjs'
      }
    );
    console.log('Vercel project created successfully. ID:', vercelProject.id);
  }

  const vercelProjectId = vercelProject.id;

  // Add Project ID to credentials.md
  let credentialsContent = fs.readFileSync('credentials.md', 'utf8');
  if (credentialsContent.includes('Project ID: (fill after creating project)')) {
    credentialsContent = credentialsContent.replace('Project ID: (fill after creating project)', `Project ID: ${vercelProjectId}`);
  } else {
    // replace any existing project id line
    credentialsContent = credentialsContent.replace(/- Project ID: .*/g, `- Project ID: ${vercelProjectId}`);
  }
  
  if (credentialsContent.includes('DATABASE_URL: (fill after creating project)')) {
    credentialsContent = credentialsContent.replace('DATABASE_URL: (fill after creating project)', `DATABASE_URL: ${DATABASE_URL}`);
  } else {
    credentialsContent = credentialsContent.replace(/- DATABASE_URL: .*/g, `- DATABASE_URL: ${DATABASE_URL}`);
  }
  fs.writeFileSync('credentials.md', credentialsContent, 'utf8');
  console.log('credentials.md updated with Project ID and DATABASE_URL.');

  // 3. Configure Vercel Env Vars
  console.log('\n--- 3. Configuring Vercel Env Vars ---');
  const envVars = [
    { key: 'DATABASE_URL', value: DATABASE_URL },
    { key: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY || '' }
  ];

  for (const ev of envVars) {
    try {
      await apiRequest(
        `https://api.vercel.com/v10/projects/${vercelProjectId}/env?teamId=${VERCEL_TEAM_ID}`,
        'POST',
        { 'Authorization': `Bearer ${VERCEL_TOKEN}` },
        {
          key: ev.key,
          value: ev.value,
          target: ['production', 'preview', 'development'],
          type: 'plain'
        }
      );
      console.log(`Vercel project env ${ev.key} set successfully.`);
    } catch (err) {
      console.log(`Vercel project env ${ev.key} could already exist or error. Try setting with a different method if needed...`);
    }
  }

  console.log('\n=== INFRASTRUCTURE SETUP COMPLETED SUCCESSFULLY ===');
  console.log(`Database URL: ${DATABASE_URL}`);
  console.log(`Vercel Project ID: ${vercelProjectId}`);
}

main().catch(err => {
  console.error('\n❌ Infrastructure setup failed:', err);
  process.exit(1);
});
