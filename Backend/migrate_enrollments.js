require('dotenv').config();
const db = require('./config/db.js');

async function migrate() {
    try {
        console.log("Starting migration: Adding learner details to course_enrollments...");

        await db.query(`ALTER TABLE course_enrollments 
            ADD COLUMN full_name VARCHAR(100) NULL AFTER learner_id,
            ADD COLUMN email VARCHAR(255) NULL AFTER full_name,
            ADD COLUMN phone VARCHAR(50) NULL AFTER email,
            ADD COLUMN age_dob VARCHAR(50) NULL AFTER phone,
            ADD COLUMN gender VARCHAR(20) NULL AFTER age_dob,
            ADD COLUMN location VARCHAR(255) NULL AFTER gender;
        `);

        console.log("Migration successful!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
