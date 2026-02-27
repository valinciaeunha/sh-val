import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import config from "./config/index.js";
import { healthCheck as dbHealthCheck, closePool } from "./db/postgres.js";
import redisClient, { healthCheck as redisHealthCheck, closeRedis } from "./db/redis.js";
import logger, { stream } from "./utils/logger.js";
import keysRoutes from "./modules/keys/keys.routes.js";

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
        origin: "*", // allow all for public Open API
        credentials: true,
        optionsSuccessStatus: 200,
    }),
);

// ============================================
// Body Parsing Middleware
// ============================================
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(compression());

// ============================================
// Rate Limiting
// ============================================

// Global limiter
const globalLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: "rl:openapi:global:",
    }),
    windowMs: config.rateLimit.api.windowMs,
    max: config.rateLimit.api.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "TooManyRequests",
        statusCode: 429,
        message: "Too many requests, please try again later.",
    }
});

// ============================================
// Request Logging
// ============================================
if (!config.isTest) {
    app.use(morgan("combined", { stream }));
}


// ============================================
// API Routes
// ============================================

app.use(globalLimiter);

// Health check
app.get("/ping", (req, res) => {
    res.json({
        success: true,
        service: "scripthub-openapi",
        message: "API is running",
        timestamp: new Date().toISOString(),
    });
});

// Open API Routes
app.use("/api/v2/keys", keysRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: "NotFound",
        message: "OpenAPI endpoint not found",
        path: req.path,
    });
});

// ============================================
// Error Handling Middleware
// ============================================
app.use((err, req, res, next) => {
    logger.error(
        `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
    );
    if (err.stack) {
        logger.error(err.stack);
    }

    // Handle specific errors...
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            error: "BadRequest",
            message: "Invalid JSON payload format",
        });
    }

    const statusCode = err.statusCode || err.status || 500;
    const errorResponse = {
        error: err.name || "ServerError",
        message: statusCode === 500 && config.isProduction ? "Internal server error" : err.message,
    };

    if (!config.isProduction && err.stack) {
        errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
});

// ============================================
// Server Initialization
// ============================================
const PORT = 4001;
const server = app.listen(PORT, async () => {
    logger.info(`🚀 OpenAPI Server running on port ${PORT} in ${config.nodeEnv} mode`);

    // Verify Database Connections
    try {
        const dbStatus = await dbHealthCheck();
        logger.info(`PostgreSQL Connection: ${dbStatus ? '✅ UP' : '❌ DOWN'}`);

        const redisStatus = await redisHealthCheck();
        logger.info(`Redis Connection: ${redisStatus ? '✅ UP' : '❌ DOWN'}`);
    } catch (e) {
        logger.error(`Database connection check failed: ${e.message}`);
    }
});

// ============================================
// Graceful Shutdown
// ============================================
const gracefulShutdown = async (signal) => {
    logger.info(`\n${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
        logger.info("HTTP server closed.");
        try {
            if (redisClient) {
                await closeRedis();
            }
            await closePool();

            logger.info("Graceful shutdown complete. Exiting process.");
            process.exit(0);
        } catch (err) {
            logger.error(`Error during shutdown: ${err.message}`);
            process.exit(1);
        }
    });

    setTimeout(() => {
        logger.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
    }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
