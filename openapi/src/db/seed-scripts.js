/**
 * Seed Script: Generate 300 test scripts
 * Usage: docker exec -i backend-scripthub node src/db/seed-scripts.js
 */

import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'scripthub',
    user: process.env.POSTGRES_USER || 'scripthub_user',
    password: process.env.POSTGRES_PASSWORD,
});

// ─── Script Title Templates ───
const prefixes = [
    '', '🔥 ', '⚡ ', '💎 ', '🎯 ', '✨ ', '🚀 ', '💀 ', '👑 ', '🎮 ', '🔰 ',
    '[NEW] ', '[OP] ', '[FREE] ', '[VIP] ', '[BETA] ', '[V2] ', '[V3] ', '[PRO] ',
];

const scriptNames = [
    'Auto Farm', 'Aimbot', 'ESP Hack', 'Speed Hack', 'Fly Script', 'Teleport',
    'Infinite Jump', 'Noclip', 'God Mode', 'Auto Win', 'Kill Aura', 'Anti AFK',
    'Auto Collect', 'Dupe Script', 'Auto Quest', 'Money Farm', 'XP Farm',
    'Auto Dodge', 'Silent Aim', 'Triggerbot', 'Wallhack', 'Auto Parry',
    'Spin Bot', 'Auto Block', 'Infinite Stamina', 'Auto Combo', 'Auto Skill',
    'Auto Level', 'Auto Rebirth', 'Auto Upgrade', 'Auto Craft', 'Auto Fish',
    'Auto Mine', 'Auto Build', 'Auto Trade', 'Auto Sell', 'Auto Buy',
    'Auto Equip', 'Auto Merge', 'Auto Roll', 'Auto Hatch', 'Auto Pet',
    'Infinite Cash', 'Infinite Gems', 'All Gamepass', 'Unlock All', 'Max Stats',
    'Admin Script', 'Hub Script', 'Executor Bypass', 'Anti Kick', 'Anti Ban',
    'Server Hop', 'Bring All', 'Delete Map', 'Crash Server', 'Lag Switch',
    'Invisible', 'Giant Player', 'Tiny Player', 'Rainbow Effect', 'Trail Effect',
    'GUI Script', 'Mobile Script', 'PC Only', 'Webhook Logger', 'Chat Spammer',
];

const suffixes = [
    '', ' v2', ' v3', ' v4', ' Pro', ' Lite', ' Max', ' Ultra', ' Plus',
    ' - Working!', ' (Undetected)', ' (Patched Fix)', ' [2024]', ' [2025]',
    ' - OP!', ' - Best!', ' - Updated', ' - Mobile', ' - PC',
];

const descriptions = [
    'Very powerful script with many features. Works on all executors.',
    'Updated and working perfectly. No key system needed for basic features.',
    'This script includes auto farm, auto quest, and many more features.',
    'Best script for this game. Regular updates and bug fixes.',
    'Full featured script with GUI. Easy to use for beginners.',
    'Premium quality script. Bypasses anti-cheat detection.',
    'Lightweight script that won\'t lag your game. Optimized for performance.',
    'Complete script hub with 50+ features. Updated weekly.',
    'Simple but effective. Does exactly what you need.',
    'Advanced script with customizable settings. Supports all devices.',
    'Free and open source. No key system, no ads, no BS.',
    'Mobile-friendly script with touch controls. Works on Delta.',
    'Server-side bypass included. Undetectable by most anti-cheats.',
    'Auto-updates when new game patches are released.',
    'Supports multiple games. Universal script hub.',
    'Clean UI with dark mode. Draggable and minimizable.',
    'Built-in FPS unlocker and performance booster.',
    'Competition-ready script. Used by top players.',
    'Beginner friendly with step-by-step instructions included.',
    'Includes webhook notifications for rare drops.',
];

const tags = [
    'auto-farm', 'combat', 'movement', 'utility', 'exploit', 'gui',
    'mobile', 'pc', 'free', 'premium', 'open-source', 'updated',
    'bypassed', 'undetected', 'op', 'hub', 'pvp', 'pve',
    'money', 'xp', 'leveling', 'items', 'pets', 'trading',
    'animation', 'visual', 'speed', 'teleport', 'esp', 'aimbot',
];

const loaderTemplates = [
    'loadstring(game:HttpGet("https://raw.githubusercontent.com/user/repo/main/script.lua"))()',
    'loadstring(game:HttpGet("https://api.scripthub.id/v1/loader/__SLUG__"))()',
    'local a=loadstring(game:HttpGet("https://pastebin.com/raw/abc123"))();a:Run()',
];

// ─── Helpers ───
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickMany = (arr, min, max) => {
    const count = min + Math.floor(Math.random() * (max - min + 1));
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};
const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const generateSlug = () => crypto.randomBytes(4).toString('hex');

// ─── Main Seed ───
async function seed() {
    console.log('🌱 Starting script seed...\n');

    // Fetch existing games
    const gamesResult = await pool.query('SELECT id, name, banner_url FROM games ORDER BY id');
    const games = gamesResult.rows;
    console.log(`📦 Found ${games.length} existing games`);

    if (games.length === 0) {
        console.error('❌ No games found in DB. Add some games first.');
        process.exit(1);
    }

    // Fetch existing users
    const usersResult = await pool.query('SELECT id, username FROM users ORDER BY id LIMIT 10');
    const users = usersResult.rows;
    console.log(`👤 Found ${users.length} existing users`);

    if (users.length === 0) {
        console.error('❌ No users found in DB. Create a user first.');
        process.exit(1);
    }

    // Fetch existing hubs
    const hubsResult = await pool.query("SELECT id, name FROM hubs WHERE status = 'active' ORDER BY id");
    const hubs = hubsResult.rows;
    console.log(`🏠 Found ${hubs.length} active hubs`);

    const TOTAL_SCRIPTS = 300;
    let inserted = 0;
    let errors = 0;

    console.log(`\n🚀 Inserting ${TOTAL_SCRIPTS} scripts...\n`);

    for (let i = 0; i < TOTAL_SCRIPTS; i++) {
        try {
            const game = pick(games);
            const user = pick(users);
            const hub = hubs.length > 0 && Math.random() > 0.3 ? pick(hubs) : null;

            const title = `${pick(prefixes)}${pick(scriptNames)}${pick(suffixes)}`.trim();
            const slug = generateSlug();
            const description = pick(descriptions);
            const status = hub ? 'published' : pick(['published', 'published', 'published', 'draft', 'under_review']);
            const hasKeySystem = Math.random() > 0.7;
            const isPaid = !hasKeySystem && Math.random() > 0.85;
            const loaderUrl = Math.random() > 0.15
                ? pick(loaderTemplates).replace('__SLUG__', slug)
                : null;

            // Use the game's banner as script thumbnail (50% chance), or null
            const thumbnailUrl = game.banner_url && Math.random() > 0.3
                ? game.banner_url
                : null;

            // Random stats (simulate real-world distribution)
            const views = rand(0, 50000);
            const likes = Math.floor(views * (Math.random() * 0.15));
            const copies = Math.floor(views * (Math.random() * 0.3));

            // Random date within the last 6 months
            const daysAgo = rand(0, 180);
            const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
            const updatedAt = new Date(Date.now() - rand(0, daysAgo) * 86400000).toISOString();

            const query = `
                INSERT INTO scripts (
                    title, slug, description, thumbnail_url, loader_url,
                    hub_id, game_id, owner_id, status,
                    has_key_system, key_system_url, is_paid, purchase_url,
                    views, likes, copies, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9,
                    $10, $11, $12, $13,
                    $14, $15, $16, $17, $18
                )
            `;

            const values = [
                title, slug, description, thumbnailUrl, loaderUrl,
                hub?.id || null, game.id, user.id, status,
                hasKeySystem, hasKeySystem ? `https://key.scripthub.id/${slug}` : null,
                isPaid, isPaid ? `https://store.scripthub.id/${slug}` : null,
                views, likes, copies, createdAt, updatedAt,
            ];

            await pool.query(query, values);
            inserted++;

            if (inserted % 50 === 0) {
                console.log(`  ✅ ${inserted}/${TOTAL_SCRIPTS} inserted...`);
            }
        } catch (err) {
            errors++;
            if (errors <= 3) {
                console.error(`  ❌ Error inserting script #${i + 1}:`, err.message);
            }
        }
    }

    // Also insert some script_tags if the table exists
    try {
        const tagTableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'script_tags'
            )
        `);

        if (tagTableCheck.rows[0].exists) {
            console.log('\n🏷️  Adding tags to scripts...');
            const scripts = await pool.query('SELECT id FROM scripts ORDER BY created_at DESC LIMIT $1', [TOTAL_SCRIPTS]);

            let tagCount = 0;
            for (const script of scripts.rows) {
                const scriptTags = pickMany(tags, 1, 4);
                for (const tag of scriptTags) {
                    try {
                        await pool.query(
                            'INSERT INTO script_tags (script_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [script.id, tag]
                        );
                        tagCount++;
                    } catch { /* skip duplicates */ }
                }
            }
            console.log(`  ✅ Added ${tagCount} tags`);
        }
    } catch (err) {
        console.log('\n⚠️  Skipping tags (table might not exist):', err.message);
    }

    console.log(`\n────────────────────────────────`);
    console.log(`🎉 Seed complete!`);
    console.log(`   ✅ Inserted: ${inserted}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`────────────────────────────────\n`);

    await pool.end();
    process.exit(0);
}

seed().catch((err) => {
    console.error('💥 Fatal seed error:', err);
    process.exit(1);
});
