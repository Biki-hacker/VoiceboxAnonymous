<div align="center">

# ⚙️ VoiceBox Anonymous - Backend API & Real-Time Engine

**High-Performance Node.js & Express REST API, WebSocket Broadcast Server, End-to-End Encryption Engine, and MongoDB Layer**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-black?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-8.13.2-880000?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-ws_8.18.2-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![Cryptography](https://img.shields.io/badge/Crypto-AES--256--CBC-blue?style=for-the-badge&logo=shield)](https://nodejs.org/api/crypto.html)
[![JWT](https://img.shields.io/badge/Auth-JWT_&_Bcrypt-ff69b4?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

<p align="center">
  <a href="#-architecture-overview">Architecture</a> •
  <a href="#-directory-structure">Directory Structure</a> •
  <a href="#-environment-variables">Environment Variables</a> •
  <a href="#-data-models--schemas">Data Models</a> •
  <a href="#-cryptography--security">Cryptography & Security</a> •
  <a href="#-api-endpoint-reference">API Reference</a> •
  <a href="#-real-time-websocket-events">WebSocket Events</a> •
  <a href="#-setup--development">Setup & Development</a>
</p>

</div>

---

## 📖 Architecture Overview

The **VoiceBox Anonymous Backend** is engineered around Node.js and Express 5, serving as the central nervous system for organizational communication, user authentication, data persistence, and real-time broadcasts.

### Key Highlights
- **Unified HTTP & WebSocket Server**: A single HTTP server instance hosts both the Express REST API endpoints and a persistent `ws` WebSocket broadcast server on the same port, reducing operational overhead.
- **Envelope Encryption**: Feedback contents, comment texts, poll questions, and poll choices are encrypted at rest with **AES-256-CBC** using a key derived from a master secret and salt via **PBKDF2** (100,000 rounds, SHA-512).
- **Automated Lifecycle Hooks**: Mongoose pre-save middlewares automatically encrypt sensitive fields, while custom response middlewares decrypt payloads on-the-fly for authorized requests.
- **Multi-Tenant Whitelisting**: Strict email verification pipelines allow organizations to specify up to 25 verified employee emails and up to 5 delegated co-admin emails.
- **Layered Defense**: Rate limiting with progressive slow-down, CORS whitelist filters, HTTP security headers, and JWT token rotation with secure HTTP-only cookies.

---

## 📂 Directory Structure

```
backend/
├── controllers/
│   ├── authController.js     # User registration, verification & session handling
│   ├── mailController.js     # Brevo transactional email sender for contact submissions
│   ├── orgController.js      # Organization CRUD, employee/co-admin email whitelists
│   └── postController.js     # Posts, comments, reactions, pins, stats & poll lifecycle
├── middleware/
│   ├── auth.js               # JWT verification, RBAC guard, IP rate & speed limiter
│   ├── decryptMiddleware.js  # Intercepts res.json to decrypt post/comment payloads
│   ├── errorHandler.js       # Centralized error handler and JSON response formatter
│   ├── logger.js             # HTTP request method, path, and duration logger
│   └── validation.js         # Input validation schemas & regex filters (express-validator)
├── models/
│   ├── Organization.js       # Organization schema with indexed normalized email arrays
│   ├── Post.js               # Post schema, comment sub-schema, poll sub-schema & crypto hooks
│   └── User.js               # User credentials, roles (admin/employee), and verification state
├── routes/
│   ├── auth.js               # Alternative/legacy auth route handlers
│   ├── authRoutes.js         # Active /api/auth routes (Supabase token validation, login, refresh)
│   ├── mailRoutes.js         # /api/mail contact form routes
│   ├── orgRoutes.js          # /api/organizations routes
│   └── postRoutes.js         # /api/posts & /api/posts/polls routes
├── utils/
│   ├── cryptoUtils.js        # AES-256-CBC cipher with PBKDF2 key derivation & helpers
│   └── supabaseClient.js     # Supabase client initialized with server environment keys
├── .env                      # Local server environment configuration (not in git)
├── index.js                  # Server entry point: Express app, WebSocket init, DB connection
├── package.json              # Backend package configuration and scripts
└── README.md                 # This backend documentation
```

---

## ⚙️ Environment Variables

The backend requires a `.env` file in the `backend/` directory. Configure the following variables:

| Variable | Type | Required | Description | Example |
| :--- | :---: | :---: | :--- | :--- |
| `PORT` | Number | No | Port on which the HTTP & WebSocket server runs | `5000` |
| `NODE_ENV` | String | No | Application environment (`development` / `production`) | `development` |
| `MONGO_URI` | String | **Yes** | MongoDB connection string (Atlas or local instance) | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` |
| `JWT_SECRET` | String | **Yes** | 256-bit cryptographically secure string for signing access JWTs | `a8f3...d1e2` |
| `REFRESH_TOKEN_SECRET` | String | No | Secret for signing refresh tokens (falls back to `JWT_SECRET + '_refresh'`) | `b9c4...f4a1` |
| `ENCRYPTION_KEY` | String | Recommended | Master encryption passphrase for AES-256-CBC payload cipher | `your-32-char-encryption-key-here` |
| `ENCRYPTION_SALT` | String | Recommended | Salt value for PBKDF2 key derivation | `your-cryptographic-salt-value` |
| `SUPABASE_URL` | String | **Yes** | Supabase project URL | `https://xyzproject.supabase.co` |
| `SUPABASE_KEY` | String | **Yes** | Supabase public anonymous API key (used for token validation) | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | String | No | Supabase service role key (for server-side privileged tasks) | `eyJhbGciOi...` |
| `BREVO_API_KEY` | String | No | Brevo (Sendinblue) API v3 key for transactional emails | `xkeysib-...` |
| `YOUR_RECEIVING_EMAIL` | String | No | Destination mailbox for contact form submissions | `admin@yourdomain.com` |
| `BREVO_SENDER_EMAIL` | String | No | Verified sender address configured in Brevo | `notifications@yourdomain.com` |
| `FRONTEND_URL` | String | No | Primary frontend URL allowed through CORS policies | `http://localhost:5173` |

> ⚠️ **Important Security Note**: In production, ensure `JWT_SECRET`, `ENCRYPTION_KEY`, and `ENCRYPTION_SALT` are high-entropy random strings. Never commit `.env` files to source control.

---

## 🗄️ Data Models & Schemas

### 1. User (`models/User.js`)
Represents an individual user (either an administrator or an employee):
- `email`: (String, required, unique, lowercase) User's email address.
- `password`: (String, selected: false) Bcrypt-hashed password (salt rounds: 10). Omitted for OAuth users.
- `isOAuth`: (Boolean, default: false) Indicates social login via Supabase.
- `role`: (String, enum: `['admin', 'employee']`, required).
- `organizationId`: (ObjectId, ref: `Organization`, default: null).
- `verified`: (Boolean, default: false) Whitelist verification status.
- `lastLogin`: (Date) Timestamp of most recent successful authentication.
- `lastPasswordChange`: (Date, selected: false) Used to invalidate previous JWT sessions if password changed.

### 2. Organization (`models/Organization.js`)
Multi-tenant organizational container:
- `name`: (String, required, unique, trimmed).
- `adminId`: (ObjectId, ref: `User`, required, indexed).
- `adminEmail`: (String, required, lowercase).
- `employeeEmails`: Array of employee objects (maximum 25 entries):
  - `email`: Original format email string.
  - `normalizedEmail`: Lowercase indexed string for fast case-insensitive checks.
  - `isVerified`: Boolean status flag.
  - `verificationToken`: Unique UUID token generated for verification.
  - `addedAt`: Creation timestamp.
- `coAdminEmails`: Array of co-admin objects (maximum 5 entries, same structure as employee emails).

### 3. Post (`models/Post.js`)
Encrypted organizational feed item:
- `orgId`: (ObjectId, ref: `Organization`, required, indexed).
- `postType`: (String, enum: `['feedback', 'complaint', 'suggestion', 'public', 'poll']`).
- `content`: (Mixed) Encrypted AES-256 payload `{ iv, content, version, isEncrypted: true }`.
- `mediaUrls`: (Array of Strings) Direct URLs to uploaded media in Supabase Storage.
- `region`: (String) Optional geographic tag.
- `department`: (String) Optional organizational department tag.
- `author`: (ObjectId, ref: `User`, required).
- `createdByRole`: (String, required).
- `isAnonymous`: (Boolean, default: true).
- `isPinned`: (Boolean, default: false).
- `isEdited`: (Boolean, default: false).
- `reactions`: Map of reaction buckets (`like`, `love`, `laugh`, `angry`) with `count` and an array of `users`.
- `comments`: Array of comment subdocuments with encrypted `text`, `reactions`, and `isPinned` flags.
- `isPoll`: (Boolean, default: false).
- `pollQuestion`: Encrypted question string.
- `pollOptions`: Array of `{ _id, text: (encrypted), voteCount }`.
- `pollVotes`: Array of `{ user: ObjectId, optionId: ObjectId }` ensuring one vote per user.
- `pollStatus`: (`'active'` | `'stopped'`).
- `pollStoppedAt`: (Date).

---

## 🔒 Cryptography & Security

### 1. AES-256-CBC Payload Encryption
The encryption engine located in `utils/cryptoUtils.js` derives a 32-byte AES key and 16-byte initialization vector (IV) using PBKDF2:
```js
// Key & IV Derivation
pbkdf2(password, salt, 100000, 48, 'sha512');
```
When a post or comment is saved:
1. `postSchema.pre('save')` encrypts plaintext strings into `{ iv: hex, content: hex, version: '1.0.0', isEncrypted: true }`.
2. When documents are fetched via API responses, `middleware/decryptMiddleware.js` intercepts `res.json()` and decrypts payloads back into human-readable text for authenticated consumers.

### 2. Session Management & Dual-Token Flow
- **Access Token**: Short-lived JWT (signed with `JWT_SECRET`) passed via the `Authorization: Bearer <token>` header.
- **Refresh Token**: Long-lived JWT stored in an `httpOnly`, `SameSite=Strict`, `Secure` cookie.
- **Silent Refresh**: The frontend triggers `/api/auth/refresh-token` when a request returns `401 Unauthorized`, obtaining a new access token without disrupting the user.

### 3. Rate Limiting & Throttling
- **API Wide**: 250,000 requests per 5-hour window per IP (`express-rate-limit`).
- **Authentication Routes**: 1,000 requests per 2-hour window (`authLimiter`) combined with `speedLimiter` (`express-slow-down`) introducing a 100ms progressive delay after 500 requests.
- **Contact Form**: Strict limit of 5 submissions per 15 minutes per IP.

---

## 📡 API Endpoint Reference

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user account (`email`, `password`, `role`, `organizationId`). |
| `POST` | `/api/auth/login` | Public | Authenticate user with email and Supabase token; sets refresh cookie and returns JWT. |
| `POST` | `/api/auth/refresh-token` | Cookie | Generate a new access JWT using the `refreshToken` cookie. |
| `POST` | `/api/auth/logout` | Public | Invalidate refresh cookie and clear user session. |
| `GET` | `/api/auth/me` | Bearer | Return profile and role of currently authenticated user. |
| `POST` | `/api/auth/verify` | Public | Verify employee against organization verification requirements. |
| `GET` | `/api/auth/verify-status` | Optional | Check if a given email is verified for an organization. |
| `POST` | `/api/auth/verify-email` | Public | Verify employee email against organization whitelist pool. |

### 🏢 Organizations (`/api/organizations`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/organizations/search?query=` | Public | Search organizations by name. |
| `GET` | `/api/organizations/:orgId/verify-email?email=` | Public | Verify whether an email address is authorized for an organization. |
| `GET` | `/api/organizations/by-admin` | Bearer (Admin) | Retrieve the organization managed by the authenticated admin. |
| `GET` | `/api/organizations/coadmin` | Bearer | Retrieve organizations where the authenticated user is a co-admin. |
| `POST` | `/api/organizations` | Bearer (Admin) | Create a new organization (`name`, `employeeEmails`, `coAdminEmails`). |
| `GET` | `/api/organizations/:orgId` | Bearer | Fetch details for a specific organization. |
| `PATCH` | `/api/organizations/:orgId` | Bearer (Admin) | Update organization details (e.g. rename organization). |
| `DELETE` | `/api/organizations/:orgId` | Bearer (Admin) | Delete organization and its associated posts/configuration. |
| `GET` | `/api/organizations/:orgId/emails` | Bearer (Admin) | Get the list of allowed employee emails (max 25). |
| `PUT` | `/api/organizations/:orgId/emails` | Bearer (Admin) | Update the allowed employee email whitelist (`{ emails: [...] }`). |
| `GET` | `/api/organizations/:orgId/coadmin-emails` | Bearer (Admin) | Get the list of delegated co-admin emails (max 5). |
| `PUT` | `/api/organizations/:orgId/coadmin-emails` | Bearer (Admin) | Update the co-admin email whitelist (`{ emails: [...] }`). |

### 💬 Posts, Polls & Interactions (`/api/posts`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/posts/org/:orgId` | Bearer | Fetch posts for an organization (filters: `postType`, `region`, `department`, `search`). |
| `POST` | `/api/posts` | Bearer | Create a new post (`postType`, `content`, `mediaUrls`, `region`, `department`, `isAnonymous`). |
| `GET` | `/api/posts/stats/:orgId` | Bearer | Retrieve aggregated metrics (posts by department, region, and post category). |
| `PUT` | `/api/posts/:postId` | Bearer (Author) | Edit post content, region, or department. |
| `DELETE` | `/api/posts/:postId` | Bearer (Author/Admin) | Delete a post and its associated comments. |
| `POST` | `/api/posts/:postId/pin` | Bearer (Admin) | Toggle pin status for a post. |
| `GET` | `/api/posts/:postId/reactions` | Bearer | Get current reaction status for the authenticated user. |
| `POST` | `/api/posts/:postId/reactions` | Bearer | Add or update a reaction (`like`, `love`, `laugh`, `angry`). |
| `DELETE` | `/api/posts/:postId/reactions` | Bearer | Remove reaction from a post. |
| `POST` | `/api/posts/:postId/comments` | Bearer | Submit a comment on a post (`{ text }`). |
| `PUT` | `/api/posts/:postId/comments/:commentId` | Bearer (Author) | Edit a comment's text. |
| `DELETE` | `/api/posts/:postId/comments/:commentId` | Bearer (Author/Admin) | Remove a comment. |
| `POST` | `/api/posts/:postId/comments/:commentId/pin` | Bearer (Admin) | Toggle pin status for a specific comment. |
| `POST` | `/api/posts/:postId/comments/:commentId/reactions` | Bearer | React to a specific comment. |
| `GET` | `/api/posts/polls/org/:orgId` | Bearer | Fetch all polls created for an organization. |
| `POST` | `/api/posts/polls` | Bearer (Admin) | Create a new live poll (`question`, `options: [...]`, `region`, `department`). |
| `PUT` | `/api/posts/polls/:pollId` | Bearer (Admin) | Edit an active poll. |
| `DELETE` | `/api/posts/polls/:pollId` | Bearer (Admin) | Delete a poll. |
| `POST` | `/api/posts/polls/:pollId/vote` | Bearer (Employee) | Cast a single vote for an option (`{ optionId }`). |
| `POST` | `/api/posts/polls/:pollId/stop` | Bearer (Admin) | Permanently close voting for a poll. |

### ✉️ Contact Form (`/api/contact`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/contact` | Public (Rate Limited) | Send a transactional email to platform admins via Brevo API (`name`, `email`, `message`). |

### 🩺 Health Checks

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server uptime, timestamp, and process status. |
| `GET` | `/api/health` | API operational check returning a 200 OK status. |

---

## ⚡ Real-Time WebSocket Events

The WebSocket server runs attached to the Express HTTP server instance (`ws://localhost:5000` or `wss://...` in production). When state changes occur in the database, controllers call:

```js
const broadcastMessage = req.app.get('broadcastMessage');
broadcastMessage({ type: 'EVENT_NAME', payload: { ... } });
```

### Broadcast Event Catalog

| Event Name | Trigger | Payload Summary |
| :--- | :--- | :--- |
| `NEW_POST` | New post created | Decrypted post object |
| `EDIT_POST` | Post content updated | Updated post object |
| `DELETE_POST` | Post removed | `{ postId, orgId }` |
| `POST_REACTION` / `UPDATE_REACTION` | Reaction toggled on a post | `{ postId, reactions, orgId }` |
| `PIN_POST` | Post pinned or unpinned | `{ postId, isPinned, orgId }` |
| `NEW_COMMENT` | Comment added to post | `{ postId, comment, orgId }` |
| `EDIT_COMMENT` | Comment text edited | `{ postId, commentId, text, orgId }` |
| `DELETE_COMMENT` | Comment removed | `{ postId, commentId, orgId }` |
| `COMMENT_REACTION` | Reaction on a comment | `{ postId, commentId, reactions, orgId }` |
| `PIN_COMMENT` | Comment pinned or unpinned | `{ postId, commentId, isPinned, orgId }` |
| `NEW_POLL` | Admin created a poll | Complete decrypted poll post object |
| `EDIT_POLL` | Admin modified a poll | Updated poll object |
| `DELETE_POLL` | Poll removed | `{ pollId, orgId }` |
| `VOTE_POLL` | Employee cast a vote | `{ pollId, pollOptions, totalVotes, orgId }` |
| `STOP_POLL` | Poll closed by admin | `{ pollId, pollStatus: 'stopped', pollStoppedAt, orgId }` |

---

## 🛠️ Setup & Development

### 1. Installation
```bash
cd backend
npm install
```

### 2. Run in Development Mode
Starts the server with `nodemon` for automatic reload on file changes:
```bash
npm run dev
```

### 3. Run in Production Mode
```bash
npm start
```

### 4. Production Deployment Checklist
1. **Set `NODE_ENV=production`**: Enables strict cookie flags (`secure: true`) and hides internal error stack traces from API responses.
2. **Reverse Proxy Configuration**: Ensure your reverse proxy (e.g. Nginx, Render, AWS ALB) passes headers `X-Forwarded-For` and `X-Forwarded-Proto`. The app has `trust proxy: 1` enabled for accurate client IP identification.
3. **WebSocket Upgrade Support**: Ensure your cloud provider or Nginx configuration supports HTTP `Upgrade` headers for persistent WebSocket connections.
4. **MongoDB Replica Set**: A replica set (standard on MongoDB Atlas) is required for write concerns and atomic updates.

---

## 📄 License & Author

Created and maintained by **[Souvik Dhara](https://github.com/Biki-hacker)**.
Licensed under the **ISC License**.