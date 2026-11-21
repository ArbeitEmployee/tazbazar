const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const path = require("path");
const { modules } = require("./modules");
const authController = require("./modules/auth/controller");
const errorHandler = require("./middlewares/errorHandler");
const {
  singleStoreResponseSanitizer,
} = require("./middlewares/singleStoreResponseSanitizer");

const app = express();
const isProduction = process.env.NODE_ENV === "production";
app.disable("x-powered-by");

const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

const normalizeOrigin = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "");

const isAllowedLocalDevOrigin = (origin) => {
  if (!origin) return false;

  try {
    const parsed = new URL(origin);
    return LOCAL_DEV_HOSTS.has(parsed.hostname);
  } catch (_error) {
    return false;
  }
};

const isAllowedVercelOrigin = (origin) => {
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    return parsed.hostname.endsWith(".vercel.app");
  } catch (_error) {
    return false;
  }
};

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    "https://tazbazar.com",
    "https://www.tazbazar.com",
    "http://tazbazar.com",
    "http://www.tazbazar.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ]
    .map(normalizeOrigin)
    .filter(Boolean),
);

const isAllowedSubdomain = (origin) => {
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    return parsed.hostname === "tazbazar.com" || parsed.hostname.endsWith(".tazbazar.com");
  } catch (_error) {
    return false;
  }
};

const resolveCorsOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);

  if (!normalizedOrigin) {
    return null;
  }

  if (
    allowedOrigins.has(normalizedOrigin) ||
    isAllowedLocalDevOrigin(normalizedOrigin) ||
    isAllowedVercelOrigin(normalizedOrigin) ||
    isAllowedSubdomain(normalizedOrigin)
  ) {
    return normalizedOrigin;
  }

  return null;
};

const GATEWAY_CALLBACK_PATH_PATTERN =
  /^\/api\/orders\/payments\/[^/]+\/callback$/i;

const baseCorsOptions = {
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "Pragma",
    "Expires",
  ],
};

const corsOptionsDelegate = (req, callback) => {
  if (GATEWAY_CALLBACK_PATH_PATTERN.test(String(req.path || "").trim())) {
    callback(null, {
      ...baseCorsOptions,
      origin: true,
    });
    return;
  }

  callback(null, {
    ...baseCorsOptions,
    origin(origin, next) {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return next(null, true);

      const resolvedOrigin = resolveCorsOrigin(origin);

      if (resolvedOrigin) {
        next(null, true);
      } else {
        console.log(`CORS blocked for origin: ${origin}`);
        next(new Error("Not allowed by CORS"));
      }
    },
  });
};

// Security middleware
app.use(helmet());
app.use(cors(corsOptionsDelegate)); // Use configured CORS options
if (!isProduction) {
  app.use(morgan("dev"));
}
app.use(
  compression({
    threshold: 1024,
    filter: (req, res) => {
      // Do not compress Server-Sent Events (SSE) or streaming endpoints to avoid buffering and UI hang
      if (req.headers.accept === "text/event-stream" || req.path?.includes("/stream")) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(singleStoreResponseSanitizer);

// Admin & authenticated API anti-caching middleware
// Guarantees all admin/authenticated requests bypass any browser, proxy, CDN, or Cloudflare caches
app.use("/api", (req, res, next) => {
  const isAuthRequest = Boolean(req.headers.authorization);
  const isAdminPath = req.path.includes("/admin") || req.originalUrl.includes("/admin");

  if (isAuthRequest || isAdminPath) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");
  }
  next();
});

// Serve uploaded files
app.use(
  "/uploads/products",
  express.static(path.join(__dirname, "..", "uploads/products"), {
    maxAge: isProduction ? "7d" : 0,
  }),
  (req, res, next) => {
    const requestOrigin = resolveCorsOrigin(req.headers.origin);
    if (requestOrigin) {
      res.setHeader("Access-Control-Allow-Origin", requestOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Vary", "Origin");
    }
    next();
  },
);

// Also serve under /api/uploads for API consistency
app.use(
  "/api/uploads",
  express.static(path.join(__dirname, "..", "uploads"), {
    maxAge: isProduction ? "7d" : 0,
  }),
  (req, res, next) => {
    const requestOrigin = resolveCorsOrigin(req.headers.origin);
    if (requestOrigin) {
      res.setHeader("Access-Control-Allow-Origin", requestOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Vary", "Origin");
    }
    next();
  },
);

// Add this static file serving for banner uploads (add with other static file serving)
app.use(
  "/uploads/banners",
  express.static(path.join(__dirname, "..", "uploads/banners"), {
    maxAge: isProduction ? "7d" : 0,
  }),
  (req, res, next) => {
    const requestOrigin = resolveCorsOrigin(req.headers.origin);
    if (requestOrigin) {
      res.setHeader("Access-Control-Allow-Origin", requestOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Vary", "Origin");
    }
    next();
  },
);

// Routes - auto-mounted from the module registry
app.get("/sitemap.xml", authController.getPublicSitemapXml);
app.get("/robots.txt", authController.getPublicRobotsTxt);
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
for (const moduleDef of modules) {
  app.use(moduleDef.path, moduleDef.routes);
}
// Simple welcome route for direct backend access
app.get("/", (req, res) => {
  res.status(200).send("Welcome to backend");
});
// Error handling middleware
app.use(errorHandler);

module.exports = app;
