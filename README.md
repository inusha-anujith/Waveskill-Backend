# Waveskill HR System — Backend

Express 5 + Mongoose 9 REST API for the Waveskill HR Management System. JWT auth with role-based access for `Admin`, `Manager`, and `Employee`. Pairs with the Next.js frontend in `Waveskill-HR-System`.

## Tech stack

- **Runtime:** Node.js 18.18+ (20 recommended)
- **Framework:** Express 5
- **Database:** MongoDB 7 via Mongoose 9
- **Auth:** JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)
- **Container:** docker-compose for local MongoDB

## Prerequisites

- Node.js 18.18+ and npm 10+
- Docker Desktop (for the bundled MongoDB) — or your own MongoDB instance
- Bash shell on Windows is fine (Git Bash / WSL)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start MongoDB via docker-compose
docker compose up -d

# 3. Seed the database (admin + demo users + leaves + today's attendance)
npm run seed:all

# 4. Start the API on http://localhost:5001
npm start
```

The API logs:

```
Server running on port 5001
MongoDB Connected: localhost
```

## Environment variables (`.env`)

The repo ships an `.env` for local dev. It contains:

```env
PORT=5001
MONGO_URI=mongodb://waveskill:waveskill@localhost:27017/waveskill_hr?authSource=admin
JWT_SECRET=waveskill_super_secret_key_2026
```

Override via your shell or a `.env.local` if you wire anything custom. The seeders also read three optional vars:

| Var | Default | Used by |
|---|---|---|
| `SEED_ADMIN_NAME` | `Waveskill Admin` | `seedAdmin.js` |
| `SEED_ADMIN_EMAIL` | `admin@waveskill.com` | `seedAdmin.js` |
| `SEED_ADMIN_PASSWORD` | `Admin@123` | `seedAdmin.js` |

## Docker compose

`docker-compose.yml` boots a single `mongo:7` container with a named volume so data survives restarts.

```yaml
services:
  mongo:
    image: mongo:7
    container_name: waveskill-mongo
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: waveskill
      MONGO_INITDB_ROOT_PASSWORD: waveskill
      MONGO_INITDB_DATABASE: waveskill_hr
    volumes:
      - mongo_data:/data/db
```

| Command | What it does |
|---|---|
| `docker compose up -d` | Start MongoDB in the background |
| `docker compose ps` | Verify the container is running |
| `docker compose logs -f mongo` | Tail logs |
| `docker compose down` | Stop the container (keeps the volume) |
| `docker compose down -v` | Stop and **delete the volume** (wipes data) |

## Available npm scripts

| Command | What it does |
|---|---|
| `npm start` | Start the API |
| `npm run dev` | Same as `start` (no nodemon yet) |
| `npm run seed` | Create the default Admin only |
| `npm run seed:users` | Create demo Manager + 4 Employees |
| `npm run seed:leaves` | Create 7 sample leaves (Pending / Approved / Rejected) |
| `npm run seed:attendance` | Create today's check-ins for some demo users |
| `npm run seed:all` | Run all seeders sequentially (admin → users → leaves → attendance) |

All seeders are **idempotent** — running them twice is safe and won't create duplicates.

## Seeded credentials

After `npm run seed:all`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@waveskill.com` | `Admin@123` |
| Manager | `manager@waveskill.com` | `Manager@123` |
| Employee | `john@waveskill.com` | `Demo@1234` |
| Employee | `jane@waveskill.com` | `Demo@1234` |
| Employee | `mike@waveskill.com` | `Demo@1234` |
| Employee | `lisa@waveskill.com` | `Demo@1234` |

> Change the Admin password after first login in production. The seeders skip users that already exist, so resetting passwords requires manual deletion or a `PATCH /api/admin/users/:id` from an Admin token.

## Project structure

```
src/
├── app.js                              Express app + route mounts + CORS
├── config/db.js                        MongoDB connection helper
├── middleware/auth.js                  protect (verify JWT) + restrictTo(...roles)
├── models/
│   ├── userModel.js                    User w/ bcrypt hooks + role enum
│   ├── attendanceModel.js              Daily attendance per user
│   ├── leaveModel.js                   Leave requests
│   ├── employeeModel.js                Legacy HR profile
│   ├── projectModel.js, announcementModel.js   (other teammates' scope)
├── controllers/
│   ├── userController.js               Public register (forced role=Employee) + login + /me
│   ├── attendanceController.js         Employee check-in/out, my history
│   ├── leaveController.js              Employee apply, my leaves
│   └── admin/
│       ├── adminAnalyticsController.js   Dashboard summary
│       ├── adminLeaveController.js       List + approve + reject
│       ├── adminAttendanceController.js  Filterable attendance reports
│       └── adminUserController.js        User CRUD (Admin only on writes)
├── routes/
│   ├── userRoutes.js, attendanceRoutes.js, leaveRoutes.js, ...
│   └── admin/
│       ├── index.js                      Mounts admin sub-routers w/ role guards
│       ├── adminAnalyticsRoutes.js
│       ├── adminLeaveRoutes.js
│       ├── adminAttendanceRoutes.js
│       └── adminUserRoutes.js
scripts/
├── seedAdmin.js
├── seedUsers.js
├── seedLeaves.js
├── seedAttendance.js
└── seedDemo.js                         Master seeder (used by npm run seed:all)
docker-compose.yml
.env
server.js                               Boots app + mongo connection
```

## Implemented features (per Dasuni.pdf scope)

### 1. Admin/Manager Dashboard — `GET /api/admin/analytics/summary`

Returns:

```jsonc
{
  "success": true,
  "data": {
    "activeEmployees": 8,
    "todayAttendance": { "present": 2, "late": 2, "absent": 4, "checkedIn": 4, "rate": 50 },
    "pendingLeaves": 4
  }
}
```

Open to **Admin** and **Manager**.

### 2. Leave Management (Admin + Manager)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/leaves?status=Pending` | List leaves with the user populated |
| `PATCH` | `/api/admin/leaves/:id/approve` | Mark Pending → Approved |
| `PATCH` | `/api/admin/leaves/:id/reject` | Mark Pending → Rejected |

Approving/rejecting a non-Pending leave is rejected with `400`.

### 3. Attendance Reports (Admin only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/attendance` | Paginated, filterable by `date`, `from`, `to`, `userId`, `status` |

Open to **Admin** and **Manager** for read access (so Manager dashboards can populate).

### 4. User Management (Admin only on writes)

| Method | Path | Allowed roles |
|---|---|---|
| `GET` | `/api/admin/users` | Admin, Manager (read) |
| `GET` | `/api/admin/users/:id` | Admin, Manager (read) |
| `POST` | `/api/admin/users` | Admin only |
| `PATCH` | `/api/admin/users/:id` | Admin only |
| `DELETE` | `/api/admin/users/:id` | Admin only |

Guard rails:

- `POST` only accepts `role: Employee` or `Manager` (Admin can't be created via API)
- Cannot demote or delete the **last Admin**
- Cannot delete your own account

### Cross-cutting

- `protect` middleware verifies JWT and attaches `req.user`
- `restrictTo('Admin', 'Manager', ...)` gates per-route
- Public `POST /api/users/register` is locked to `role: Employee` regardless of payload
- All admin endpoints sit under `/api/admin/*` and require `protect` first

## Smoke test

```bash
# 1. Login as Admin
TOKEN=$(curl -s -X POST http://localhost:5001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@waveskill.com","password":"Admin@123"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).token))")

# 2. Pull the analytics summary
curl -s http://localhost:5001/api/admin/analytics/summary \
  -H "Authorization: Bearer $TOKEN"

# 3. List pending leaves
curl -s "http://localhost:5001/api/admin/leaves?status=Pending" \
  -H "Authorization: Bearer $TOKEN"

# 4. List today's attendance
curl -s "http://localhost:5001/api/admin/attendance?date=$(date -u +%F)" \
  -H "Authorization: Bearer $TOKEN"
```

Manager-only check (read OK, write 403):

```bash
MTOK=$(curl -s -X POST http://localhost:5001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@waveskill.com","password":"Manager@123"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).token))")

curl -s -w "\n%{http_code}\n" http://localhost:5001/api/admin/users \
  -H "Authorization: Bearer $MTOK" | tail -2

curl -s -w "\n%{http_code}\n" -X DELETE \
  http://localhost:5001/api/admin/users/000000000000000000000000 \
  -H "Authorization: Bearer $MTOK"
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `querySrv ECONNREFUSED ...mongodb.net` | The old Atlas URI was still in `.env`. Use the local `mongodb://waveskill:waveskill@localhost:27017/...` URI. |
| `Error connecting to MongoDB: ... ECONNREFUSED 127.0.0.1:27017` | The Mongo container isn't running — `docker compose up -d`. |
| `EADDRINUSE :::5001` | Old node process still bound — `netstat -ano | grep :5001` then `taskkill /F /PID <pid>` (Windows) or `lsof -ti:5001 | xargs kill` (Unix). |
| `User with this email already exists` while seeding | Already there. Seeders are idempotent so it's safe to ignore. |
| `Cannot demote the last Admin` | Create a second Admin first (e.g. via `POST /api/admin/users` with role override in DB), or skip the demotion. |

## Reset everything

```bash
# Stop the API (Ctrl+C in its terminal), then:
docker compose down -v        # wipes the Mongo volume
docker compose up -d
npm run seed:all
npm start
```
