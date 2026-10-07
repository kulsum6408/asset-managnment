# Asset Management System — Backend API

## Project Structure

```
backend/
├── config/
│   └── db.js                   # MySQL connection
├── controllers/
│   ├── authController.js       # Login, register, profile
│   ├── assetController.js      # Asset CRUD
│   ├── userController.js       # User CRUD
│   ├── assignmentController.js # Asset assignments
│   ├── returnController.js     # Asset returns
│   └── reportController.js     # Dashboard reports
├── middleware/
│   ├── authMiddleware.js       # JWT verification
│   ├── roleMiddleware.js       # Role-based access control
│   └── errorMiddleware.js      # 404 + global error handler
├── models/
│   ├── assetModel.js
│   ├── userModel.js
│   ├── assignmentModel.js
│   ├── returnModel.js
│   └── reportModel.js
├── routes/
│   ├── authRoutes.js
│   ├── assetRoutes.js
│   ├── userRoutes.js
│   ├── assignmentRoutes.js
│   ├── returnRoutes.js
│   ├── requestRoutes.js
│   ├── maintenanceRoutes.js
│   └── reportRoutes.js
├── utils/
│   ├── generateToken.js        # JWT generator
│   └── validator.js            # Input validation helpers
├── uploads/                    # File uploads
├── .env
├── server.js                   # Entry point
└── package.json
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure `.env`:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=asset_management
JWT_SECRET=your_secret_key
```

3. Run database schema:
```bash
# Import database_schema.sql into MySQL
```

4. Seed the database:
```bash
node seed.js
```

5. Start the server:
```bash
npm run dev      # development (nodemon)
npm start        # production
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET  | /api/auth/me | Get profile |
| GET  | /api/assets | Get all assets |
| POST | /api/assets | Create asset |
| PUT  | /api/assets/:id | Update asset |
| DELETE | /api/assets/:id | Delete asset |
| GET  | /api/users | Get all users (admin) |
| POST | /api/users | Create user (admin) |
| GET  | /api/requests | Get requests |
| POST | /api/requests | Submit request |
| GET  | /api/assignments | Get assignments |
| POST | /api/assignments | Create assignment |
| GET  | /api/returns | Get returns |
| POST | /api/returns | Process return |
| GET  | /api/maintenance | Get maintenance |
| POST | /api/maintenance | Create maintenance |
| GET  | /api/reports/dashboard | Dashboard stats |

## Roles

| Role | Access |
|------|--------|
| admin | Full access |
| manager | Read-only reports and all data |
| asset_officer | Manage assets, assignments, returns, requests |
| finance_officer | Asset values and financial reports |
| maintenance_officer | Maintenance records |
| employee | View available assets, submit requests |
