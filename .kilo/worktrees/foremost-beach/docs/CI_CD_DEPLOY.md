# CI/CD Setup — GitHub Actions → cPanel shared hosting

This repo ships with two GitHub Actions workflows:

| Workflow | File | When | What it does |
|---|---|---|---|
| **CI** | `.github/workflows/ci.yml` | every push / PR | builds the Next.js frontend, syntax-checks + boot-smokes the Express backend against a throwaway MongoDB |
| **CD** | `.github/workflows/deploy.yml` | push to `main` or `master` | runs the same checks, builds release bundles, uploads them to a GitHub Release, and (optionally) auto-deploys over SSH |

The frontend is built with `output: "standalone"` (`next.config.mjs`), which produces a tiny self-contained server folder — ideal for cPanel's Node.js app (Passenger) hosting.

---

## 1. Push the repo to GitHub

```bash
cd "E:\ecommerce template (NEXT)"
git init -b main
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<your-org>/<your-repo>.git
git push -u origin main
```

> `.gitignore` has been fixed so `.env` / secrets are **never** committed
> (`.env`, `.env.*` are ignored; `.env.example` is kept as a template).

## 2. Add repository secrets

In GitHub → **Settings → Secrets and variables → Actions**, add:

**Frontend (build-time, required):**

| Secret | Example |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api` (your live backend URL) |
| `NEXT_PUBLIC_FRONTEND_URL` | `https://yourdomain.com` |

**Backend (written into the bundle's `.env`):**

| Secret | Notes |
|---|---|
| `MONGODB_URI` | **required** (Atlas or your live DB) |
| `JWT_SECRET` | **required**, use the same one as your current backend `.env` |
| `FRONTEND_URL` | e.g. `https://yourdomain.com` |
| `API_PUBLIC_URL` | public backend root for the API |
| `STORE_NAME`, `SUPPORT_EMAIL`, `SUPPORT_PHONE` | store info |
| `EMAIL_*` (`EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, …) | SMTP |
| `GOOGLE_*`, `FACEBOOK_*` | OAuth only if used |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | image uploads |

**Optional — automatic SSH deploy.** Only fill these if your cPanel has SSH enabled. Otherwise use the GitHub Release downloads + cPanel File Manager.

| Secret | Example |
|---|---|
| `CPANEL_SSH_HOST` | `123.123.123.123` |
| `CPANEL_SSH_USER` | `ecomuser` |
| `CPANEL_SSH_PASSWORD` | your SSH password |
| `CPANEL_SSH_PORT` | `22` |
| `CPANEL_FRONTEND_PATH` | `~/app_frontend` |
| `CPANEL_BACKEND_PATH` | `~/app_backend` |

## 3. cPanel — create two Node.js apps

In cPanel → **Setup Node.js App** (each shared-hosting plan allows one or more apps;
if your plan allows only one, add the second as a **subdomain**, e.g. `api.yourdomain.com`).

### App A — Frontend (Next.js)

| Field | Value |
|---|---|
| Node.js version | **20** (LTS) |
| Application root | `app_frontend` (or wherever you upload the bundle) |
| Application URL | `yourdomain.com` |
| Application startup file | `server.js` |

Upload the contents of `frontend-release.zip` into that root. The bundle already
contains `.next`, `public`, `.env` and a minimal `node_modules`.

### App B — Backend (Express API)

| Field | Value |
|---|---|
| Node.js version | **20** (LTS) |
| Application root | `app_backend` |
| Application URL | `api.yourdomain.com` |
| Application startup file | `src/server.js` |

Upload the contents of `backend-release.zip` into that root (it contains `src/`,
`scripts/`, `node_modules` and `.env`).

Passenger on cPanel sets the `PORT` automatically; the code reads
`process.env.PORT` and never hard-codes it.

### First-time upload (no SSH)

1. Open **GitHub → Releases** on your repo → latest **Deploy build #N**.
2. Download `frontend-release.zip` and `backend-release.zip`.
3. In cPanel **File Manager**, upload + extract into the two app roots above.
4. **Restart** both Node.js apps from **Setup Node.js App**.

After that, every push to `main` runs CI + CD and publishes fresh bundles.

## 4. Verify

- `https://yourdomain.com/dashboard` → admin login page (frontend up).
- `https://api.yourdomain.com/api/categories/public` → JSON (backend up).
- If the frontend can't reach the API, check `NEXT_PUBLIC_API_URL` in the
  frontend `.env` and CORS on the backend.

## Troubleshooting

- **`next start` fails to bind** → cPanel/Passenger sets `PORT`; do not put a fixed
  `PORT=3000` that overrides passenger. In the backend `.env` a `PORT=4000` is fine
  because `dotenv` never overrides an already-set `PORT` env from Passenger.
- **502 Bad Gateway right after deploy** → Passenger app crashed on boot; check
  **Metrics → Errors** in cPanel, and confirm `MONGODB_URI` / `JWT_SECRET` were
  written into the deployed `.env`.
- **Memory limits** → shared plans can be tight; standalone Next uses ~60–100 MB,
  Express ~80–120 MB. If you hit limits, move the backend to a dedicated Node app
  slot or upgrade the plan.
- **Changing env after deploy** → edit the `.env` inside the app root on cPanel,
  then restart the app (or edit via the Setup Node.js App UI if you prefer).
- **Rollback** → re-download a previous release's zip and re-upload it.

## Local equivalents

```bash
cd backend && npm run test               # boots the server + smoke-checks the API
cd frontend && npm run build             # must produce .next/standalone
```