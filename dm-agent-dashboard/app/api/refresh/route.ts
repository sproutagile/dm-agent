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
function flattenToNameValueArray(data: any): { name: string; value: number }[] {
    const result: { name: string; value: number }[] = [];

    // Case 3: plain object (not array) → convert keys to entries
    if (!Array.isArray(data) && typeof data === 'object') {
        for (const [key, val] of Object.entries(data)) {
            if (key === 'output' || key === 'message') continue; // skip n8n wrapper keys
            const num = typeof val === 'number' ? val : parseFloat(String(val));
            if (!isNaN(num)) {
                const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                result.push({ name: label, value: num });
            }
        }
        return result;
    }

    if (!Array.isArray(data)) return result;

    for (const item of data) {
        if (!item || typeof item !== 'object') continue;

        if (typeof item.value === 'number' && isFinite(item.value)) {
            // Case 1: standard format
            result.push({ name: String(item.name || ''), value: item.value });

        } else if (typeof item.value === 'string') {
            // Case 4: string number
            const num = parseFloat(item.value);
            if (!isNaN(num)) result.push({ name: String(item.name || ''), value: num });

        } else if (typeof item.value === 'object' && item.value !== null && !Array.isArray(item.value)) {
            // Case 2: nested object — explode into multiple entries
            for (const [key, val] of Object.entries(item.value as Record<string, unknown>)) {
                const num = typeof val === 'number' ? val : parseFloat(String(val));
                if (!isNaN(num)) {
                    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                    result.push({ name: label, value: num });
                }
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

        // Build a short, targeted prompt — much cheaper than a full AI re-prompt
        const targetedPrompt = `Fetch the CURRENT data from this exact source and return ONLY a raw JSON array of objects with "name" and "value" keys. No other text. Source: [SOURCE: ${pointer.source_system} | ID: ${pointer.source_id} | TAB: ${pointer.source_tab} | CELL: ${pointer.source_cell} | KEY: ${pointer.key}]`;

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

        // Normalize data to a flat [{name, value}] array regardless of AI response format
        const normalized = flattenToNameValueArray(data);

        if (normalized.length === 0) {
            console.warn('[Refresh] Normalized data is empty. Falling back.');
            return NextResponse.json({ fallback: true });
        }

        console.log(`[Refresh] Successfully fetched ${normalized.length} data points for widget ${widgetId}`);
        return NextResponse.json(normalized);

    } catch (error: unknown) {
        console.error('[Refresh] Error:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Refresh failed: ${msg}` }, { status: 500 });
    }
}
