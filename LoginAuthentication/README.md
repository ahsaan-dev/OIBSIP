# LoginAuthentication

A production-quality, full-stack authentication system built with **Node.js, Express, MongoDB, and JWT** — with a vanilla HTML/CSS/JavaScript frontend styled as a real SaaS product rather than a bare login form.

Originally scoped against the **Oasis Infobyte Level 2 internship** brief, this build goes beyond the base requirements to demonstrate production-grade authentication patterns: password hashing, short-lived access tokens with silent refresh, rate limiting, centralized error handling, and a full profile/password-management flow.

> **Live demo:** run it locally — see [Installation Guide](#installation-guide) below.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Folder Structure](#folder-structure)
- [Installation Guide](#installation-guide)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Authentication Architecture](#authentication-architecture)
- [Screenshots](#screenshots)
- [Future Improvements](#future-improvements)
- [License](#license)
- [Author](#author)

---

## Project Overview

LoginAuthentication is a complete registration → login → protected dashboard flow. A user can create an account, log in, land on a protected dashboard, view and edit their profile, change their password, and recover access via a "forgot password" flow — all backed by a REST API with hashed passwords and JWT-based sessions.

The frontend is intentionally framework-free (no React/Vue/Angular/Bootstrap/Tailwind) to demonstrate strong fundamentals: semantic HTML, hand-written CSS with a real design system, and modular vanilla JavaScript (ES6+).

---

## Features

### Core (internship requirements)

- ✅ User registration with full name, email, and password
- ✅ Duplicate email check (unique index + friendly API error)
- ✅ Password hashing with bcrypt (12 salt rounds, never stored or returned in plain text)
- ✅ User login with credential validation
- ✅ JWT-based authentication
- ✅ Protected dashboard (inaccessible without a valid session)
- ✅ Logout functionality
- ✅ Client- and server-side form validation
- ✅ Fully responsive design (desktop / tablet / mobile)

### Advanced / portfolio features

- ✅ Email format validation (client + server)
- ✅ Live password strength meter with a 4-segment visual indicator
- ✅ Show / hide password toggle on every password field
- ✅ "Remember me" (extends session length via the refresh-token cookie)
- ✅ Forgot password UI + full password-reset token flow (server-generated, hashed, time-limited token)
- ✅ Profile page: view and edit full name, change password
- ✅ JWT expiration with a **refresh-token rotation** architecture (silent, automatic re-auth)
- ✅ Account status field (`active` / `suspended`)
- ✅ Login history (last 5 attempts, success/failure, timestamp)
- ✅ Toast notification system (success / error / warning / info)
- ✅ Button loading states + full-page-safe async handling
- ✅ Centralized API error handling on both client and server
- ✅ Global Express error-handling middleware
- ✅ Rate limiting on login and password-reset requests

---

## Technologies Used

**Frontend**
- HTML5 (semantic markup, accessible forms)
- CSS3 (custom design system — no framework)
- Vanilla JavaScript (ES6+, modular, no bundler)

**Backend**
- Node.js
- Express.js (MVC architecture)

**Database**
- MongoDB with Mongoose ODM

**Auth & Security**
- JSON Web Tokens (`jsonwebtoken`) — access + refresh tokens
- bcrypt (`bcryptjs`) — password hashing
- Helmet — secure HTTP headers
- CORS (credentialed, origin-restricted)
- express-rate-limit — brute-force mitigation
- validator — server-side input validation
- cookie-parser — httpOnly refresh-token cookie handling

---

## Folder Structure

```
LoginAuthentication/
├── client/
│   ├── index.html            # Landing page
│   ├── register.html
│   ├── login.html
│   ├── forgot-password.html
│   ├── reset-password.html
│   ├── dashboard.html
│   ├── profile.html
│   ├── style.css             # Full design system (tokens, components, responsive rules)
│   ├── js/
│   │   ├── config.js          # Shared App namespace + API base URL
│   │   ├── validate.js        # Email / password / strength validation
│   │   ├── ui.js               # Toasts, password toggle, strength meter, formatting
│   │   ├── api.js              # Fetch wrapper, token storage, auto-refresh, route guards
│   │   ├── app-shell.js        # Shared dashboard/profile shell (nav, logout, user chip)
│   │   ├── register.js
│   │   ├── login.js
│   │   ├── forgot-password.js
│   │   ├── reset-password.js
│   │   ├── dashboard.js
│   │   └── profile.js
│   └── assets/
│       └── favicon.svg
├── server/
│   ├── server.js              # Entry point
│   ├── app.js                 # Express app config (middleware + routes)
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # register, login, refresh, logout, forgot/reset password
│   │   └── userController.js  # profile get/update, change password
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT verification / protect()
│   │   ├── errorMiddleware.js # notFound + centralized error handler
│   │   └── asyncHandler.js    # try/catch wrapper for async routes
│   ├── models/
│   │   └── User.js            # Mongoose schema + hashing/token helpers
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   └── utils/
│       └── generateToken.js   # Access/refresh token signing
├── .env.example
├── .gitignore
├── package.json
├── LICENSE
└── README.md
```

---

## Installation Guide

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) running locally, **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A way to serve static files for the `client/` folder — e.g. the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) VS Code extension, or `npx serve client`

### 1. Clone and install

```bash
git clone <your-repo-url> LoginAuthentication
cd LoginAuthentication
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Then open `.env` and set real values — at minimum, generate strong secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

See [Environment Variables](#environment-variables) for what each key does.

### 3. Start MongoDB

If running locally, make sure `mongod` is running (or point `MONGO_URI` at your Atlas connection string).

### 4. Run the API server

```bash
npm run dev      # with nodemon (auto-restart)
# or
npm start        # plain node
```

The API boots on `http://localhost:5000` by default. Check `http://localhost:5000/api/health` to confirm it's up.

### 5. Serve the frontend

The client is plain static HTML/CSS/JS, so any static file server works. For example, with VS Code's Live Server extension, right-click `client/index.html` → **Open with Live Server** (defaults to `http://127.0.0.1:5500`).

> The API's CORS config (`CLIENT_ORIGIN` in `.env`) must match whatever origin actually serves the client — update it if your static server uses a different port.

### 6. Try it out

Open the client in your browser, register an account, and log in. You'll land on the protected dashboard.

---

## Environment Variables

All variables live in `.env` (copy from `.env.example`):

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Port the API listens on |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Signing secret for short-lived access tokens |
| `JWT_EXPIRES_IN` | Access token lifetime (e.g. `15m`) |
| `JWT_REFRESH_SECRET` | Signing secret for refresh tokens (must differ from `JWT_SECRET`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime for normal sessions (e.g. `7d`) |
| `JWT_REMEMBER_EXPIRES_IN` | Refresh token lifetime when "Remember me" is checked (e.g. `30d`) |
| `RESET_TOKEN_EXPIRES_IN_MIN` | How long a password-reset link stays valid |
| `CLIENT_ORIGIN` | The origin serving the frontend, for CORS |
| `COOKIE_SECURE` | Set to `true` only when serving over HTTPS |

---

## API Endpoints

Base URL: `http://localhost:5000/api`

### Auth (`/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create a new account |
| `POST` | `/auth/login` | Public (rate-limited) | Authenticate, receive an access token + refresh cookie |
| `POST` | `/auth/refresh` | Public (requires refresh cookie) | Exchange a valid refresh token for a new access token |
| `GET` | `/auth/logout` | Public | Invalidate the current refresh token, clear the cookie |
| `POST` | `/auth/forgot-password` | Public (rate-limited) | Request a password-reset token |
| `POST` | `/auth/reset-password/:token` | Public | Set a new password using a valid reset token |

### User (`/user`) — all require `Authorization: Bearer <accessToken>`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/user/profile` | Get the logged-in user's profile |
| `PUT` | `/user/profile` | Update the logged-in user's full name |
| `PUT` | `/user/password` | Change the logged-in user's password |

### Example: register

```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Jordan Ellis",
  "email": "jordan@example.com",
  "password": "Str0ng!Pass",
  "confirmPassword": "Str0ng!Pass"
}
```

---

## Authentication Architecture

- **Passwords** are hashed with bcrypt (12 rounds) in a Mongoose `pre('save')` hook — the plaintext value never touches the database, and the field is excluded from query results by default (`select: false`).
- **Access tokens** are short-lived JWTs (default 15 minutes), sent in the `Authorization: Bearer` header on every protected request.
- **Refresh tokens** are longer-lived, stored **hashed** on the user document, and delivered to the browser only as an `httpOnly`, `SameSite=Lax` cookie scoped to `/api/auth` — client-side JavaScript never sees the raw refresh token, which limits the impact of XSS.
- When an access token expires, `client/js/api.js` transparently calls `/api/auth/refresh`, gets a new access token, and retries the original request once — the user never notices a 401.
- Refresh tokens **rotate** on every use and on password change, so a leaked token has a short useful window.
- **Password reset** tokens follow the same pattern as passwords: a random token is generated, only its SHA-256 hash is stored, and it expires after `RESET_TOKEN_EXPIRES_IN_MIN` minutes. Since no transactional email provider is configured for local development, the reset link is logged to the server console and returned in the API response under `devPreview` (development mode only) so the flow can be tested end-to-end without an email server.

---

## Screenshots

_Add screenshots of the register, login, dashboard, and profile pages here before publishing — drop image files into `screenshots/` and reference them, e.g.:_

```markdown
![Login page](screenshots/login.png)
![Dashboard](screenshots/dashboard.png)
```

---

## Future Improvements

- Real transactional email delivery for password resets (SendGrid / SES / Postmark)
- OAuth / social login (Google, GitHub)
- Two-factor authentication (TOTP)
- Avatar image upload instead of initials
- Admin panel for managing account status
- Automated test suite (Jest + Supertest for the API, Playwright for E2E)
- Dockerized setup (`docker-compose` for API + MongoDB)

---

## License

Released under the [MIT License](LICENSE).

## Author

Built by **Your Name** as a portfolio project extending the Oasis Infobyte Level 2 internship brief.
