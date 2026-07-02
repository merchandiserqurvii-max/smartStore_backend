# SmartStore — Backend

Node.js + Express REST API for the SmartStore internal material ordering system. Handles authentication, material requests, inventory management, real-time notifications via Socket.io, and PostgreSQL persistence.

---

## Who Uses This

| Role | Access |
|---|---|
| **Employee** | Submit material requests, view own request history |
| **Store Helper** | Manage requests (accept / assign / issue), manage inventory |
| **Admin** | Full access — all pages, delete operations, material access control |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4 |
| Database | PostgreSQL 16 (via `pg` driver) |
| Auth | JWT (jsonwebtoken) |
| Real-time | Socket.io 4 |
| HTTP client | Axios (external user API) |
| Containerisation | Docker |

---

## Project Structure

```
backend/
├── app.js                          # Express app + Socket.io setup
├── Dockerfile
├── package.json
├── .env                            # Environment variables (not committed)
├── config/
│   └── db.js                       # PostgreSQL pool (getPool)
├── controllers/
│   ├── auth.controller.js
│   ├── inventory.controller.js
│   ├── items.controller.js
│   ├── materialRequest.controller.js
│   ├── notification.controller.js
│   ├── scan.controller.js
│   └── style.controller.js
├── database/
│   ├── migrate.js                  # Migration runner (tracks applied migrations)
│   └── migrations/
│       ├── 000_create_employees.sql
│       ├── 001_create_inventory_items.sql
│       ├── 002_create_material_requests.sql
│       ├── 003_create_notifications.sql
│       ├── 004_material_code_to_integer.sql
│       ├── 005_add_completed_status.sql
│       ├── 006_external_auth_and_items.sql
│       ├── 007_item_location_name_based.sql
│       ├── 008_update_location_access.sql
│       ├── 009_create_scan_records.sql
│       ├── 010_feature_upgrades.sql
│       └── 011_store_workers.sql
├── middleware/
│   ├── auth.middleware.js           # verifyToken, isStore, isAdmin
│   └── errorHandler.js             # Global error handler
├── routes/
│   ├── auth.routes.js
│   ├── inventory.routes.js
│   ├── items.routes.js
│   ├── materialRequest.routes.js
│   ├── notification.routes.js
│   ├── scan.routes.js
│   ├── storeWorkers.routes.js
│   ├── style.routes.js
│   └── units.routes.js
├── services/
│   ├── auth.service.js
│   ├── inventory.service.js
│   ├── items.service.js
│   ├── materialRequest.service.js
│   └── notification.service.js
└── utils/
    ├── ApiError.js
    ├── ApiResponse.js
    └── asyncHandler.js
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartstore
DB_USER=postgres
DB_PASSWORD=yourpassword

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=8h

# CORS — frontend origin
CLIENT_URL=http://localhost:5173
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `inventory_items` | Stock catalog — material name, quantity, unit, min_quantity |
| `material_requests` | All employee requests (store + admin items) |
| `notifications` | Store helper bell notifications for new requests |
| `items` | Requestable item catalog with image, unit, destination |
| `item_location_access` | Which locations can request which items |
| `units` | Custom units created by store helper |
| `store_workers` | Workers admin-enabled for task assignment |
| `scan_records` | QR scan history |
| `schema_migrations` | Tracks applied migration files |

---

## API Routes

### Auth — `/api/auth`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/login` | Public | Login with user_id + location_id, returns JWT |
| GET | `/me` | Any auth | Get current user info |
| GET | `/users` | Any auth | Proxy to external user system |

### Inventory — `/api/inventory`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Any auth | List all inventory items (search, status, low_stock filters) |
| POST | `/` | Store | Create single item |
| POST | `/bulk` | Store | CSV bulk upsert |
| PUT | `/:id` | Store | Update item fields |
| PUT | `/:id/stock` | Store | Reset available quantity |
| DELETE | `/all` | **Admin** | Delete all inventory records |
| DELETE | `/:id` | **Admin** | Delete single inventory item |

### Material Requests — `/api/material-request`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/` | Any auth | Create single request |
| POST | `/bulk` | Any auth | Cart checkout (multiple items) — validates stock |
| GET | `/my-requests` | Any auth | Employee's own requests |
| GET | `/store/requests` | Store | All store-destination requests |
| GET | `/store/summary` | Store | Today's counts by status |
| GET | `/admin/requests` | Admin | Admin-destination requests |
| PUT | `/:id/accept` | Any auth | Accept a pending request |
| PUT | `/:id/issue` | Any auth | Issue material (deducts inventory) |
| PUT | `/:id/received` | Any auth | Mark as received by employee |
| PUT | `/:id/assign` | Store | Assign task to a store worker |
| GET | `/report` | Admin | Analytics report with date/location filters |
| DELETE | `/all` | **Admin** | Wipe all requests + notifications (Danger Zone) |

### Items Catalog — `/api/items`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Any auth | Items filtered by `?location_name=` |
| GET | `/access-list` | Admin | Inventory items with their catalog entry + location access |
| GET | `/all-locations` | Admin | All distinct location names in system |
| PUT | `/access-list/:inv_id/name` | Admin | Rename item in both inventory + catalog |
| PUT | `/access-list/:inv_id/locations` | Admin | Update which locations can request an item |
| POST | `/` | Admin | Create catalog item |
| PUT | `/:id` | Admin | Update catalog item |
| GET | `/:id/locations` | Admin | Get location access list for item |
| PUT | `/:id/locations` | Admin | Replace location access list |

### Store Workers — `/api/store-workers`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Any auth | List enabled workers (used by AssignModal) |
| POST | `/` | **Admin** | Enable a worker for task assignment |
| DELETE | `/:id` | **Admin** | Remove worker from assignment list |

### Units — `/api/units`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Any auth | List all custom units |
| POST | `/` | Store | Create new unit |

---

## Real-time Events (Socket.io)

| Event | Room | Payload | Trigger |
|---|---|---|---|
| `new-request` | `store-room` / `admin-room` | `{ request, notification?, autoAccepted }` | New request created |
| `request-updated` | All / `user-{id}` | Updated request object | Accept / Issue / Assign / Received |

Clients join rooms by calling `socket.emit('join-store')` or `socket.emit('join-admin')`.

---

## Running Locally

```bash
# Install dependencies
npm install

# Run migrations
npm run migrate

# Start dev server (nodemon)
npm run dev

# Start production
npm start
```

---

## Running with Docker

```bash
# From project root
docker compose up -d

# Rebuild after code changes
docker compose build backend
docker compose up -d backend

# View logs
docker compose logs -f backend
```

The Docker `CMD` runs migrations then starts the server:
```
sh -c "node database/migrate.js && node app.js"
```

---

## Authentication Flow

1. Frontend calls `POST /api/auth/login` with `{ user_id, location_id }`
2. Backend fetches user list from external API (`https://fastapi.qurvii.com/getUsers`)
3. Validates user + location combination
4. Determines role: `'store'` if location normalizes to `"store helper"`, `'employee'` otherwise
5. Sets `is_admin: true` if location is `"admin"`
6. Returns signed JWT (8h expiry)
7. Client includes `Authorization: Bearer <token>` on all subsequent requests

---

## Stock Validation

When an employee submits a bulk request, the backend:
1. Pre-validates each item against `inventory_items` (by name, case-insensitive)
2. Throws `400` if requested quantity exceeds available stock
3. Only proceeds to create requests if all items pass validation

---

## Deployment (Render)

- **Service type:** Web Service (Docker)
- **Start command:** *(set in Dockerfile CMD)*
- **Environment variables:** Set in Render dashboard under Environment tab
- **Database:** Render PostgreSQL — copy the internal connection string to `DB_*` vars
