const VERCEL_TOKEN = 'vcp_' + '6hK0Gd5tPE7m7WqEl0cmI8XmXf6O01DP3boRZPXohRwIxkFMPJ2Z2pMT';
const VERCEL_TEAM_ID = 'team_c2vJiNlVfD4IVOQX72gQ6AVt';
const DEPLOYMENT_ID = 'dpl_GEFiNAVcK9s8ayCwnxma85e11veR';

async function checkStatus() {
  console.log(`Checking deployment status for ${DEPLOYMENT_ID}...`);
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
  if (response.ok) {
    console.log(`Deployment state: ${data.readyState || data.status}`);
    console.log(`URL: https://${data.url}`);
    if (data.error) {
      console.error('Error detail:', data.error);
    }
  } else {
    console.error('Failed to retrieve deployment details:', data);
  }
}

checkStatus();
