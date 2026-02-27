import express from "express";
import { initBackupScheduler } from "./modules/backup/backup.service.js";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import passport from "passport";
import config from "./config/index.js";
import { healthCheck as dbHealthCheck, closePool } from "./db/postgres.js";
import redisClient, { healthCheck as redisHealthCheck, closeRedis } from "./db/redis.js";
import apiRoutes from "./routes/index.js";
import { initializeDiscordStrategy } from "./config/passport/discord.strategy.js";
import { serveDeployment } from "./modules/deployments/deployments.controller.js";
import logger, { stream } from "./utils/logger.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

const app = express();

// ============================================
// Proxy Configuration
// ============================================
app.set("trust proxy", 1);

// ============================================
// Security Middleware
// ============================================
app.use(
  helmet({
    contentSecurityPolicy: config.isProduction,
    crossOriginEmbedderPolicy: config.isProduction,
  }),
);

// ============================================
// CORS Configuration
// ============================================
app.use(
  cors({
    origin: config.security.corsOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// ============================================
// Body Parsing Middleware
// ============================================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(compression());

// ============================================
// Rate Limiting
// ============================================

// Global limiter - generous for read-heavy endpoints (GET requests to /api/*)
const globalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "rl:global:",
  }),
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.max, // 500 per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "TooManyRequests",
    statusCode: 429,
    message: "Too many requests, please try again later.",
  },
  handler: (req, res, next, options) => {
    if (req.path.includes('/discord/callback')) {
      return res.redirect(`${config.frontendUrl}/auth/callback?error=TooManyRequests`);
    }
    res.status(options.statusCode).json(options.message);
  }
});

// Strict limiter for auth endpoints (login, register, token refresh)
const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "rl:auth:",
  }),
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max, // 30 per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "TooManyRequests",
    statusCode: 429,
    message: "Too many authentication attempts, please try again later.",
  },
  handler: (req, res, next, options) => {
    if (req.path.includes('/discord/callback')) {
      return res.redirect(`${config.frontendUrl}/auth/callback?error=TooManyRequests`);
    }
    res.status(options.statusCode).json(options.message);
  }
});

// Write limiter for mutations (POST/PATCH/DELETE on non-auth routes)
const writeLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "rl:write:",
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS',
  message: {
    error: "TooManyRequests",
    statusCode: 429,
    message: "Too many write requests, please try again later.",
  },
});

app.use("/api", globalLimiter);
app.use("/api", writeLimiter);
app.use("/api/auth", authLimiter);

// ============================================
// Logging Middleware
// ============================================
app.use(morgan(config.isDevelopment ? "dev" : "combined", { stream }));

// ============================================
// Passport Initialization
// ============================================
app.use(passport.initialize());

// Initialize OAuth strategies
initializeDiscordStrategy();

// ============================================
// Health Check Endpoint
// ============================================
app.get("/health", async (req, res) => {
  try {
    const [dbStatus, redisStatus] = await Promise.all([
      dbHealthCheck(),
      redisHealthCheck(),
    ]);

    const allHealthy =
      dbStatus.status === "connected" && redisStatus.status === "connected";

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      environment: config.env,
      uptime: process.uptime(),
      services: {
        api: "running",
        database: dbStatus,
        redis: redisStatus,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// ============================================
// API Routes
// ============================================
app.get("/", (req, res) => {
  res.json({
    name: "ScriptHub.id API",
    version: "1.0.0",
    status: "running",
    documentation: "/api/docs",
    health: "/health",
  });
});

// ============================================
// API Status Endpoint
// ============================================
app.get("/api/status", (req, res) => {
  res.json({
    status: "operational",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Swagger API Docs (disabled in production)
// ============================================
if (process.env.NODE_ENV !== 'production') {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ScriptHub.id API Docs',
  }));
  app.get("/docs/json", (req, res) => res.json(swaggerSpec));
}

// ============================================
// Public CDN Proxy Route (no auth required)
// ============================================
app.get("/v1/:deployKey", serveDeployment);

// ============================================
// Mount API Routes
// ============================================
app.use("/api", apiRoutes);

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
    path: req.path,
  });
});

// ============================================
// Global Error Handler
// ============================================
app.use((err, req, res, next) => {
  logger.error("Error: %o", err);

  const statusCode = err.statusCode || 500;
  const message =
    config.isProduction && statusCode === 500
      ? "Internal Server Error"
      : err.message || "Something went wrong";

  res.status(statusCode).json({
    error: err.name || "Error",
    message,
    ...(config.isDevelopment && { stack: err.stack }),
  });
});

// ============================================
// Start Server
// ============================================
const PORT = config.port;

app.listen(PORT, () => {
  logger.info("");
  logger.info("🚀 ScriptHub.id Backend API");
  logger.info("================================");
  logger.info(`📡 Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${config.env}`);
  logger.info(`🔗 API URL: ${config.apiUrl}`);
  logger.info(`💚 Health check: ${config.apiUrl}/health`);
  logger.info("================================");
  logger.info("");

  // Initialize daily database backup scheduler
  initBackupScheduler();
});

// ============================================
// Graceful Shutdown
// ============================================
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Close database connections
    await closePool();
    await closeRedis();

    logger.info("✅ All connections closed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Error during shutdown: %o", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
