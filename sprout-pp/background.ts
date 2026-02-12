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

    // Inject system instruction to ensure chartable output
    const enrichedText = `${text}\n\n(IMPORTANT: If providing data/metrics, please output them in a Markdown table (Item | Value) or list (Item: Value) so I can render a chart. Also please provide a **Chart Title: [Title Here]** at the very top.)`

    return await callN8nWebhook(N8N_WEBHOOK_URL, enrichedText, sessionId)
}

/**
 * Call n8n webhook and parse for charts
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
        const replyText = extractReply(data)

        // Attempt to parse chart data from text response
        const chartData = parseTextForChartData(replyText)

        if (chartData) {
            return {
                ok: true,
                reply: chartData.message,
                data: chartData // This contains type: 'chart' and data
            }
        }

        return { ok: true, reply: replyText }

    } catch (error) {
        console.error('Webhook failed:', error)
        throw error
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
 * Smart text-to-chart parser
 * Attempts to extract chart data from markdown/text responses
 */
function parseTextForChartData(text: string) {
    const chartData: Array<{ name: string; value: number }> = [];
    let chartTitle = '';
    let chartType = 'bar';

    // Pattern 1: Markdown table (Flexible columns)
    // Matches rows like | Col A | Col B | ... | Value |
    const tableLinePattern = /^\s*\|(.+)\|\s*$/gm;
    let tableMatch;

    while ((tableMatch = tableLinePattern.exec(text)) !== null) {
        const rowContent = tableMatch[1];
        // Split by pipe and trim whitespace
        const cells = rowContent.split('|').map(c => c.trim());

        // Skip header separators (e.g. ---, :---)
        if (cells.some(c => c.match(/^[-:]+$/))) continue;

        // Try to find a numeric value in the last filled column
        const potentialValue = cells[cells.length - 1];
        const value = parseFloat(potentialValue.replace(/[*%]/g, ''));

        if (!isNaN(value)) {
            // Join all previous columns to form a composite name
            const name = cells.slice(0, -1).join(' - ').replace(/\*\*/g, '').trim();

            // Filter out obviously bad names (headers)
            if (name && !name.toLowerCase().includes('ticket') && !name.toLowerCase().includes('value')) {
                chartData.push({ name, value });
            }
        }
    }

    // Pattern 2: Text-based bar chart
    const textBarPattern = /([A-Za-z0-9\s]+?)\s*[█▓▒░■●◆]+\s*(\d+(?:\.\d+)?)\s*%/g;
    let match;
    while ((match = textBarPattern.exec(text)) !== null) {
        const name = match[1].trim();
        const value = parseFloat(match[2]);
        if (name && !isNaN(value) && !chartData.find(d => d.name === name)) {
            chartData.push({ name, value });
        }
    }

    // Pattern 3: Simple "Name: X%"
    const simplePattern = /(?:^|\n)\s*[-•*]?\s*([A-Za-z0-9\s]+?)[\s:–-]+(\d+(?:\.\d+)?)\s*%/g;
    while ((match = simplePattern.exec(text)) !== null) {
        const name = match[1].trim();
        const value = parseFloat(match[2]);
        if (name && !isNaN(value) && name.length < 50 && !chartData.find(d => d.name === name)) {
            chartData.push({ name, value });
        }
    }

    // Pattern 4: Named values
    const namedValuePattern = /([A-Za-z\s]+(?:Points?|Tasks?|Items?|Count|Total|Done|Completed))[\s:]+(\d+(?:\.\d+)?)/gi;
    const namedValues: Array<{ name: string; value: number }> = [];
    while ((match = namedValuePattern.exec(text)) !== null) {
        const name = match[1].trim();
        const value = parseFloat(match[2]);
        if (name && !isNaN(value)) {
            namedValues.push({ name, value });
        }
    }

    // Extract title
    const titlePatterns = [
        /\*\*Chart Title:\s*(.*)\*\*/i,
        /\*\*([^*]+(?:summary|report|analytics|completion|velocity|progress)[^*]*)\*\*/i,
        /^#+\s*(.+(?:summary|report|analytics|completion|velocity|progress).*)$/im,
        /^([A-Z][^.!?\n]+(?:summary|report|analytics|completion|velocity|progress)[^.!?\n]*)$/im,
    ];

    for (const pattern of titlePatterns) {
        const titleMatch = text.match(pattern);
        if (titleMatch) {
            chartTitle = titleMatch[1].trim().replace(/\*+/g, '');
            break;
        }
    }

    // Fallback: Use first line as title if decent length and not a table
    if (!chartTitle) {
        const firstLine = text.split('\n')[0].trim();
        if (firstLine && firstLine.length < 100 && !firstLine.startsWith('|') && !firstLine.includes('IMPORTANT')) {
            chartTitle = firstLine.replace(/\*+/g, '');
        }
    }

    // Determine chart type and validity
    if (chartData.length >= 2) {
        const allPercentages = chartData.every(d => d.value >= 0 && d.value <= 100);
        const hasTimePattern = chartData.some(d =>
            /\d{4}|cycle|sprint|week|month|q[1-4]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(d.name)
        );

        if (hasTimePattern) chartType = 'line';
        else if (allPercentages && chartData.length <= 5) chartType = 'bar';
        else if (chartData.length <= 6) chartType = 'pie';

        return {
            message: text,
            type: 'chart',
            chartType,
            title: chartTitle || 'Analytics',
            data: chartData,
        };
    }

    // Fallback to named values
    if (namedValues.length >= 2) {
        return {
            message: text,
            type: 'chart',
            chartType: 'bar',
            title: chartTitle || 'Data Summary',
            data: namedValues.slice(0, 8),
        };
    }

    return null;
}
