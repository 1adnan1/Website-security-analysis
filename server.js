import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import sslChecker from "ssl-checker";
import dns from "dns";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const lookupDns = promisify(dns.lookup);
const JWT_SECRET = process.env.JWT_SECRET || "security-analysis-default-key-change-me";

// In-memory data structures (Note: Replaces DB for demo)
const users = [];
const histories = [];

// Global statistics tracking
const globalStats = {
  scannedToday: 4821,
  threatsBlocked: 1293,
  highRiskSites: 342,
  avgResponseTime: "1.8s"
};

// Mock threats for monitoring
const activeThreats = [
  { id: 1, type: "Phishing", target: "bank-auth-update.com", risk: "critical", location: "US-East", timestamp: new Date().toISOString() },
  { id: 2, type: "Malware", target: "free-software-downloader.net", risk: "high", location: "EU-West", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 3, type: "SSL Expiry", target: "legacy-corp-portal.org", risk: "medium", location: "AS-South", timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: 4, type: "SQL injection", target: "api-v1-dev.xyz", risk: "critical", location: "Global", timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString() }
];

export const app = express();
app.use(express.json());

// --- Stats Routes ---
app.get("/api/stats", (req, res) => {
  res.json(globalStats);
});

app.get("/api/threats", (req, res) => {
  res.json(activeThreats);
});

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next();

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return next();
    req.user = user;
    next();
  });
};

app.use(authenticateToken);

// --- Auth Routes ---
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now().toString(), name, email, password: hashedPassword };
  users.push(newUser);

  const token = jwt.sign({ id: newUser.id, email: newUser.email, name: newUser.name }, JWT_SECRET);
  res.json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get("/api/auth/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  res.json(req.user);
});

// --- Security Scanning Routes ---
app.post("/api/check-security", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  // Update stats
  globalStats.scannedToday += 1;

  try {
    let targetUrl = url;
    if (!targetUrl.startsWith("http")) targetUrl = `https://${targetUrl}`;
    const domain = new URL(targetUrl).hostname;

    // 1. SSL/TLS Checks
    let sslInfo = null;
    try {
      sslInfo = await sslChecker(domain);
    } catch (e) {
      sslInfo = { valid: false, error: "SSL check failed" };
    }

    // 2. Header Checks
    let headersInfo = null;
    try {
      const response = await axios.get(targetUrl, { 
        timeout: 5 * 1000,
        maxRedirects: 5,
        validateStatus: () => true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SecureCheckLPU/1.0; +https://ais-dev-duu3ry3jbycbes346pkmuu-348159651728.asia-southeast1.run.app)'
        }
      });
      
      const headers = response.headers;
      headersInfo = {
        csp: headers["content-security-policy"] || null,
        xFrameOptions: headers["x-frame-options"] || null,
        xssProtection: headers["x-xss-protection"] || null,
        contentTypeOptions: headers["x-content-type-options"] || null,
        referrerPolicy: headers["referrer-policy"] || null,
        hsts: headers["strict-transport-security"] || null,
        server: headers["server"] || "Unknown",
        isHttps: targetUrl.startsWith("https")
      };
    } catch (e) {
      headersInfo = { error: "Failed to fetch headers", isHttps: targetUrl.startsWith("https") };
    }

    // 3. DNS Checks
    let dnsInfo = null;
    try {
      const addresses = await lookupDns(domain);
      dnsInfo = { ip: addresses.address };
    } catch (e) {
      dnsInfo = { error: "DNS lookup failed" };
    }

    // Score calculation and threat status
    const score = calculateScore(sslInfo, headersInfo);
    if (score < 50) {
      globalStats.highRiskSites += 1;
      globalStats.threatsBlocked += 1;
    }

    // Construct final report
    const results = {
      id: Date.now().toString(),
      domain,
      timestamp: new Date().toISOString(),
      ssl: sslInfo,
      headers: headersInfo,
      dns: dnsInfo,
      checks: [
        { name: "SSL Certificate", status: sslInfo?.valid ? "pass" : "fail", detail: sslInfo?.valid ? `Valid until ${sslInfo.validTo}` : "Invalid or Missing" },
        { name: "HTTPS Support", status: targetUrl.startsWith("https") ? "pass" : "fail", detail: targetUrl.startsWith("https") ? "Securely using HTTPS" : "Site is using insecure HTTP" },
        { name: "HSTS Header", status: headersInfo?.hsts ? "pass" : "fail", detail: headersInfo?.hsts || "Missing" },
        { name: "CSP Header", status: headersInfo?.csp ? "pass" : "warning", detail: headersInfo?.csp ? "Header present" : "Vulnerable to XSS (Missing CSP)" },
        { name: "X-Frame-Options", status: headersInfo?.xFrameOptions ? "pass" : "warning", detail: headersInfo?.xFrameOptions ? "Clickjacking protection present" : "Missing" },
      ],
      score
    };

    if (req.user) {
      histories.push({ ...results, userId: req.user.id });
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/history", (req, res) => {
  if (!req.user) return res.json([]);
  const userHistory = histories.filter(h => h.userId === req.user.id);
  res.json(userHistory);
});

function calculateScore(ssl, headers) {
  let score = 50; 
  if (ssl?.valid) score += 20;
  if (headers?.isHttps) score += 10;
  if (headers?.hsts) score += 5;
  if (headers?.csp) score += 5;
  if (headers?.xFrameOptions) score += 5;
  if (headers?.xssProtection) score += 5;
  return Math.min(score, 100);
}

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
