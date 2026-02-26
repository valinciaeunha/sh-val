import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "ScriptHub.id API",
            version: "1.0.0",
            description:
                "ScriptHub.id Backend API — Authentication, Scripts, Hubs, Games, Tags, and Users.",
            contact: {
                name: "ScriptHub.id Team",
            },
        },
        servers: [
            {
                url: "/api",
                description: "API Base",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                // ── User ──
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        username: { type: "string" },
                        email: { type: "string", nullable: true },
                        displayName: { type: "string" },
                        avatarUrl: { type: "string", nullable: true },
                        bio: { type: "string", nullable: true },
                        emailVerified: { type: "boolean" },
                        accountStatus: { type: "string", enum: ["active", "suspended", "banned"] },
                        roles: { type: "array", items: { type: "string" } },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                // ── Script ──
                Script: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        slug: { type: "string" },
                        description: { type: "string" },
                        thumbnailUrl: { type: "string", nullable: true },
                        loaderUrl: { type: "string", nullable: true },
                        hubId: { type: "string", format: "uuid", nullable: true },
                        gameId: { type: "string", format: "uuid", nullable: true },
                        ownerId: { type: "string", format: "uuid" },
                        status: { type: "string", enum: ["draft", "published", "archived"] },
                        views: { type: "integer" },
                        likes: { type: "integer" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                // ── Hub ──
                Hub: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        slug: { type: "string" },
                        description: { type: "string" },
                        bannerUrl: { type: "string", nullable: true },
                        logoUrl: { type: "string", nullable: true },
                        status: { type: "string", enum: ["active", "pending", "rejected"] },
                        ownerId: { type: "string", format: "uuid" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                // ── Game ──
                Game: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        slug: { type: "string" },
                        logoUrl: { type: "string", nullable: true },
                        bannerUrl: { type: "string", nullable: true },
                    },
                },
                // ── Tag ──
                Tag: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                    },
                },
                // ── Generic responses ──
                SuccessResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: true },
                        message: { type: "string" },
                        data: { type: "object" },
                    },
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        error: { type: "string" },
                        message: { type: "string" },
                    },
                },
            },
        },
        tags: [
            { name: "Auth", description: "Authentication & user account" },
            { name: "Scripts", description: "Script management" },
            { name: "Hubs", description: "Hub management" },
            { name: "Games", description: "Game catalogue" },
            { name: "Tags", description: "Tag search & listing" },
            { name: "Users", description: "Public user profiles" },
        ],

        // ── Inline path definitions (no JSDoc annotations needed) ──
        paths: {
            // ────────── AUTH ──────────
            "/auth/register": {
                post: {
                    tags: ["Auth"],
                    summary: "Register a new user",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["username", "email", "password", "displayName"],
                                    properties: {
                                        username: { type: "string", minLength: 3, maxLength: 50 },
                                        email: { type: "string", format: "email" },
                                        password: { type: "string", minLength: 6 },
                                        displayName: { type: "string", minLength: 1, maxLength: 100 },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: "User registered successfully" },
                        400: { description: "Validation error" },
                    },
                },
            },
            "/auth/login": {
                post: {
                    tags: ["Auth"],
                    summary: "Login with username/email and password",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["identifier", "password"],
                                    properties: {
                                        identifier: { type: "string", description: "Username or email" },
                                        password: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Login successful" },
                        401: { description: "Invalid credentials" },
                    },
                },
            },
            "/auth/refresh": {
                post: {
                    tags: ["Auth"],
                    summary: "Refresh access token",
                    requestBody: {
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        refreshToken: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Token refreshed" },
                        401: { description: "Invalid refresh token" },
                    },
                },
            },
            "/auth/logout": {
                post: {
                    tags: ["Auth"],
                    summary: "Logout (revoke refresh token)",
                    responses: { 200: { description: "Logout successful" } },
                },
            },
            "/auth/logout-all": {
                post: {
                    tags: ["Auth"],
                    summary: "Logout from all devices",
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: "Logged out from all devices" } },
                },
            },
            "/auth/me": {
                get: {
                    tags: ["Auth"],
                    summary: "Get current user profile",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: "User profile data" },
                        401: { description: "Unauthorized" },
                    },
                },
                put: {
                    tags: ["Auth"],
                    summary: "Update current user profile",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        displayName: { type: "string" },
                                        bio: { type: "string" },
                                        avatarUrl: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Profile updated" },
                        401: { description: "Unauthorized" },
                    },
                },
            },
            "/auth/me/avatar": {
                post: {
                    tags: ["Auth"],
                    summary: "Upload user avatar",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        avatar: { type: "string", format: "binary" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Avatar uploaded" },
                        400: { description: "No file uploaded" },
                        401: { description: "Unauthorized" },
                    },
                },
            },
            "/auth/change-password": {
                post: {
                    tags: ["Auth"],
                    summary: "Change user password",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["currentPassword", "newPassword"],
                                    properties: {
                                        currentPassword: { type: "string" },
                                        newPassword: { type: "string", minLength: 6 },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Password changed" },
                        401: { description: "Unauthorized" },
                    },
                },
            },
            "/auth/verify": {
                get: {
                    tags: ["Auth"],
                    summary: "Verify JWT token validity",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: "Token is valid" },
                        401: { description: "Invalid token" },
                    },
                },
            },
            "/auth/discord": {
                get: {
                    tags: ["Auth"],
                    summary: "Initiate Discord OAuth flow",
                    responses: {
                        302: { description: "Redirect to Discord" },
                        503: { description: "Discord OAuth not configured" },
                    },
                },
            },
            "/auth/discord/callback": {
                get: {
                    tags: ["Auth"],
                    summary: "Discord OAuth callback",
                    responses: {
                        302: { description: "Redirect to frontend with tokens" },
                    },
                },
            },

            // ────────── SCRIPTS ──────────
            "/scripts": {
                get: {
                    tags: ["Scripts"],
                    summary: "Get all published scripts",
                    responses: { 200: { description: "List of scripts" } },
                },
                post: {
                    tags: ["Scripts"],
                    summary: "Create a new script",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    required: ["title"],
                                    properties: {
                                        title: { type: "string" },
                                        description: { type: "string" },
                                        loaderUrl: { type: "string" },
                                        hubId: { type: "string", format: "uuid" },
                                        gameId: { type: "string", format: "uuid" },
                                        tags: { type: "string", description: "JSON array of tag names" },
                                        thumbnail: { type: "string", format: "binary" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: "Script created" },
                        400: { description: "Validation error" },
                        401: { description: "Unauthorized" },
                    },
                },
            },
            "/scripts/slug/{slug}": {
                get: {
                    tags: ["Scripts"],
                    summary: "Get script by slug",
                    parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
                    responses: { 200: { description: "Script detail" }, 404: { description: "Not found" } },
                },
            },
            "/scripts/me": {
                get: {
                    tags: ["Scripts"],
                    summary: "Get current user's scripts",
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: "List of user's scripts" } },
                },
            },
            "/scripts/{id}": {
                patch: {
                    tags: ["Scripts"],
                    summary: "Update a script",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: {
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        title: { type: "string" },
                                        description: { type: "string" },
                                        loaderUrl: { type: "string" },
                                        hubId: { type: "string" },
                                        gameId: { type: "string" },
                                        tags: { type: "string" },
                                        thumbnail: { type: "string", format: "binary" },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: "Script updated" } },
                },
                delete: {
                    tags: ["Scripts"],
                    summary: "Soft-delete a script",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { 200: { description: "Script deleted" } },
                },
            },
            "/scripts/{id}/view": {
                post: {
                    tags: ["Scripts"],
                    summary: "Record a script view",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { 200: { description: "View recorded" } },
                },
            },
            "/scripts/{id}/like": {
                post: {
                    tags: ["Scripts"],
                    summary: "Toggle like on a script",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { 200: { description: "Like toggled" } },
                },
            },
            "/scripts/{id}/comments": {
                get: {
                    tags: ["Scripts"],
                    summary: "Get comments for a script",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { 200: { description: "List of comments" } },
                },
                post: {
                    tags: ["Scripts"],
                    summary: "Post a comment on a script",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["content"],
                                    properties: {
                                        content: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 201: { description: "Comment posted" } },
                },
            },
            "/scripts/{id}/comments/{commentId}": {
                delete: {
                    tags: ["Scripts"],
                    summary: "Delete a comment",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                        { name: "commentId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                    ],
                    responses: { 200: { description: "Comment deleted" } },
                },
            },

            // ────────── HUBS ──────────
            "/hubs": {
                get: {
                    tags: ["Hubs"],
                    summary: "Get all hubs",
                    responses: { 200: { description: "List of hubs" } },
                },
                post: {
                    tags: ["Hubs"],
                    summary: "Create a new hub",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    required: ["name"],
                                    properties: {
                                        name: { type: "string" },
                                        description: { type: "string" },
                                        banner: { type: "string", format: "binary" },
                                        logo: { type: "string", format: "binary" },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 201: { description: "Hub created" } },
                },
            },
            "/hubs/me": {
                get: {
                    tags: ["Hubs"],
                    summary: "Get current user's hubs",
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: "List of user's hubs" } },
                },
            },
            "/hubs/slug/{slug}": {
                get: {
                    tags: ["Hubs"],
                    summary: "Get hub by slug",
                    parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
                    responses: { 200: { description: "Hub detail" }, 404: { description: "Not found" } },
                },
            },
            "/hubs/{id}": {
                patch: {
                    tags: ["Hubs"],
                    summary: "Update a hub",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: {
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        description: { type: "string" },
                                        banner: { type: "string", format: "binary" },
                                        logo: { type: "string", format: "binary" },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: "Hub updated" } },
                },
            },
            "/hubs/{id}/scripts": {
                get: {
                    tags: ["Hubs"],
                    summary: "Get scripts in a hub (owner only)",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { 200: { description: "List of hub scripts" } },
                },
            },
            "/hubs/{id}/scripts/{scriptId}": {
                post: {
                    tags: ["Hubs"],
                    summary: "Add a script to a hub",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                        { name: "scriptId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                    ],
                    responses: { 200: { description: "Script added to hub" } },
                },
                delete: {
                    tags: ["Hubs"],
                    summary: "Remove a script from a hub",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                        { name: "scriptId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                    ],
                    responses: { 200: { description: "Script removed from hub" } },
                },
            },

            // ────────── GAMES ──────────
            "/games": {
                get: {
                    tags: ["Games"],
                    summary: "Get all games",
                    responses: { 200: { description: "List of games" } },
                },
                post: {
                    tags: ["Games"],
                    summary: "Create a game",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    required: ["name"],
                                    properties: {
                                        name: { type: "string" },
                                        robloxPlaceId: { type: "string" },
                                        logo: { type: "string", format: "binary" },
                                        banner: { type: "string", format: "binary" },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 201: { description: "Game created" } },
                },
            },
            "/games/lookup": {
                get: {
                    tags: ["Games"],
                    summary: "Lookup game by Roblox ID/URL",
                    parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" }, description: "Roblox place ID, URL, or share link" }],
                    responses: { 200: { description: "Game data" } },
                },
            },
            "/games/search": {
                get: {
                    tags: ["Games"],
                    summary: "Search games by name",
                    parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }],
                    responses: { 200: { description: "Search results" } },
                },
            },
            "/games/slug/{slug}": {
                get: {
                    tags: ["Games"],
                    summary: "Get game by slug (with its scripts)",
                    parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
                    responses: { 200: { description: "Game detail" }, 404: { description: "Not found" } },
                },
            },

            // ────────── TAGS ──────────
            "/tags": {
                get: {
                    tags: ["Tags"],
                    summary: "Get all tags",
                    responses: { 200: { description: "List of tags" } },
                },
            },
            "/tags/search": {
                get: {
                    tags: ["Tags"],
                    summary: "Search tags",
                    parameters: [{ name: "q", in: "query", schema: { type: "string" } }],
                    responses: { 200: { description: "Search results" } },
                },
            },

            // ────────── USERS ──────────
            "/users/{username}": {
                get: {
                    tags: ["Users"],
                    summary: "Get user public profile",
                    parameters: [{ name: "username", in: "path", required: true, schema: { type: "string" } }],
                    responses: { 200: { description: "User profile" }, 404: { description: "User not found" } },
                },
            },
            "/users/{username}/scripts": {
                get: {
                    tags: ["Users"],
                    summary: "Get user's published scripts",
                    parameters: [{ name: "username", in: "path", required: true, schema: { type: "string" } }],
                    responses: { 200: { description: "List of scripts" } },
                },
            },
        },
    },
    apis: [], // Not using JSDoc annotations; paths defined inline above
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
