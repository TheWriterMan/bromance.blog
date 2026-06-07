const VERCEL_TOKEN = 'vcp_' + '6hK0Gd5tPE7m7WqEl0cmI8XmXf6O01DP3boRZPXohRwIxkFMPJ2Z2pMT';
const VERCEL_TEAM_ID = 'team_c2vJiNlVfD4IVOQX72gQ6AVt';
const DEPLOYMENT_ID = 'dpl_GEFiNAVcK9s8ayCwnxma85e11veR';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
  console.log('=== STARTING DEPLOYMENT PROGRESS TRACKER ===');
  
  for (let i = 0; i < 20; i++) {
    const response = await fetch(
      `https://api.vercel.com/v13/deployments/${DEPLOYMENT_ID}?teamId=${VERCEL_TEAM_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await response.json();
    if (!response.ok) {
      console.error('Error fetching build status:', data);
      break;
    }

    const state = data.readyState || data.status;
    console.log(`[Attempt ${i+1}] State: ${state}`);
    
    if (state === 'READY') {
      console.log('🎉 DEPLOYMENT IS FULLY READY & ACTIVE!');
      console.log(`Production URL: https://simple-clean-blog-slipperyyys-projects.vercel.app`);
      console.log(`Alias URL: https://${data.url}`);
      return;
    } else if (state === 'ERROR') {
      console.error('❌ Build failed! Details:', data.error || 'Check Vercel Dashboard logs.');
      return;
    }

    await sleep(8000); // Wait 8 seconds before retry
  }
  
  console.log('Tracker finished. Build might still be processing.');
}

start();
