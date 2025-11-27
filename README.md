# Trading Tracker

A simple web-based trading journal application to track daily profit/loss (P/L) and trading notes.

## Features

- Calendar view for tracking trading days
- Record daily P/L for each trading session
- Add notes and observations for each trading day
- Navigate between months to review historical data
- User authentication (email/password + Google OAuth)
- Profile management with image uploads
- Data persistence via MySQL database

## Tech Stack

**Frontend:**
- HTML5
- CSS3
- Vanilla JavaScript

**Backend:**
- Node.js
- Express.js
- MySQL
- JWT authentication
- Passport.js (Google OAuth)
- Bcrypt for password hashing

## Project Structure

```
TradingTracker/
├── frontend/
│   ├── index.html          # Main HTML page
│   ├── css/
│   │   └── styles.css      # Styling
│   └── js/
│       └── app.js          # Frontend JavaScript logic
├── backend/
│   ├── server.js           # Express server
│   ├── config.js           # Environment config helper
│   ├── db.js               # Database initialization (single source of truth)
│   ├── auth.js             # Email/password auth
│   ├── authMiddleware.js   # JWT verification
│   ├── oauth.js            # Google OAuth setup
│   └── routes/
│       ├── authRoutes.js   # Auth endpoints
│       ├── userRoutes.js   # User profile endpoints
│       └── tradeRoutes.js  # Trade data endpoints
├── data/                   # SQLite database (gitignored)
├── uploads/                # User uploads (gitignored)
├── package.json            # Dependencies
├── .env.example            # Environment template
└── DEPLOYMENT.md           # Production deployment guide
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd TradingTracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Running the Application

**Development:**
```bash
npm run dev
```

**Production:**
```bash
./start-production.sh
# or
npm start
```

The server will run on `http://localhost:4000`

## Environment Variables

See `.env.example` for all available options. Required in production:

- `NODE_ENV=production`
- `JWT_SECRET` - Random string for JWT signing
- `SESSION_SECRET` - Random string for sessions
- `CLIENT_ORIGIN` - Your frontend URL

Optional (for Google OAuth):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CALLBACK_URL`

MySQL configuration:
- `MYSQL_HOST` - MySQL server host
- `MYSQL_PORT` - MySQL server port (default: 3306)
- `MYSQL_USER` - MySQL username
- `MYSQL_PASSWORD` - MySQL password
- `MYSQL_DATABASE` - MySQL database name

## Deployment

**See [DEPLOYMENT.md](DEPLOYMENT.md) for complete production deployment guide.**

Key points:
- Set all environment variables (app will crash if missing in production)
- Mount `uploads/` to persistent storage
- Configure MySQL database connection
- Configure Google OAuth redirect URIs to match your domain

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback

### User
- `GET /api/user/me` - Get current user profile
- `POST /api/user/profile-image` - Upload profile image

### Trades
- `GET /api/trades?year=YYYY&month=MM` - Get trades for month
- `GET /api/trades/:date` - Get trade for specific date
- `POST /api/trades/:date` - Save/update trade notes

### Trade Entries
- `GET /api/entries/month?year=YYYY&month=MM` - Get all entries for month
- `GET /api/entries/:date` - Get entries for specific date
- `POST /api/entries` - Create new trade entry
- `PUT /api/entries/:id` - Update trade entry
- `DELETE /api/entries/:id` - Delete trade entry

### Health
- `GET /health` - Health check endpoint

## Security Features

- JWT-based authentication with 7-day expiry
- Bcrypt password hashing (10 rounds)
- HTTP-only, secure cookies in production
- CORS configured for specific origin
- Input validation and sanitization
- SQL injection protection via parameterized queries
- Environment-based secret management

## Development

The app uses nodemon for hot-reloading in development:
```bash
npm run dev
```

Database schema is automatically created on startup via `backend/db.js`.

## License

MIT License
