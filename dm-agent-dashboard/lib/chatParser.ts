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
    // 1. Extract Data Pointers using the new syntax
    const pointerRegex = /\[SOURCE:\s*(.*?)\s*\|\s*ID:\s*(.*?)\s*\|\s*TAB:\s*(.*?)\s*\|\s*CELL:\s*(.*?)\s*\|\s*KEY:\s*(.*?)\]/g;
    const pointers: Record<string, { source_system: string, source_id: string, source_tab: string, source_cell: string }> = {};

    let pointerMatch;
    while ((pointerMatch = pointerRegex.exec(content)) !== null) {
        const key = pointerMatch[5].trim();
        pointers[key] = {
            source_system: pointerMatch[1].trim(),
            source_id: pointerMatch[2].trim(),
            source_tab: pointerMatch[3].trim(),
            source_cell: pointerMatch[4].trim(),
        };
    }

    // 2. Extract structured JSON payload
    let parsed: any = {};
    const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/i;
    const fallbackRegex = /```\s*(\{[\s\S]*?\})\s*```/i;
    const match = content.match(jsonBlockRegex) || content.match(fallbackRegex);

    try {
        if (match && match[1]) {
            parsed = JSON.parse(match[1]);
        } else {
            // Attempt to parse raw content if it's naked JSON
            parsed = JSON.parse(content);
        }
    } catch (e) {
        // If it's not JSON, we can't extract numeric values reliably, but if we found pointers,
        // we have a structural mismatch.
        if (Object.keys(pointers).length === 0) return;
    }

    let source = parsed.source || 'Chat';
    let rawMetrics: ParsedMetric[] = [];

    // Support standard webhook format
    if (Array.isArray(parsed.metrics)) rawMetrics.push(...parsed.metrics);
    if (Array.isArray(parsed.lists)) rawMetrics.push(...parsed.lists);

    // Support Sprout-PP extension format
    if (parsed.type === 'scorecard' && parsed.data) {
        // If a scorecard was generated, see if we have exactly one pointer to bind it to.
        // It's hard to guess the KEY without the pointer.
        const pointerKeys = Object.keys(pointers);
        if (pointerKeys.length === 1) {
            rawMetrics.push({ key: pointerKeys[0], value: parsed.data.value });
        }
    } else if (parsed.type === 'chart' && Array.isArray(parsed.data)) {
        const pointerKeys = Object.keys(pointers);
        if (pointerKeys.length === 1) {
            rawMetrics.push({ key: pointerKeys[0], value: parsed.data });
        }
    }

    if (rawMetrics.length === 0 && Object.keys(pointers).length > 0) {
        // We found pointers but no structured data matched. We shouldn't save empty data.
        console.log("[BackgroundParser] Found pointers but could not map them to a JSON value payload.");
        return;
    }

    if (rawMetrics.length === 0) return;

    try {
        const db = await getDb();

        for (const metric of rawMetrics) {
            // STRICT VALIDATION
            if (!metric.key || !ALLOWED_METRIC_KEYS.includes(metric.key)) {
                console.warn(`[BackgroundParser] Blocked unauthorized or invalid metric key: ${metric.key}`);
                continue;
            }

            const id = crypto.randomUUID();
            let finalValuePayload: any = metric.value;

            // ENHANCE: Merge the pointer coordinates if available
            if (pointers[metric.key]) {
                finalValuePayload = {
                    value: metric.value, // Retain original raw value/array
                    source_pointer: pointers[metric.key]
                };
            }

            const stringifiedData = typeof finalValuePayload === 'object' ? JSON.stringify(finalValuePayload) : String(finalValuePayload);

            await db.run(`
                INSERT OR REPLACE INTO source_metrics (id, user_id, metric_key, data, source, updated_at) 
                VALUES (
                    COALESCE((SELECT id FROM source_metrics WHERE user_id = ? AND metric_key = ?), ?), 
                    ?, ?, ?, ?, CURRENT_TIMESTAMP
                )`,
                userId, metric.key, id, userId, metric.key, stringifiedData, metric.source || source
            );

            console.log(`[BackgroundParser] Auto-synced verified metric: ${metric.key} ${pointers[metric.key] ? '(with pointer)' : ''}`);
        }
    } catch (error) {
        console.error("[BackgroundParser] Failed to process parsed metrics into SQLite:", error);
    }
}
