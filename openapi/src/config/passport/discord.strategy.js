import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { v4 as uuidv4 } from 'uuid';
import config from '../index.js';
import { query, transaction } from '../../db/postgres.js';
import { generateTokens } from '../../utils/jwt.js';
import { storeRefreshToken } from '../../db/redis.js';

// ============================================
// Discord OAuth Strategy
// ============================================

/**
 * Find or create user from Discord profile
 */
const findOrCreateDiscordUser = async (profile, accessToken, refreshToken) => {
  try {
    return await transaction(async (client) => {
      // Check if Discord account is already linked
      const providerResult = await client.query(
        `
        SELECT user_id FROM auth_providers
        WHERE provider = 'discord' AND provider_user_id = $1
        `,
        [profile.id]
      );

      let userId;

      if (providerResult.rows.length > 0) {
        // User exists, update tokens
        userId = providerResult.rows[0].user_id;

        await client.query(
          `
          UPDATE auth_providers
          SET access_token = $1,
              refresh_token = $2,
              token_expires_at = NOW() + INTERVAL '7 days',
              provider_data = $3,
              updated_at = NOW()
          WHERE provider = 'discord' AND provider_user_id = $4
          `,
          [
            accessToken,
            refreshToken,
            JSON.stringify({
              username: profile.username,
              discriminator: profile.discriminator,
              avatar: profile.avatar,
              banner: profile.banner,
              locale: profile.locale,
              verified: profile.verified,
            }),
            profile.id,
          ]
        );
      } else {
        // New Discord user, check if email is already registered
        if (profile.email) {
          const emailResult = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [profile.email]
          );

          if (emailResult.rows.length > 0) {
            // Email exists, link Discord to existing account
            userId = emailResult.rows[0].id;
          }
        }

        // Create new user if no existing user found
        if (!userId) {
          userId = uuidv4();

          // Generate unique username from Discord username
          let username = profile.username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
          let usernameCounter = 1;
          let finalUsername = username;

          // Check username uniqueness
          while (true) {
            const usernameCheck = await client.query(
              'SELECT id FROM users WHERE username = $1',
              [finalUsername]
            );

            if (usernameCheck.rows.length === 0) break;

            finalUsername = `${username}${usernameCounter}`;
            usernameCounter++;
          }

          // Create user
          await client.query(
            `
            INSERT INTO users (
              id, username, email, display_name, avatar_url,
              email_verified, account_status
            ) VALUES ($1, $2, $3, $4, $5, $6, 'active')
            `,
            [
              userId,
              finalUsername,
              profile.email || null,
              profile.username,
              profile.avatar
                ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                : null,
              profile.verified || false,
            ]
          );

          // Assign default "user" role
          const roleResult = await client.query(
            "SELECT id FROM roles WHERE name = 'user'"
          );

          if (roleResult.rows.length > 0) {
            await client.query(
              'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
              [userId, roleResult.rows[0].id]
            );
          }
        }

        // Create auth provider entry
        await client.query(
          `
          INSERT INTO auth_providers (
            id, user_id, provider, provider_user_id,
            access_token, refresh_token, token_expires_at,
            provider_data
          ) VALUES ($1, $2, 'discord', $3, $4, $5, NOW() + INTERVAL '7 days', $6)
          `,
          [
            uuidv4(),
            userId,
            profile.id,
            accessToken,
            refreshToken,
            JSON.stringify({
              username: profile.username,
              discriminator: profile.discriminator,
              avatar: profile.avatar,
              banner: profile.banner,
              locale: profile.locale,
              verified: profile.verified,
            }),
          ]
        );
      }

      // Get complete user data
      const userResult = await client.query(
        `
        SELECT
          u.id, u.username, u.email, u.display_name, u.avatar_url,
          u.bio, u.account_status, u.email_verified
        FROM users u
        WHERE u.id = $1
        `,
        [userId]
      );

      const user = userResult.rows[0];

      // Load roles
      const rolesResult = await client.query(
        `
        SELECT DISTINCT r.name
        FROM roles r
        INNER JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = $1
        `,
        [userId]
      );

      // Load permissions
      const permissionsResult = await client.query(
        `
        SELECT DISTINCT p.name
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        INNER JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = $1
        `,
        [userId]
      );

      // Update last login
      await client.query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [userId]
      );

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        accountStatus: user.account_status,
        emailVerified: user.email_verified,
        roles: rolesResult.rows.map((row) => row.name),
        permissions: permissionsResult.rows.map((row) => row.name),
      };
    });
  } catch (error) {
    console.error('Discord user creation/lookup error:', error);
    throw error;
  }
};

/**
 * Initialize Discord Strategy
 */
export const initializeDiscordStrategy = () => {
  if (!config.discord.clientId || !config.discord.clientSecret) {
    console.warn('⚠️  Discord OAuth not configured. Skipping Discord strategy.');
    return;
  }

  passport.use(
    new DiscordStrategy(
      {
        clientID: config.discord.clientId,
        clientSecret: config.discord.clientSecret,
        callbackURL: config.discord.callbackUrl,
        scope: config.discord.scope,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateDiscordUser(
            profile,
            accessToken,
            refreshToken
          );

          // Generate JWT tokens
          const tokens = generateTokens({
            id: user.id,
            username: user.username,
            email: user.email,
            roles: user.roles,
            permissions: user.permissions,
          });

          // Store refresh token in Redis
          await storeRefreshToken(user.id, tokens.refreshToken, 30 * 24 * 60 * 60);

          // Attach tokens to user object
          user.tokens = tokens;

          done(null, user);
        } catch (error) {
          console.error('Discord authentication error:', error);
          done(error, null);
        }
      }
    )
  );

  console.log('✅ Discord OAuth strategy initialized');
};

export default initializeDiscordStrategy;
