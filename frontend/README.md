<div align="center">

# 💻 VoiceBox Anonymous - Frontend Web Application

**State-of-the-Art React 19 Single Page Application, Powered by Vite, Tailwind CSS, Framer Motion, and Real-Time WebSockets**

[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.3.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.15.0-black?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4.9-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Client_v2.49.7-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

<p align="center">
  <a href="#-user-experience--core-features">Key Features</a> •
  <a href="#-directory-structure">Directory Structure</a> •
  <a href="#-environment-variables">Environment Variables</a> •
  <a href="#-application-routing--pages">Pages & Routing</a> •
  <a href="#-core-subsystems">Core Subsystems</a> •
  <a href="#-theme--design-system">Design System</a> •
  <a href="#-development--scripts">Development & Scripts</a> •
  <a href="#-deployment-guide">Deployment Guide</a>
</p>

</div>

---

## 📖 User Experience & Core Features

The **VoiceBox Anonymous Frontend** is a Single Page Application (SPA) designed to deliver an intuitive, responsive, and trustworthy interface for organizational feedback and whistleblowing.

### 🌟 Key Features
- **Dynamic Dual Dashboards**:
  - **Admin Dashboard**: Interactive organization metrics (Chart.js bar and pie charts), multi-criteria filtering (by department, region, and post category), moderation controls (pinning/unpinning, deletion), live polling management, and employee/co-admin whitelist administration.
  - **Employee Dashboard**: Frictionless anonymous submission interface (with image and video attachments up to 10MB), real-time feed updates, live pulse poll voting with animated results, and threaded discussions.
- **Real-Time Live Synchronization**: Built-in WebSocket client with an exponential backoff auto-reconnect strategy, keeping posts, comment threads, vote counts, and emoji reactions synced across all connected devices in real time.
- **Direct-to-Cloud Media Pipeline**: Media files (images and videos) are uploaded directly to Supabase Storage (`media` bucket) with client-side mime validation, file size limits (max 10MB), and progress indicators.
- **Automated Token Management**: Axios interceptors manage access token injection, network error retries, and silent token refresh queued requests upon receiving `401 Unauthorized`.
- **Fluid Dark / Light Mode**: Tailored dark-mode palette synchronized across local storage and root document styling.
- **Accessibility & Micro-Animations**: Smooth layout transitions and feedback dialogs powered by Framer Motion and Headless UI.
- **SEO & Social Optimization**: Dynamic page metadata, OpenGraph tags, Twitter cards, and Schema.org JSON-LD configured via React Helmet.

---

## 📂 Directory Structure

```
frontend/
├── public/                    # Static assets, favicon, robots.txt, manifest.json
├── src/
│   ├── api/                   # API connection layer
│   │   ├── auth.js            # Auth API request helper
│   │   └── axios.js           # Configured Axios instance with retry & token refresh interceptors
│   ├── assets/                # Graphic assets, SVGs, and brand illustrations
│   ├── components/            # Application UI components
│   │   ├── common/            # Shared reusable primitives
│   │   │   ├── CommentEditModal.jsx # Modal dialog for modifying comments
│   │   │   ├── CommentSection.jsx   # Threaded comments list, inputs & pinned comments
│   │   │   ├── CustomSelect.jsx     # Accessible styled dropdown selector
│   │   │   ├── Footer.jsx           # Global website footer with site links
│   │   │   ├── Modal.jsx            # Headless UI accessible dialog modal wrapper
│   │   │   ├── ReactionButton.jsx   # Interactive emoji reaction button & tooltip
│   │   │   ├── StarBorder.jsx       # Animated decorative gradient border
│   │   │   └── ThemeToggle.jsx      # Dark / Light mode toggle switch
│   │   ├── home/              # Landing page sections
│   │   │   ├── AboutSection.jsx     # Mission & privacy statement
│   │   │   ├── AnimatedText.jsx     # Motion-driven typography effects
│   │   │   ├── ContactSection.jsx   # Direct inquiry form linked to Brevo email API
│   │   │   ├── FeatureCard.jsx      # Individual visual feature card
│   │   │   ├── FeaturesSection.jsx  # Grid of core capabilities
│   │   │   ├── HeroSection.jsx      # Hero banner with call-to-action buttons
│   │   │   ├── ShieldLogo.jsx       # Animated brand icon
│   │   │   └── TestimonialOrbit.jsx # Interactive animated testimonial carousel
│   │   ├── ContactModal.jsx         # Global popup for customer inquiries
│   │   ├── DeletionConfirmation.jsx # High-visibility deletion safety dialog
│   │   ├── MediaViewer.jsx          # Lightbox viewer for full-screen images/videos
│   │   ├── Polling.jsx              # Interactive polling card with voting and live tallies
│   │   ├── PostCreation.jsx         # Form to compose anonymous feedback or start polls
│   │   ├── PostEditModal.jsx        # Edit dialog for modifying existing post content
│   │   ├── ProtectedRoute.jsx       # Role-based route guard (admin / employee)
│   │   ├── SEO.jsx                  # Dynamic HTML title, description & OpenGraph tags
│   │   └── Sidebar.jsx              # Dashboard collapsible navigation drawer
│   ├── context/               # Global React context providers
│   │   └── AuthContext.jsx    # Authentication state, login, register, and logout handlers
│   ├── hooks/                 # Custom React hooks
│   │   ├── useDecryption.js   # Client-side decrypt utility hook
│   │   ├── useTheme.js        # Theme management hook (dark / light mode)
│   │   └── useWebSocket.js    # Persistent WebSocket hook with automatic reconnect
│   ├── pages/                 # Full application views
│   │   ├── AdminDashboard.jsx       # Comprehensive administration console & charts
│   │   ├── AuthCallback.jsx         # Supabase OAuth redirect & callback handler
│   │   ├── EmployeeDashboard.jsx    # Employee feed, submission form & active polls
│   │   ├── EmployeeVerification.jsx # Whitelist verification page
│   │   ├── ForgotPassword.jsx       # Password reset request page
│   │   ├── Home.jsx                 # Public marketing landing page
│   │   ├── PricingPage.jsx          # Tier plans and feature comparison
│   │   ├── SignIn.jsx               # Login portal with email & OAuth options
│   │   ├── SignUp.jsx               # Registration portal for admins & employees
│   │   ├── Subscriptions.jsx        # Subscription tier management
│   │   ├── TermsPolicy.jsx          # Terms of Service & Privacy Policy document
│   │   └── UpdatePassword.jsx       # Password reset confirmation page
│   ├── utils/                 # Utility functions & helpers
│   │   ├── auth.js            # Token & local storage storage helpers
│   │   ├── axios.js           # API instance export
│   │   ├── crypto.js          # CryptoJS AES-256 decryption helper
│   │   ├── reactions.js       # Reaction counts formatting helper
│   │   ├── sitemapGenerator.js# Sitemap generation logic
│   │   └── uploadMedia.js     # Direct Supabase Storage media upload pipeline
│   ├── App.css                # Global animation & layout styling
│   ├── App.jsx                # Application root with React Router DOM routes & SEO
│   ├── index.css              # Tailwind base, components, and utilities
│   ├── main.jsx               # ReactDOM entry point
│   └── supabaseClient.js      # Supabase JavaScript SDK initialization
├── .env                       # Frontend environment variables
├── eslint.config.js           # ESLint v9 configuration
├── index.html                 # Single page application HTML shell
├── package.json               # Frontend package manifest & scripts
├── postcss.config.js          # PostCSS configuration for Tailwind CSS
├── tailwind.config.js         # Tailwind configuration & custom keyframes
├── vercel.json                # Vercel SPA routing rewrite rules
├── vite.config.js             # Vite configuration with React plugin
└── README.md                  # This frontend documentation
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `frontend/` directory with the following keys:

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `VITE_SUPABASE_URL` | **Yes** | Public Supabase project URL | `https://xyzproject.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Supabase anonymous public key | `eyJhbGciOi...` |
| `VITE_API_URL` | **Yes** | Base URL for backend REST API endpoints | `http://localhost:5000/api` |
| `VITE_API_BASE_URL` | **Yes** | Fallback base URL for API requests | `http://localhost:5000/api` |
| `VITE_WS_URL` | **Yes** | WebSocket connection URL | `ws://localhost:5000` |

---

## 🚦 Application Routing & Pages

Routes are declared in `src/App.jsx` using `react-router-dom` v7:

| Path | Component | Access | Description |
| :--- | :--- | :---: | :--- |
| `/` | `Home` | Public | Landing page with Hero, Features, Testimonials, About, and Contact. |
| `/pricing` | `PricingPage` | Public | Detailed plan comparison (Free, Pro, Enterprise). |
| `/signin` | `SignIn` | Public | Authentication page supporting credentials and Supabase OAuth. |
| `/signup` | `SignUp` | Public | Account creation with dual Admin/Employee role selection. |
| `/forgotpassword` | `ForgotPassword` | Public | Request a password reset link. |
| `/updatepassword` | `UpdatePassword` | Public | Set a new password after following email reset link. |
| `/auth/callback` | `AuthCallback` | Public | Handles OAuth redirect tokens and synchronizes session state. |
| `/terms-and-policy` | `TermsPolicy` | Public | Full Terms of Service and Privacy Policy disclosures. |
| `/admin-dashboard` | `AdminDashboard` | **Admin Only** | Moderation feed, analytics, whitelist manager, and live polls. |
| `/subscriptions` | `Subscriptions` | **Admin Only** | Manage organization plan, limits, and billing details. |
| `/employee-dashboard` | `EmployeeDashboard` | **Employee Only** | Anonymous submission portal, organizational feed, and poll voting. |
| `/employee/verify` | `EmployeeVerification` | **Employee Only** | Verification interface for employees against company whitelist. |

---

## 🧩 Core Subsystems

### 1. Authentication & Route Protection (`AuthContext.jsx` & `ProtectedRoute.jsx`)
- `AuthContext` provides the current `user`, `loading`, and authentication actions (`login`, `register`, `logout`, `checkAuth`).
- On application mount, `checkAuth()` verifies the existing token against `/api/auth/me`.
- `ProtectedRoute` evaluates both authentication state and role eligibility (`requiredRole="admin"` or `requiredRole="employee"`). If an unauthorized user attempts access, they are automatically redirected.

### 2. Media Upload Pipeline (`uploadMedia.js`)
- Uploads images (`jpeg`, `png`, `gif`, `webp`) and videos (`mp4`, `webm`, `ogg`) directly to Supabase Storage in the `media` bucket under the `posts/` folder.
- **Client-Side Validation**: Restricts file size to a maximum of 10MB.
- **Progress Tracking**: Reports upload percentage back to caller components to render real-time upload progress bars.
- Returns a signed public CDN URL stored directly on the post model.

### 3. Real-Time WebSocket Hook (`useWebSocket.js`)
- Manages connection lifecycle with the backend WebSocket server (`ws://...`).
- Implements an **exponential backoff reconnection algorithm** (up to 5 attempts with delay capped at 30 seconds) in case of unexpected network disconnects (`code: 1006`).
- Automatically handles incoming JSON messages and triggers UI state updates for new posts, reactions, comments, pins, and poll votes.

### 4. Resilient HTTP Layer (`api/axios.js`)
- Automatically injects the `Authorization: Bearer <token>` header from `localStorage`.
- Includes automated retry logic (up to 3 attempts with progressive delay) for transient network timeouts or dropped connections.
- Implements a **silent token refresh queue**: when a 401 response is intercepted, subsequent requests are queued while a single refresh request runs in the background.

---

## 🎨 Theme & Design System

- **Class-Based Dark Mode**: Configured in `tailwind.config.js` via `darkMode: 'class'`. The `useTheme` hook syncs the `dark` class on the `<html>` root and persists user preference in `localStorage`.
- **Component Palette**:
  - Light mode: crisp slates (`bg-slate-50`, `text-slate-800`), clean borders, and soft shadows.
  - Dark mode: deep navy and slate surfaces (`dark:bg-slate-900`, `dark:bg-slate-800/80`), accented with high-contrast text and vibrant blue/violet focus rings.
- **Animations**: Custom keyframes for gradient movements (`star-movement-bottom`, `star-movement-top`) and spring physics with Framer Motion.

---

## 💻 Development & Scripts

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Local Development Server
Starts the Vite dev server with Hot Module Replacement (HMR):
```bash
npm run dev
```
Accessible at: [http://localhost:5173](http://localhost:5173)

### 3. Build for Production
Creates an optimized, minified production build in the `dist/` directory:
```bash
npm run build
```

### 4. Preview Production Build
Locally tests the production assets generated by `npm run build`:
```bash
npm run preview
```

### 5. Linting
Runs ESLint across all JavaScript and JSX source files:
```bash
npm run lint
```

---

## 🚀 Deployment Guide

### Deploying to Vercel
This repository includes a `vercel.json` file configuring SPA routing rewrites:
```json
{
  "routes": [
    {
      "src": "/[^.]+",
      "dest": "/index.html",
      "status": 200
    }
  ]
}
```

1. Import the repository on [Vercel](https://vercel.com/).
2. Set the **Root Directory** to `frontend`.
3. In Project Settings, add the Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (your production backend URL + `/api`)
   - `VITE_API_BASE_URL` (your production backend URL + `/api`)
   - `VITE_WS_URL` (your production WebSocket URL `wss://...`)
4. Trigger deployment.

---

## 📄 License & Author

Created and maintained by **[Souvik Dhara](https://github.com/Biki-hacker)**.
Distributed under the **ISC License**.
