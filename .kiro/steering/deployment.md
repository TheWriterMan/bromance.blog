# Deployment — bromance.blog

## How deploys work

Git integration is **DISCONNECTED** on Vercel (Hobby plan limitation). Deploys are triggered via the **Vercel REST API** from a GitHub Actions workflow on every push to `main`.

Vercel pulls the commit from GitHub and builds on their infrastructure.

## Vercel API details

- **Endpoint:** `POST https://api.vercel.com/v13/deployments?teamId=team_c2vJiNlVfD4IVOQX72gQ6AVt`
- **Project ID:** `prj_p6pJk5NvAlNjPKpe1ELkfOuWHE3j`
- **Body:**
```json
{
  "name": "bromance",
  "project": "prj_p6pJk5NvAlNjPKpe1ELkfOuWHE3j",
  "target": "production",
  "gitSource": {
    "type": "github",
    "repo": "bromance",
    "ref": "main",
    "org": "hobi-design"
  }
}
```

## Critical rules

1. `teamId` is a **query parameter**, never in the body. Body inclusion causes 400.
2. The workflow MUST check the HTTP status code. `curl` exits 0 even on Vercel errors.
3. After pushing, verify deploy via Vercel API: `GET /v6/deployments?projectId=prj_p6pJk5NvAlNjPKpe1ELkfOuWHE3j&teamId=team_c2vJiNlVfD4IVOQX72gQ6AVt&limit=1` — check `readyState` is `READY`, not just that the action passed.
4. If making changes to the deploy workflow, always test by pushing and confirming Vercel shows a new BUILDING/READY deployment.
5. Never put `teamId` in the body. Never use the old repo name `simple-clean-blog`.

## GitHub Actions secrets

- `VERCEL_TOKEN` — Vercel API bearer token
- `VERCEL_PROJECT_ID` — `prj_p6pJk5NvAlNjPKpe1ELkfOuWHE3j`

## Workflow file

See `.github/workflows/deploy.yml` — reference implementation with HTTP status checking.
