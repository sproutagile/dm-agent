import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const DEFAULT_WEBHOOK_URL = 'http://agile.sprout.ph/automations/webhook/049a56fd-7cf2-46b6-abe9-b24d41ecc092/chat';

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

/**
 * POST /api/refresh
 * Body: { widgetId: string }
 *
 * Looks up the source_pointer for the widget from SQLite.
 * If found, fires a short targeted prompt to the n8n webhook to fetch fresh data.
 * If not found, returns { fallback: true } so the client can fall back to /api/proxy.
 */
/**
 * Normalize any AI response format into a flat [{name, value}] array.
 * Handles:
 *   1. Standard:  [{name: "Sprint 1", value: 35}]
 *   2. Grouped:   [{name: "Planned Tickets", value: {planned: 35, unplanned: 9}}]  → explodes into 2 entries
 *   3. Plain obj: {planned: 35, unplanned: 9}  → converts keys to entries
 *   4. String numbers: [{name: "X", value: "35"}]  → parses strings
 */
function flexParseData(data: any): any {
    // If it's the Sprout Dashboard schema
    if (data && data.type && data.data !== undefined) {
        if (data.type === 'scorecard' || data.type === 'kpi') {
            // Return a single element array for uniform handling or just the object
            // Actually, returning the object itself is better, but the legacy expects an array.
            // Let's return the object so we can use its 'value' and 'trend' exactly as provided.
            return data.data; 
        } else if ((data.type === 'chart' || data.type === 'table') && Array.isArray(data.data)) {
            return data.data; // Return the array of data points
        }
    }

    // Legacy fallback parsing logic for flat arrays / objects
    const result: { name: string; value: number | string }[] = [];

    if (!Array.isArray(data) && typeof data === 'object') {
        for (const [key, val] of Object.entries(data)) {
            if (key === 'output' || key === 'message') continue;
            result.push({ name: key, value: String(val) });
        }
        return result;
    }

    if (!Array.isArray(data)) return result;

    for (const item of data) {
        if (!item || typeof item !== 'object') continue;

        if ('value' in item) {
            result.push({ name: String(item.name || ''), value: item.value });
        } else {
            // Explode object
            for (const [key, val] of Object.entries(item as Record<string, unknown>)) {
                result.push({ name: key, value: String(val) });
            }
        }
    }
    return result;
}

export async function POST(req: Request) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { widgetId } = await req.json();
        if (!widgetId) return NextResponse.json({ error: 'widgetId required' }, { status: 400 });

        // Look up the widget's data from the insights table
        const db = await getDb();
        const row = await db.get<{ data: string }>(
            'SELECT data FROM insights WHERE id = ? AND user_id = ?',
            widgetId, user.id
        );

        if (!row || !row.data) {
            console.log(`[Refresh] Widget ${widgetId} not found in DB. Falling back.`);
            return NextResponse.json({ fallback: true });
        }

        let widgetData: any = {};
        try {
            widgetData = JSON.parse(row.data);
        } catch (e) {
            return NextResponse.json({ fallback: true });
        }

        const pointer = widgetData.source_pointer;
        if (!pointer || !pointer.source_id) {
            console.log(`[Refresh] No source_pointer on widget ${widgetId}. Falling back.`);
            return NextResponse.json({ fallback: true });
        }

        console.log(`[Refresh] Using pinned source pointer for widget ${widgetId}:`, JSON.stringify(pointer));

        // If we saved the original question that generated this widget, pass it along
        // so the AI knows if it needs to average/sum the data instead of just returning raw latest data.
        const originalQuery = widgetData.original_query ? `Original Context: "${widgetData.original_query}"` : '';

        // Build a short, targeted prompt — much cheaper than a full AI re-prompt
        const targetedPrompt = `Fetch the CURRENT data from this exact source using the exact same Sprout MBR Dashboard schema. ${originalQuery} Source: [SOURCE: ${pointer.source_system} | ID: ${pointer.source_id} | TAB: ${pointer.source_tab} | CELL: ${pointer.source_cell} | KEY: ${pointer.key}]`;

        const webhookUrl = DEFAULT_WEBHOOK_URL;

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chatInput: targetedPrompt,
                sessionId: `refresh-${widgetId}`,
                id: widgetId,
            }),
        });

        if (!response.ok) {
            console.error(`[Refresh] Webhook error: ${response.status}`);
            return NextResponse.json({ fallback: true });
        }

        const text = await response.text();
        console.log('[Refresh] Raw webhook response:', text.substring(0, 300));

        // Parse the response — strip any [SOURCE: ...] pointer text before extracting JSON
        const cleanedText = text.replace(/\[SOURCE:[\s\S]*?\]/g, '').trim();

        let data: any;

        try {
            data = JSON.parse(cleanedText);
        } catch (e) {
            const arrayStart = cleanedText.indexOf('[');
            const arrayEnd = cleanedText.lastIndexOf(']');
            const objStart = cleanedText.indexOf('{');
            const objEnd = cleanedText.lastIndexOf('}');

            if (arrayStart !== -1 && arrayEnd > arrayStart) {
                try { data = JSON.parse(cleanedText.substring(arrayStart, arrayEnd + 1)); } catch (e2) { }
            }
            if (!data && objStart !== -1 && objEnd > objStart) {
                try { data = JSON.parse(cleanedText.substring(objStart, objEnd + 1)); } catch (e3) { }
            }
        }

        // Unwrap n8n { "output": "[...]" } wrapper
        if (data && !Array.isArray(data) && typeof data === 'object' && data.output && typeof data.output === 'string') {
            const cleanedOutput = data.output.replace(/\[SOURCE:[\s\S]*?\]/g, '').trim();
            try {
                const inner = JSON.parse(cleanedOutput);
                if (Array.isArray(inner)) data = inner;
            } catch (e) {
                const ai = cleanedOutput.indexOf('[');
                const ae = cleanedOutput.lastIndexOf(']');
                if (ai !== -1 && ae > ai) {
                    try { data = JSON.parse(cleanedOutput.substring(ai, ae + 1)); } catch (e2) { }
                }
            }
        }

        if (!data) {
            console.warn('[Refresh] Could not parse any JSON from webhook. Falling back.');
            return NextResponse.json({ fallback: true });
        }

        // Normalize data
        const normalized = flexParseData(data);

        // For arrays, verify it's not empty. For scorecard objects, verify value exists.
        if (Array.isArray(normalized) && normalized.length === 0) {
            console.warn('[Refresh] Normalized data is empty array. Falling back.');
            return NextResponse.json({ fallback: true });
        } else if (!Array.isArray(normalized) && (normalized.value === undefined && normalized.title === undefined)) {
            console.warn('[Refresh] Normalized data is empty object. Falling back.');
            return NextResponse.json({ fallback: true });
        }

        console.log(`[Refresh] Successfully fetched refreshed data for widget ${widgetId}`);
        return NextResponse.json(normalized);

    } catch (error: unknown) {
        console.error('[Refresh] Error:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Refresh failed: ${msg}` }, { status: 500 });
    }
}
