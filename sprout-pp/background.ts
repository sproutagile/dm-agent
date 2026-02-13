// Background service worker for handling extension icon clicks and API requests

// Configuration
// Configuration
const N8N_WEBHOOK_URL = "https://agile.sprout.ph/webhook/049a56fd-7cf2-46b6-abe9-b24d41ecc092/chat"
const DASHBOARD_API_URL = "http://localhost:3000/api/chat"
const ENABLE_DASHBOARD_SYNC = false // Disabled for standalone mode

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
    console.log('[Sprout Extension] Standalone Mode - calling webhook:', N8N_WEBHOOK_URL)

    // Inject system instruction to ensure JSON output
    const enrichedText = `${text}\n\n(IMPORTANT: You act as a data-aware assistant. You MUST output your response in valid JSON format ONLY. Do not wrap in markdown code blocks if possible, but if you do, I will parse it.
    
    Schema:
    {
      "message": "Your text response here...",
      "type": "chart" | "kpi" | "text",
      "chartType": "bar" | "line" | "area" | "pie",
      "title": "Chart Title",
      "data": [ { "name": "Label", "value": 10 } ]
    }
    
    If the user asks for a chart or analysis, use "type": "chart" and provide "data".
    If just text, use "type": "text" and omit "data".
    )`

    return await callN8nWebhook(N8N_WEBHOOK_URL, enrichedText, sessionId)
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
            error: error.message || 'Failed to connect to webhook'
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
