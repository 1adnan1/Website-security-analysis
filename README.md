# Website Security Analysis (SecureCheck)

A modern, full-stack website security auditing and diagnostic web application. Instantly scan any domain or URL for SSL/TLS certificate validity, security response headers (HSTS, CSP, X-Frame-Options, etc.), DNS resolution, and threat intelligence.

---

## 🛡️ Features

- **Real-Time Website Security Scanner**:
  - Validates SSL/TLS certificate validity, issuer, and expiration date.
  - Checks HTTPS protocol enforcement.
  - Tests HTTP security response headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection).
  - Performs DNS IP address resolution.
- **Trust & Health Scoring**:
  - Dynamically calculates a weighted 0–100 security health score based on encryption protocols and security header hygiene.
- **Technical Security Reports**:
  - Comprehensive breakdown with printable audit report styling.
  - Actionable security hardening recommendations.
- **Threat Intelligence Feed**:
  - Live intercept simulation for phishing, malware, and expired certificates.
- **Security Analytics**:
  - Visual charts showing scan frequency, health score trends, and vulnerability vector distribution using Recharts.
- **User Authentication & Scan History**:
  - Secure JWT and bcrypt-based user registration and login.
  - Per-user scan history archiving and cloud sync.
- **Cyber-Modern UI**:
  - Dark mode with glassmorphic cards, glowing accents, and smooth Motion transitions.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (Express.js)
- **SSL Diagnostics**: `ssl-checker`
- **DNS & Networking**: Native Node `dns` & `axios`
- **Authentication**: `jsonwebtoken` (JWT) & `bcryptjs`
- **Build / Bundler**: `esbuild` & `tsx`

---

## 📁 Project Structure

```
.
├── api/                  # Serverless entry points (Vercel deployment)
│   └── index.js
├── src/
│   ├── components/       # Reusable UI components (GlassCard, StatusBadge, etc.)
│   │   └── Common.jsx
│   ├── App.jsx           # Main application dashboard & scan views
│   ├── main.jsx          # React DOM entry point
│   ├── types.js          # Shared helper utilities & styling constants
│   └── index.css         # Tailwind global styles
├── server.js             # Express API server & Vite middleware
├── metadata.json         # AI Studio applet metadata
├── package.json          # Dependencies & npm scripts
├── vite.config.ts        # Vite configuration
└── README.md             # Project documentation
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun

### Installation

1. Clone or download the repository:
   ```bash
   git clone <repository-url>
   cd website-security-analysis
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional):
   Create a `.env` file based on `.env.example`:
   ```env
   JWT_SECRET=your-secret-key-here
   ```

---

## 🏃 Running the Application

### Development Mode
Starts the combined Express server and Vite development middleware on port `3000`:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
Builds the Vite client bundle and packages the Express backend with esbuild:
```bash
npm run build
```

### Production Run
Starts the compiled standalone production server:
```bash
npm start
```

---

## 🔌 API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/check-security` | Analyzes target URL/domain for SSL, headers, and DNS | Optional (Attaches to history if auth token provided) |
| `GET` | `/api/stats` | Returns global scanning and threat mitigation metrics | No |
| `GET` | `/api/threats` | Retrieves active threat intelligence feeds | No |
| `POST` | `/api/auth/register` | Registers a new user account (`name`, `email`, `password`) | No |
| `POST` | `/api/auth/login` | Authenticates user credentials and returns a JWT | No |
| `GET` | `/api/auth/me` | Returns current authenticated user profile | Bearer Token |
| `GET` | `/api/history` | Returns the scan history for the logged-in user | Bearer Token |

---

## 📄 License

Apache-2.0
