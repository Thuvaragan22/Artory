require('dotenv').config();
const db = require('./config/db.js');

async function check() {
    try {
        const [rows] = await db.query(`DESCRIBE course_enrollments`);
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
