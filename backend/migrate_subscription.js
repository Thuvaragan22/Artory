require("dotenv").config();
const db = require("./src/config/db");

/**
 * Migration: Add subscription columns to users table.
 * Run once: node migrate_subscription.js
 */
const migrations = [
    // Add plan_type column (matches Free/Trial/Premium plans)
    "ALTER TABLE users ADD COLUMN plan_type ENUM('free','trial','premium') NOT NULL DEFAULT 'free'",
    // Add subscription lifecycle columns
    "ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) NOT NULL DEFAULT 'inactive'",
    "ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) NULL",
    "ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255) NULL",
    "ALTER TABLE users ADD COLUMN current_period_start DATETIME NULL",
    "ALTER TABLE users ADD COLUMN current_period_end DATETIME NULL",

    // Sync existing subscription_plan_id=1 users to plan_type='free'
    "UPDATE users SET plan_type = 'free' WHERE subscription_plan_id = 1 OR subscription_plan_id IS NULL",
    "UPDATE users SET plan_type = 'trial' WHERE subscription_plan_id = 2",
    "UPDATE users SET plan_type = 'premium' WHERE subscription_plan_id = 3",
];

async function run() {
    console.log("Running subscription migrations...");
    for (const sql of migrations) {
        try {
            await db.query(sql);
            console.log("✅ OK:", sql.substring(0, 60) + "...");
        } catch (err) {
            if (
                err.message.includes("Duplicate column name") ||
                err.message.includes("already exists")
            ) {
                console.log("⏭️  Skipped (already exists):", sql.substring(0, 60) + "...");
            } else {
                console.error("❌ Failed:", err.message);
            }
        }
    }
    console.log("\nMigration complete.");
    process.exit(0);
}

run();
