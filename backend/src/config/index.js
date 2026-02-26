import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Server
  port: parseInt(process.env.API_PORT || '3001', 10),
  apiUrl: process.env.API_URL || 'http://localhost:3001',

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  appUrl: process.env.APP_URL || 'http://localhost:3000',

  // Database
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'scripthub',
    user: process.env.POSTGRES_USER || 'scripthub_user',
    password: process.env.POSTGRES_PASSWORD,
    url: process.env.DATABASE_URL,
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    url: process.env.REDIS_URL,
    db: 0,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-this',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: 'scripthub.id',
    audience: 'scripthub.id',
  },

  // OAuth - Discord
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3001/api/auth/discord/callback',
    botToken: process.env.DISCORD_BOT_TOKEN,
    guildId: process.env.DISCORD_GUILD_ID,
    scope: ['identify', 'email', 'guilds.join'],
  },

  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@scripthub.id',
    replyTo: process.env.EMAIL_REPLY_TO || 'support@scripthub.id',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-this',
    corsOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://scripthub.id',
      'https://www.scripthub.id',
      ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [])
    ],
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    auth: {
      windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW || '15', 10) * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5', 10),
    },
    api: {
      windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW || '15', 10) * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_API_MAX || '100', 10),
    },
  },

  // S3 Storage
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    bucketImages: process.env.S3_BUCKET_IMAGES || process.env.S3_BUCKET_NAME || 'scripthub',
    bucketScripts: process.env.S3_BUCKET_SCRIPTS || 'v1.scripthub.id',
    region: process.env.S3_REGION || 'us-east-1',
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'text/plain',
      'application/json',
    ],
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
    maxFiles: '14d',
    maxSize: '20m',
  },

  // Feature Flags
  features: {
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    discordLogin: process.env.ENABLE_DISCORD_LOGIN === 'true',
    registration: process.env.ENABLE_REGISTRATION === 'true',
  },

  // Session
  session: {
    name: 'scripthub.sid',
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    },
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
};

// Validate required configuration
const validateConfig = () => {
  const required = [];

  if (!config.database.password) {
    required.push('POSTGRES_PASSWORD');
  }

  if (!config.redis.password && config.isProduction) {
    required.push('REDIS_PASSWORD');
  }

  if (config.jwt.secret === 'your-secret-key-change-this' && config.isProduction) {
    required.push('JWT_SECRET');
  }

  if (config.jwt.refreshSecret === 'your-refresh-secret-change-this' && config.isProduction) {
    required.push('JWT_REFRESH_SECRET');
  }

  if (config.features.discordLogin && (!config.discord.clientId || !config.discord.clientSecret)) {
    required.push('DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET');
  }

  if (required.length > 0) {
    console.error('❌ Missing required environment variables:', required.join(', '));
    if (config.isProduction) {
      process.exit(1);
    }
  }
};

// Run validation
validateConfig();

export default config;
