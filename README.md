# palestine_schools

Seeds Palestine Schools — Multi-Branch Management System

Production-ready deployment on Render / Vercel with MongoDB Atlas persistence.

## Features
- 🌐 **Hybrid storage**: Auto-switches between MongoDB Atlas (cloud) and local JSON files
- 🏫 **Multi-branch**: Branch-level data scoping + Super Admin / Branch Admin / Teacher roles
- 👥 **253 students** seeded with branchId, classes KG1–11
- 🚍 **Bus subscriptions**, 💰 **fees tracking**, ✅ **attendance**
- 🛡️ Security: Helmet CSP, bcrypt password hashing, rate limiting, httpOnly sessions, RBAC, input sanitization
- ☁️ One-click deploy to **Render** (via `render.yaml` Blueprint) or **Vercel** (via `vercel.json` + `api/index.js`)

## Quick Start (local)
```bash
npm install
npm start
# http://localhost:8000
```

Default accounts:
| Role | Username | Password |
|---|---|---|
| Super Admin | `superadmin` | `SuperAdmin@2026` |
| Branch Admin (branchId=1) | `branchadmin` | `BranchAdmin@2026` |
| Teachers | `teacher1` / `teacher2` / `teacher3` | `teach123` |

## Deploy to Render
1. Create a **MongoDB Atlas** cluster → copy `MONGODB_URI`
2. Go to https://dashboard.render.com/blueprints → **New from YAML** → pick this repo → Apply
3. Fill `MONGODB_URI` → deploy
4. Import seed data once:
   ```bash
   MONGODB_URI=mongodb+srv://... node migrate-files-to-mongodb.js
   ```

## Deploy to Vercel
```bash
npm i -g vercel
vercel login
vercel --prod
# Add env vars in Vercel dashboard: MONGODB_URI, SESSION_SECRET, SUPER_ADMIN_PASSWORD, ...
# Redeploy
```

## Local MongoDB (Docker)
```bash
docker compose up -d
# .env: MONGODB_URI=mongodb://seeds:seeds_palestine_db_password@localhost:27017/school-management?authSource=admin&directConnection=true
node migrate-files-to-mongodb.js
npm start
```


# palestine_schools1
