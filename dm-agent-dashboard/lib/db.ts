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

    return dbInstance;
}
