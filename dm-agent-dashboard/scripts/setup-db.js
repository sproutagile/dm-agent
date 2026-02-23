const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'sprout.db');

async function setup() {
    console.log('Initializing database at:', DB_PATH);

    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    try {
        // Enable Foreign Keys
        await db.exec('PRAGMA foreign_keys = ON;');

        // Users Table
        await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        job_role TEXT,
        system_role TEXT CHECK(system_role IN ('ADMIN', 'USER')) NOT NULL DEFAULT 'USER',
        status TEXT CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')) NOT NULL DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Users table ready');

        // Dashboards Table
        await db.exec(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        icon TEXT,
        layout TEXT, -- JSON string for grid layout
        graphs TEXT, -- JSON string for widget list
        is_public INTEGER DEFAULT 0,
        share_token TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
        console.log('✅ Dashboards table ready');

        // Insights Table (for storing generated insights not yet on dashboard)
        await db.exec(`
      CREATE TABLE IF NOT EXISTS insights (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        data TEXT, -- JSON string for widget config
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
        console.log('✅ Insights table ready');

        // Chat Messages Table
        await db.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        role TEXT CHECK(role IN ('user', 'assistant', 'system')) NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
        console.log('✅ Chat Messages table ready');

        // KPI Stats Table (Single row per user or global? Let's do per user)
        await db.exec(`
      CREATE TABLE IF NOT EXISTS kpi_stats (
        user_id TEXT PRIMARY KEY,
        active_tasks INTEGER DEFAULT 0,
        throughput INTEGER DEFAULT 0,
        blockers INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
        console.log('✅ KPI Stats table ready');

        console.log('🎉 Database setup complete!');
    } catch (error) {
        console.error('❌ Database setup failed:', error);
    } finally {
        await db.close();
    }
}

setup();
