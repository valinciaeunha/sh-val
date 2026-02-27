import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
    user: 'scripthub',
    host: 'localhost',
    database: 'scripthub',
    password: 'password123',
    port: 5432,
});

async function run() {
    const res = await pool.query('SELECT owner_id FROM scripts WHERE slug = $1', ['test-script']);
    console.log("Script Owner:", res.rows[0]);

    const keys = await pool.query('SELECT key_value, script_id, owner_id, type, status FROM license_keys ORDER BY created_at DESC LIMIT 5');
    console.log("Recent Keys:", keys.rows);

    const testUser = await pool.query('SELECT id, username FROM users WHERE username = $1', ['valincia']);
    console.log("User:", testUser.rows[0]);

    process.exit(0);
}
run();
