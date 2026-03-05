// Background service worker for handling extension icon clicks and API requests

const DEFAULT_WEBHOOK_URL = "http://agile.sprout.ph/automations/webhook/e7f53dfc-1fb6-4906-abee-62a31c557f90/chat"
const DASHBOARD_API_URL = "https://agile.sprout.ph/api/chat"
const ENABLE_DASHBOARD_SYNC = false // Disabled for standalone mode

// Initialize configuration on install
chrome.runtime.onInstalled.addListener(async () => {
    const result = await chrome.storage.local.get(["sprout_webhook_url"])
    if (!result.sprout_webhook_url) {
        await chrome.storage.local.set({ sprout_webhook_url: DEFAULT_WEBHOOK_URL })
        console.log("[Sprout Extension] Initialized Webhook URL in storage")
    }
})

// Open sidebar on icon click
chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "OPEN_SIDEBAR" }).catch(() => {
            // Ignore errors if sidebar isn't ready
        })
    }
})

// Handle messages from content scripts/sidebar
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "SEND_MESSAGE") {
        handleSend(message.payload).then(sendResponse).catch((err) => {
            sendResponse({ ok: false, error: err.message })
        })
        return true // Keep channel open for async response
    }
})

/**
 * Main send handler - Standalone Mode
 */
async function handleSend({ text, sessionId }: { text: string, sessionId: string }) {
    // Get URL from storage
    const result = await chrome.storage.local.get(["sprout_webhook_url"])
    const webhookUrl = result.sprout_webhook_url || DEFAULT_WEBHOOK_URL

    console.log('[Sprout Extension] Standalone Mode - calling webhook:', webhookUrl)

    // Inject system instruction to ensure JSON output
    const enrichedText = `${text}\n\n(IMPORTANT: You act as a data-aware assistant. You MUST output your response in valid JSON format ONLY. Do not wrap in markdown code blocks if possible, but if you do, I will parse it.
    
    EXPLANATION REQUIREMENT: When returning a chart, scorecard, or table, you MUST provide at least 2 sentences of explanation or insights about the data inside the "message" field of the JSON. Do NOT leave the "message" field empty.
    
    Schema:
    {
      "message": "Write at least 2 sentences of explanation here...",
      "type": "chart" | "scorecard" | "table" | "text",
      "chartType": "bar" | "line" | "area" | "pie",
      "title": "Title of the widget",
      "data": ... // Structure depends on type,
      "source": {
        "system": "GSheets" | "Jira",
        "spreadsheet_id": "<the google sheets file ID from the URL>",
        "tab": "<the sheet/tab name>",
        "range": "<cell or range, e.g. B2 or A1:B10>",
        "key": "<slug_style_metric_name>"
      }
    }
    
    CRITICAL: The "source" field is MANDATORY for chart and scorecard responses. Always include the exact spreadsheet ID, tab name, and cell/range where the data comes from.
    
    Stats/Scorecard Example:
    {
      "type": "scorecard",
      "title": "Avg Lead Time",
      "data": { "title": "Avg Lead Time", "value": "12 days", "trend": { "value": "10%", "direction": "down" }, "icon": "time" },
      "source": { "system": "GSheets", "spreadsheet_id": "1abc...", "tab": "Q1_Report", "range": "B4", "key": "avg_lead_time" }
    }

    Table Example:
    {
      "type": "table",
      "title": "Recent Tickets",
      "data": { "headers": ["ID", "Title", "Status"], "rows": [["1", "Fix bug", "Done"], ["2", "Deploy", "In Progress"]] }
    }

    Chart Example:
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Velocity",
      "data": [ { "name": "Sprint 1", "value": 10 } ],
      "source": { "system": "GSheets", "spreadsheet_id": "1abc...", "tab": "Velocity", "range": "A1:B5", "key": "velocity" }
    }
    
    If just text, use "type": "text" and omit "data" and "source".
    )`

    return await callN8nWebhook(webhookUrl, enrichedText, sessionId)
}

/**
 * Call n8n webhook and parse for JSON
 */
async function callN8nWebhook(webhookUrl: string, text: string, sessionId: string) {
    try {
        const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, sessionId }),
        })

        if (!res.ok) {
            const errorText = await res.text()
            throw new Error(`Webhook returned ${res.status}: ${errorText}`)
        }

        const data = await res.json()
        console.log('[Sprout Extension] Raw Webhook Response:', JSON.stringify(data, null, 2))

        const rawReply = extractReply(data)
        console.log('[Sprout Extension] Extracted Reply:', rawReply)

        // Parse the potential JSON in the reply
        const parsedResponse = cleanAndParseJSON(rawReply)

        // PRIMARY: Read source info from the structured JSON field (much more reliable than text parsing)
        if (parsedResponse.source && parsedResponse.source.spreadsheet_id) {
            parsedResponse.source_pointer = {
                source_system: parsedResponse.source.system || 'GSheets',
                source_id: parsedResponse.source.spreadsheet_id,
                source_tab: parsedResponse.source.tab || '',
                source_cell: parsedResponse.source.range || parsedResponse.source.cell || '',
                key: parsedResponse.source.key || parsedResponse.title?.toLowerCase().replace(/\s+/g, '_') || 'metric'
            }
            console.log('[Sprout Extension] Source Pointer from JSON:', JSON.stringify(parsedResponse.source_pointer))
        } else {
            // FALLBACK: Try regex parsing from raw text (legacy [SOURCE: ...] format)
            const sourcePointer = extractSourcePointer(rawReply)
            if (sourcePointer) {
                parsedResponse.source_pointer = sourcePointer
                console.log('[Sprout Extension] Source Pointer from text regex:', JSON.stringify(sourcePointer))
            } else {
                console.log('[Sprout Extension] No source pointer found in response.')
            }
        }

        console.log('[Sprout Extension] Parsed Response:', JSON.stringify(parsedResponse, null, 2))

        return {
            ok: true,
            reply: parsedResponse.message, // Compatibility with ai-service.ts
            data: parsedResponse
        }

    } catch (error) {
        console.error('Webhook failed:', error)
        return {
            ok: false,
            error: (error as Error).message || 'Failed to connect to webhook'
        }
    }
}

/**
 * Extract reply from n8n response
 */
function extractReply(data: any): string {
    if (typeof data === "string") return data
    if (Array.isArray(data) && data.length > 0) {
        const first = data[0]
        return first.output || first.text || first.message || first.reply || JSON.stringify(first)
    }
    return data.output || data.text || data.message || data.reply || JSON.stringify(data)
}

/**
 * Extract [SOURCE: ...] data pointer from AI response text.
 * Returns a structured object if found, null otherwise.
 */
function extractSourcePointer(text: string): object | null {
    const pointerRegex = /\[SOURCE:\s*(.*?)\s*\|\s*ID:\s*(.*?)\s*\|\s*TAB:\s*(.*?)\s*\|\s*CELL:\s*(.*?)\s*\|\s*KEY:\s*(.*?)\]/
    const match = text.match(pointerRegex)
    if (!match) return null
    return {
        source_system: match[1].trim(),
        source_id: match[2].trim(),
        source_tab: match[3].trim(),
        source_cell: match[4].trim(),
        key: match[5].trim()
    }
}

/**
 * Robust JSON Parser
 * Handles verbose Model output by aggressively searching for Markdown JSON blocks First
 */
function cleanAndParseJSON(text: string): any {
    // 1. Aggressively try extracting from markdown code blocks first (Bypasses chain-of-thought)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/)

    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[1].trim())
        } catch (e) {
            console.warn('[Sprout Extension] Failed to parse JSON from extracted code block', e)
        }
    }

    // 2. Try parsing strictly if no block was found
    try {
        return JSON.parse(text)
    } catch (e) {
        // 3. Fallback: Extract valid JSON objects from the text safely using brace matching
        const matches: { start: number; end: number; str: string }[] = [];
        let searchIndex = 0;

        while (searchIndex < text.length) {
            let startIndex = text.indexOf('{', searchIndex);
            if (startIndex === -1) break;

            let braceCount = 0;
            let inString = false;
            let escapeNext = false;

            for (let i = startIndex; i < text.length; i++) {
                const char = text[i];
                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }
                if (char === '\\') {
                    escapeNext = true;
                    continue;
                }
                if (char === '"') {
                    inString = !inString;
                } else if (!inString) {
                    if (char === '{') braceCount++;
                    else if (char === '}') braceCount--;
                }
                if (braceCount === 0 && !inString) {
                    matches.push({ start: startIndex, end: i, str: text.substring(startIndex, i + 1) });
                    break;
                }
            }
            // Always advance to find all possible starting braces, including nested or sibling objects
            searchIndex = startIndex + 1;
        }

        let validMatches: { parsed: any; start: number; end: number }[] = [];
        for (const m of matches) {
            try {
                const parsed = JSON.parse(m.str);
                if (parsed && typeof parsed === 'object') {
                    validMatches.push({ parsed, start: m.start, end: m.end });
                }
            } catch (e2) { }
        }

        if (validMatches.length > 0) {
            // Filter out nested matches
            validMatches = validMatches.filter(m1 => {
                const isInsideAnother = validMatches.some(m2 => m1 !== m2 && m2.start <= m1.start && m2.end >= m1.end);
                return !isInsideAnother;
            });

            if (validMatches.length > 0) {
                // Return the last valid outermost JSON block
                return validMatches[validMatches.length - 1].parsed;
            }
        }

        // 4. Ultimate Fallback: Treat as simple text response
        console.warn('[Sprout Extension] Fallback text response triggered')
        return {
            type: 'text',
            message: text
        }
    }
}
