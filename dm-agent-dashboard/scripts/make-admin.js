const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'sprout.db');

async function makeAdmin(email) {
    if (!email) {
        console.error('Please provide an email address.');
        console.log('Usage: node scripts/make-admin.js <email>');
        process.exit(1);
    }

    console.log(`Promoting ${email} to ADMIN...`);
    console.log(`Database: ${DB_PATH}`);

    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    try {
        const result = await db.run(
            "UPDATE users SET system_role = 'ADMIN' WHERE email = ?",
            email
        );

        if (result.changes > 0) {
            console.log(`✅ User ${email} is now an ADMIN.`);
        } else {
            console.log(`❌ User ${email} not found. Make sure they have registered first.`);
        }
    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await db.close();
    }
}

makeAdmin(process.argv[2]);
