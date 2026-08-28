# Migration Plan: Replace Jenkins + GoDaddy with SSH + ngrok

---

## What we're replacing

| Current | Replaced with |
|---|---|
| Jenkins server (trigger, poll, artifact) | Direct SSH from Node.js into remote server |
| GoDaddy DNS API (create/delete A records) | ngrok tunnel (create/delete via ngrok API) |
| Jenkins CSRF crumb dance | Gone |
| Jenkins credential IDs | SSH password/key stored in app DB |
| Pipeline files at workspace root | Node.js service code |

---

## How ngrok changes the architecture

With GoDaddy + Certbot, a deploy creates a real subdomain with SSL. That process takes ~90 seconds (DNS propagation + Certbot).

With ngrok, the flow is different:
- Each preview node gets an ngrok tunnel pointed at its local port on the remote server
- ngrok gives you an `https://*.ngrok-free.app` (or custom domain on paid plans) URL instantly — no DNS wait, no Certbot
- Tunnels are managed via the ngrok API (create tunnel → get URL → store in DB)
- On delete, the tunnel is killed via the API

This makes deploys significantly faster and simpler. The tradeoff is the preview URL is an ngrok URL instead of your own domain — acceptable for previews.

---

## New settings needed (replacing all Jenkins fields)

**Deployment Server tab** (replaces Jenkins tab):
- `deploy_remote_host` — IP or hostname of the target server
- `deploy_remote_user` — SSH user (e.g. `ubuntu`)
- `deploy_ssh_password` — SSH password *(secret)*
- `deploy_github_token` — GitHub PAT for git clone (moves here from GitHub tab, or keep both)

**Ngrok tab** (new):
- `ngrok_auth_token` — ngrok auth token from your ngrok dashboard *(secret)*

**GitHub tab** — stays as-is (org + token for branch listing)

**System tab** — stays as-is

---

## New server-side files

### `server/services/sshDeployService.js`
The core service. Uses the `ssh2` npm package to SSH into the remote server and run commands. Mirrors the pipeline stages exactly:

```
deployPreviewNode(params, logCallback)
  ├── connect SSH
  ├── check if folder exists
  ├── check port availability (new deploys only)
  ├── git clone OR git pull (using GitHub token inline in URL)
  ├── write .env (port key + ENV_JSON vars)
  ├── npm install
  ├── (backend) run migrations → npm run build → pm2 start
  ├── (frontend) write ecosystem.config.cjs → npm run build → pm2 start
  └── return { success, port }

deletePreviewNode(domainName, logCallback)
  ├── connect SSH
  ├── pm2 delete {domainName}
  ├── rm -rf ~/{domainName}
  └── return { success }
```

The `logCallback` is called with each line of output — this is how we stream logs to the frontend.

### `server/services/ngrokService.js`
Manages ngrok tunnels on the remote server via SSH commands:

```
startTunnel(sshConn, port, authToken)   → { url }
  → runs: ngrok authtoken <token> && ngrok http <port> --log stdout --response-header-add "ngrok-skip-browser-warning:true" &
  → parses the tunnel URL from ngrok's JSON log output
  → the --response-header-add flag bypasses the ngrok interstitial warning page (free plan supported)

stopTunnel(sshConn, port)               → void
  → runs: pkill -f "ngrok http <port>"
```

No ngrok API key needed. The auth token is passed once to authenticate the agent on the
remote server, then ngrok runs as a background process alongside the app.

### `server/routes/deploy.js`
New routes replacing `jenkins.js`:

```
POST /api/deploy/trigger
  → runs SSH deploy + creates ngrok tunnel
  → streams logs via SSE (text/event-stream)
  → on complete: updates node in DB (preview_link, build_status, etc.)
  → records NodeBuild entry

POST /api/deploy/delete
  → runs SSH delete + kills ngrok tunnel
  → streams logs via SSE

GET  /api/deploy/test-connection
  → tests SSH connectivity (quick connection + exit)

GET  /api/deploy/public-config
  → returns non-secret deploy info for UI (replaces /jenkins/public-config)
```

SSE means the frontend gets a real-time log stream instead of the current "fire and wait 2 minutes" pattern. Each event is either a `log` line or a final `result` event.

---

## New/changed frontend files

### `src/services/configurationService.js`
- Add `getDeploymentSettings` / `saveDeploymentSettings`
- Add `getNgrokSettings` / `saveNgrokSettings`
- Keep `getGithubSettings`, `getSystemSettings`
- Remove `getJenkinsSettings` / `saveJenkinsSettings`

### `src/pages/SystemSettings.jsx`
- Replace Jenkins tab → **Deployment Server** tab (host, user, SSH password)
- Add **Ngrok** tab (auth token)
- Keep GitHub and System tabs unchanged

### `src/hooks/useDeploy.js` (replaces `useJenkins.jsx`)
- Opens an `EventSource` to `/api/deploy/trigger` (SSE)
- Pipes log events into a scrollable log panel in the modal
- Final `result` event resolves the build (success/fail)
- Exposes `triggerDeploy(params)`, `deleteDeploy(domainName)`, `testConnection()`

### `src/config/deploy.js` (replaces `src/config/jenkins.js`)
- Removes all Jenkins constants
- Keeps `appApiBase()` utility

---

## Migration / compatibility notes

- The existing `NodeBuild` table and `node_builds` build history work unchanged — same recording logic
- `node.preview_link` will now store the ngrok URL instead of `*-preview.yourdomain.co`
- `node.jenkins_job_url` column can be repurposed to store the ngrok tunnel ID (or left null — it's just metadata)
- The existing `jenkins.js` route stays in place as dead code until explicitly removed
- Existing nodes in DB are unaffected; their `preview_link` just won't have a live tunnel until redeployed

---

## File change summary

| File | Action |
|---|---|
| `server/package.json` | Add `ssh2`, `@ngrok/ngrok` |
| `server/services/configurationService.js` | Replace `jenkins_*` keys → `deploy_*` + `ngrok_auth_token` key |
| `server/services/sshDeployService.js` | **New** |
| `server/services/ngrokService.js` | **New** |
| `server/routes/deploy.js` | **New** |
| `server/routes/configuration.js` | Add `/deployment` and `/ngrok` endpoints |
| `server/index.js` | Mount `deployRoutes`, remove `jenkinsRoutes` |
| `src/services/configurationService.js` | Add deploy/ngrok methods, remove jenkins |
| `src/pages/SystemSettings.jsx` | Replace Jenkins tab, add Ngrok tab |
| `src/hooks/useDeploy.js` | **New** (replaces `useJenkins.jsx`) |
| `src/config/deploy.js` | **New** (replaces `src/config/jenkins.js`) |

Files to delete when ready:
- `server/routes/jenkins.js`
- `server/services/jenkinsClient.js`
- `server/services/jenkinsDeletePreviewDomain.js`
- `server/config/jenkinsServer.js`
- `src/hooks/useJenkins.jsx`
- `src/config/jenkins.js`
- `Preview Build Pipeline` (workspace root)
- `Preview Delete Pipeline` (workspace root)

---

## Open questions / things to decide before implementing

- [ ] SSH auth method: **password** (simpler, matches current setup) or **SSH key** (more secure)?
- [ ] Should the ngrok tunnel be created on the remote server (ngrok agent running there) or called from the Node.js server via API? — API approach is cleaner and doesn't require ngrok installed on the remote
- [ ] Free ngrok URLs change on every tunnel restart — is that acceptable, or do you need stable URLs (paid ngrok plan with reserved domains)?
- [ ] Should the `deploy_github_token` be a separate field from the existing `github_token`, or reuse the same value?
- [ ] Should the ngrok tunnel be created on the remote server via SSH (`ngrok http <port>` as a background process) — confirmed approach for free plan
- [ ] Free ngrok URLs change on every tunnel restart — is that acceptable for stored preview links?
