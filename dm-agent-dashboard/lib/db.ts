import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbInstance: Database | null = null;

export async function getDb() {
    if (dbInstance) {
        return dbInstance;
    }

    const dbPath = path.join(process.cwd(), 'data', 'sprout.db');

    dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await dbInstance.exec('PRAGMA foreign_keys = ON;');

    // Ensure the new KPI metrics table exists
    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS source_metrics (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            metric_key TEXT NOT NULL,
            data TEXT NOT NULL,
            source TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, metric_key)
        )
    `);

    return dbInstance;
}
