const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/sprout.db');

async function checkDb() {
    console.log('Checking database at:', DB_PATH);
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    try {
        const users = await db.all('SELECT id, name, email, job_role, system_role FROM users');
        console.log(JSON.stringify(users, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await db.close();
    }
}

checkDb();
