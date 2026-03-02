import { getDb } from './db';
import crypto from 'crypto';

// Strict schema whitelist to prevent LLM hallucinations
const ALLOWED_METRIC_KEYS = [
    'velocity',
    'bug_count',
    'active_sprints',
    'team_efficiency',
    'release_burnup',
    'done_tickets',
    'workflow_efficiency',
    'jira_blockers',
    'gsheet_roster'
];

export interface ParsedMetric {
    key: string;
    value: string | number | any[] | object;
    source?: string;
}

/**
 * Scans a chat string for a markdown JSON block and attempts to parse structured metrics from it.
 * The block must adhere to a format like:
 * ```json
 * { "metrics": [ {"key": "velocity", "value": 45} ], "source": "Chat" }
 * ```
 */
export async function parseAndStoreMetrics(userId: string, content: string): Promise<void> {
    const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/;
    const match = content.match(jsonBlockRegex);

    if (!match || !match[1]) return; // No structured data found

    try {
        const parsed = JSON.parse(match[1]);

        let source = parsed.source || 'Chat';
        let metrics: ParsedMetric[] = [];

        if (Array.isArray(parsed.metrics)) {
            metrics = [...metrics, ...parsed.metrics];
        }

        if (Array.isArray(parsed.lists)) {
            metrics = [...metrics, ...parsed.lists];
        }

        if (metrics.length === 0) return;

        const db = await getDb();

        for (const metric of metrics) {
            // STRICT VALIDATION: Ignore keys not in the application schema whitelist.
            // This prevents LLMs from writing junk data or trying to corrupt the structure.
            if (!metric.key || !ALLOWED_METRIC_KEYS.includes(metric.key)) {
                console.warn(`[BackgroundParser] Blocked unauthorized or invalid metric key: ${metric.key}`);
                continue;
            }

            const id = crypto.randomUUID();
            const stringifiedData = typeof metric.value === 'object' ? JSON.stringify(metric.value) : String(metric.value);

            // INSERT OR REPLACE relies on the UNIQUE constraint (user_id, metric_key) in SQLite
            await db.run(`
                INSERT OR REPLACE INTO source_metrics (id, user_id, metric_key, data, source, updated_at) 
                VALUES (
                    COALESCE((SELECT id FROM source_metrics WHERE user_id = ? AND metric_key = ?), ?), 
                    ?, ?, ?, ?, CURRENT_TIMESTAMP
                )`,
                userId, metric.key, id, userId, metric.key, stringifiedData, metric.source || source
            );

            console.log(`[BackgroundParser] Auto-synced verified metric: ${metric.key}`);
        }
    } catch (error) {
        console.error("[BackgroundParser] Failed to parse or store structured JSON payload:", error);
    }
}
