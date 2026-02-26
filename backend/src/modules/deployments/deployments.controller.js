import * as deploymentsService from "./deployments.service.js";
import * as plansService from "../plans/plans.service.js";
import { body, validationResult } from "express-validator";
import logger from "../../utils/logger.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../../config/s3.js";
import config from "../../config/index.js";

/**
 * Validation rules for creating/updating a deployment
 */
export const deploymentValidation = [
    body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 255 }).withMessage("Title must be under 255 characters"),
    body("content").notEmpty().withMessage("Content is required"),
];

/**
 * List user's deployments (paginated)
 * GET /api/deployments/me
 */
export async function getMyDeployments(req, res) {
    try {
        const { page = 1, limit = 20, search = "" } = req.query;
        const data = await deploymentsService.getMyDeployments(req.user.userId, {
            page: parseInt(page, 10),
            limit: Math.min(parseInt(limit, 10) || 20, 100),
            search,
        }); res.json({ success: true, data });
    } catch (error) {
        logger.error("Get Deployments Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch deployments" });
    }
}

/**
 * Get deployment stats
 * GET /api/deployments/stats
 */
export async function getDeploymentStats(req, res) {
    try {
        const stats = await deploymentsService.getStats(req.user.userId);
        res.json({ success: true, data: stats });
    } catch (error) {
        logger.error("Get Deployment Stats Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch deployment stats" });
    }
}

/**
 * Get a single deployment with its content from S3
 * GET /api/deployments/:id
 */
export async function getDeploymentById(req, res) {
    try {
        const deployment = await deploymentsService.getById(req.params.id, req.user.userId);
        if (!deployment) {
            return res.status(404).json({ error: "NotFound", message: "Deployment not found" });
        }

        // Fetch content from S3
        let content = "";
        try {
            content = await deploymentsService.getContent(deployment.s3_key);
        } catch (err) {
            logger.warn("Failed to fetch S3 content for deployment %s: %o", req.params.id, err);
        }

        res.json({ success: true, data: { ...deployment, content } });
    } catch (error) {
        logger.error("Get Deployment Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to fetch deployment" });
    }
}

/**
 * Create a new deployment
 * POST /api/deployments
 */
export async function createDeployment(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: "ValidationError", details: errors.array() });
        }

        // Check quota
        const currentCount = await deploymentsService.countByUser(req.user.userId);
        const { maximums } = await plansService.getUserPlanWithMaximums(req.user.userId);
        const maxDeployments = maximums?.maximum_deployments || 3;

        if (currentCount >= maxDeployments) {
            return res.status(403).json({
                error: "QuotaExceeded",
                message: `You have reached your deployment limit (${maxDeployments}). Upgrade your plan for more.`,
            });
        }

        const { title, content } = req.body;
        const deployment = await deploymentsService.create(req.user.userId, { title, content });

        res.status(201).json({ success: true, data: deployment });
    } catch (error) {
        logger.error("Create Deployment Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to create deployment" });
    }
}

/**
 * Update a deployment
 * PUT /api/deployments/:id
 */
export async function updateDeployment(req, res) {
    try {
        const { title, content } = req.body;
        const deployment = await deploymentsService.update(req.params.id, req.user.userId, { title, content });

        if (!deployment) {
            return res.status(404).json({ error: "NotFound", message: "Deployment not found" });
        }

        res.json({ success: true, data: deployment });
    } catch (error) {
        logger.error("Update Deployment Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to update deployment" });
    }
}

/**
 * Delete a deployment
 * DELETE /api/deployments/:id
 */
export async function deleteDeployment(req, res) {
    try {
        const deleted = await deploymentsService.remove(req.params.id, req.user.userId);
        if (!deleted) {
            return res.status(404).json({ error: "NotFound", message: "Deployment not found" });
        }

        res.json({ success: true, message: "Deployment deleted" });
    } catch (error) {
        logger.error("Delete Deployment Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to delete deployment" });
    }
}

/**
 * Middleware to check quota before file upload
 */
export async function checkDeploymentQuota(req, res, next) {
    try {
        const currentCount = await deploymentsService.countByUser(req.user.userId);
        const { maximums } = await plansService.getUserPlanWithMaximums(req.user.userId);
        const maxDeployments = maximums?.maximum_deployments || 3;

        if (currentCount >= maxDeployments) {
            return res.status(403).json({
                error: "QuotaExceeded",
                message: `You have reached your deployment limit (${maxDeployments}). Upgrade your plan for more.`,
            });
        }
        next();
    } catch (error) {
        logger.error("Check Quota Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to check quota" });
    }
}

/**
 * Upload a physical file as a deployment
 * POST /api/deployments/upload
 */
export async function uploadDeployment(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "ValidationError", message: "No file uploaded" });
        }

        // Title from form data, fallback to original filename
        const title = req.body.title || req.file.originalname;

        const deployment = await deploymentsService.createFromUpload(req.user.userId, {
            title,
            file: req.file
        });

        res.status(201).json({ success: true, data: deployment });
    } catch (error) {
        logger.error("Upload Deployment Error: %o", error);
        res.status(500).json({ error: "ServerError", message: "Failed to upload deployment" });
    }
}

/**
 * Public CDN proxy endpoint
 * GET /v1/:deployKey  — no auth required
 * Detects browser vs executor. Browsers get a blocker page.
 * Executors get redirected to the public CDN URL.
 */
export async function serveDeployment(req, res) {
    const { deployKey } = req.params;

    try {
        const deployment = await deploymentsService.getByDeployKey(deployKey);

        if (!deployment) {
            return res.status(404).send("Deployment not found or inactive.");
        }

        // Detect if the request is from a browser
        const ua = (req.headers["user-agent"] || "").toLowerCase();
        const isBrowser = ua.includes("mozilla") || ua.includes("chrome") || ua.includes("safari") ||
            ua.includes("firefox") || ua.includes("edge") || ua.includes("opera") ||
            ua.includes("msie") || ua.includes("trident");

        if (isBrowser) {
            // Build the full public URL for the loadstring
            const protocol = req.headers['x-forwarded-proto'] || req.protocol;
            const host = req.headers['x-forwarded-host'] || req.headers['host'];
            const scriptUrl = `${protocol}://${host}/v1/${deployKey}`;

            // Serve a blocker page for browsers
            return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ScriptHub — Protected Script</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            min-height: 100vh;
            background: #0a0c10;
            color: #e2e4e9;
            font-family: 'Inter', -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .bg-grid {
            position: fixed; inset: 0; z-index: 0;
            background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0);
            background-size: 32px 32px;
        }
        .glow {
            position: fixed; top: -40%; left: 50%; transform: translateX(-50%);
            width: 600px; height: 600px; border-radius: 50%;
            background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%);
            z-index: 0; pointer-events: none;
        }
        .container {
            position: relative; z-index: 1;
            max-width: 560px; width: 90%; text-align: center;
            animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .shield {
            width: 72px; height: 72px; margin: 0 auto 20px;
            background: rgba(16,185,129,0.08);
            border: 1px solid rgba(16,185,129,0.15);
            border-radius: 18px; display: flex; align-items: center; justify-content: center;
            font-size: 32px;
            animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.1); } 50% { box-shadow: 0 0 0 12px rgba(16,185,129,0); } }
        h1 { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px; }
        .subtitle { font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 24px; }
        .code-block {
            position: relative;
            background: rgba(0,0,0,0.4);
            border: 1px solid rgba(16,185,129,0.12);
            border-radius: 10px; padding: 16px 48px 16px 16px;
            text-align: left; margin-bottom: 20px;
            overflow-x: auto;
        }
        .code-block code {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px; line-height: 1.6;
            color: #d1d5db; white-space: pre-wrap; word-break: break-all;
        }
        .code-block .kw { color: #c084fc; }
        .code-block .fn { color: #60a5fa; }
        .code-block .str { color: #34d399; }
        .copy-btn {
            position: absolute; top: 10px; right: 10px;
            background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
            border-radius: 6px; padding: 6px 8px; cursor: pointer;
            color: #6b7280; font-size: 14px;
            transition: all 0.2s;
        }
        .copy-btn:hover { background: rgba(16,185,129,0.2); color: #10b981; }
        .copy-btn.copied { color: #10b981; }
        .label { font-size: 11px; color: #4b5563; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; text-align: left; }
        .footer { margin-top: 24px; font-size: 11px; color: #374151; font-family: 'JetBrains Mono', monospace; }
        .footer a { color: #4b5563; text-decoration: none; }
        .footer a:hover { color: #10b981; }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="glow"></div>
    <div class="container">
        <div class="shield"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4" stroke-opacity="0.7"/></svg></div>
        <h1>Protected Script</h1>
        <p class="subtitle">This script is protected by ScriptHub and can only<br>be executed through a Roblox executor.</p>
        <p class="label">Loadstring</p>
        <div class="code-block">
            <code><span class="fn">loadstring</span>(<span class="fn">game</span>:<span class="fn">HttpGet</span>(<span class="str">"${scriptUrl}"</span>))()</code>
            <button class="copy-btn" onclick="copyCode()" id="copyBtn" title="Copy to clipboard"><svg id="copyIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button>
        </div>
        <div class="footer">
            Powered by <a href="https://scripthub.id">scripthub.id</a>
        </div>
    </div>
    <script>
        function copyCode() {
            const code = 'loadstring(game:HttpGet("${scriptUrl}"))()';
            navigator.clipboard.writeText(code).then(() => {
                const btn = document.getElementById('copyBtn');
                btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
                btn.classList.add('copied');
                setTimeout(() => { btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>'; btn.classList.remove('copied'); }, 2000);
            });
        }
    </script>
</body>
</html>`);
        }

        // Non-browser (executor) — serve the actual script
        // Increment counter fire-and-forget (don't await to keep response fast)
        deploymentsService.incrementCdnRequests(deployKey).catch((err) =>
            logger.warn("Failed to increment cdn_requests for %s: %o", deployKey, err)
        );

        // Redirect to the public Cloudflare CDN URL
        const publicCdnUrl = `https://${config.s3.bucketScripts}/${deployment.s3_key}`;
        res.redirect(302, publicCdnUrl);
    } catch (error) {
        logger.error("Serve Deployment Error: %o", error);
        res.status(500).send("Internal server error");
    }
}
