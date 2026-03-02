// Background service worker for handling extension icon clicks and API requests

const DEFAULT_WEBHOOK_URL = "http://agile.sprout.ph/automations/webhook/049a56fd-7cf2-46b6-abe9-b24d41ecc092/chat"
// Using localhost for testing
const DASHBOARD_API_URL = "http://localhost:3000/api/chat"
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
    
    Schema:
    {
      "message": "Your text response here...",
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
 * Handles potential Markdown wrapping (```json ... ```)
 */
function cleanAndParseJSON(text: string): any {
    try {
        // 1. Try parsing strictly first
        return JSON.parse(text)
    } catch (e) {
        // 2. Try extracting from markdown code blocks
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/)

        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1])
            } catch (e2) {
                console.warn('Failed to parse JSON from code block', e2)
            }
        }

        // 3. Fallback: Treat as simple text response
        return {
            type: 'text',
            message: text
        }
    }
}
