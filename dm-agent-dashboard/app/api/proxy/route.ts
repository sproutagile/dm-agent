import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { endpoint, type, ...rest } = body;

        // Use the exact webhook format from the sprout-pp extension
        const targetUrl = endpoint || 'http://agile.sprout.ph/automations/webhook/049a56fd-7cf2-46b6-abe9-b24d41ecc092/chat';

        // The webhook likely expects "chatInput" for n8n/chat workflows.
        // We append strict instructions to ensure we get JSON back.
        const contextInstruction = rest.context ? ` Context: ${rest.context}.` : "";

        // Simplified prompt to avoid 502/timeouts.
        const prompt = `Analyze delivery metrics for ${rest.title || 'this chart'}. Check for webhook nodes for datasources. Return a JSON array of objects with "name" and "value" keys based on REAL data. YOU MUST ALSO include a structured Data Pointer block anywhere in your response (e.g., at the end of the text). Use the exact format: [SOURCE: GSheets | ID: <spreadsheet_id> | TAB: <tab_name> | CELL: <cell_coordinate> | KEY: <unique_metric_name>]`;

        const payload = {
            ...rest,
            chatInput: prompt,
        };

        console.log(`Proxying request to: ${targetUrl}`);
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`Webhook failed: ${response.status} ${response.statusText}`);
            return NextResponse.json(
                { error: `Webhook error: ${response.status}` },
                { status: response.status }
            );
        }

        let data;
        const text = await response.text();
        console.log("Raw Webhook Response Text:", text);

        try {
            data = JSON.parse(text);

        } catch (e) {
            // If parsing fails, it might be because the LLM wrapped it in markdown or added text.
            // Strip the DATA POINTER block first, as its brackets confuse JSON extraction
            const cleanedText = text.replace(/\[SOURCE:[\s\S]*?\]/g, '').trim();

            console.log("Raw response is not JSON, attempting to extract array or object...");

            // Find the JSON array: look specifically for [{...}] pattern
            const arrayStart = cleanedText.indexOf('[');
            const arrayEnd = cleanedText.lastIndexOf(']');

            const objectStart = cleanedText.indexOf('{');
            const objectEnd = cleanedText.lastIndexOf('}');

            if (arrayStart !== -1 && arrayEnd !== -1 && arrayStart < arrayEnd) {
                try {
                    data = JSON.parse(cleanedText.substring(arrayStart, arrayEnd + 1));
                } catch (e2) { }
            }

            if (!data && objectStart !== -1 && objectEnd !== -1 && objectStart < objectEnd) {
                try {
                    data = JSON.parse(cleanedText.substring(objectStart, objectEnd + 1));
                } catch (e3) {
                    console.error("Extraction parse error:", e3);
                }
            }

            if (!data) {
                throw new Error("Could not parse JSON from response");
            }
        }

        // Post-processing: handle n8n's { "output": "..." } wrapper
        if (data && !Array.isArray(data) && typeof data === 'object' && data.output && typeof data.output === 'string') {
            // Strip pointer from output string before extracting JSON
            const cleanedOutput = data.output.replace(/\[SOURCE:[\s\S]*?\]/g, '').trim();
            try {
                const innerData = JSON.parse(cleanedOutput);
                if (Array.isArray(innerData)) data = innerData;
            } catch (e) {
                const arrayIdx = cleanedOutput.indexOf('[');
                const arrayEndIdx = cleanedOutput.lastIndexOf(']');
                if (arrayIdx !== -1 && arrayEndIdx > arrayIdx) {
                    try { data = JSON.parse(cleanedOutput.substring(arrayIdx, arrayEndIdx + 1)); } catch (e2) { }
                }
            }
        }

        // --- ENHANCEMENT: AI Data Pointer Extraction ---
        // Even if we fetched a chart, if the LLM provided a pointer, we can pass it back via a custom header
        // since we don't want to mutate the JSON body if the frontend strictly expects an array.
        // Actually, we can return exactly what we parsed.

        const pointerRegex = /\[SOURCE:\s*(.*?)\s*\|\s*ID:\s*(.*?)\s*\|\s*TAB:\s*(.*?)\s*\|\s*CELL:\s*(.*?)\s*\|\s*KEY:\s*(.*?)\]/;
        const pointerMatch = text.match(pointerRegex);

        const responseData = data;
        console.log("[Proxy] Final parsed data to return:", JSON.stringify(responseData)?.substring(0, 300));

        // Next.js NextResponse allows us to add headers
        const res = NextResponse.json(responseData);

        if (pointerMatch) {
            const pointerObj = {
                source_system: pointerMatch[1].trim(),
                source_id: pointerMatch[2].trim(),
                source_tab: pointerMatch[3].trim(),
                source_cell: pointerMatch[4].trim(),
                key: pointerMatch[5].trim()
            };
            res.headers.set('X-Source-Pointer', JSON.stringify(pointerObj));
        }

        return res;

    } catch (error: unknown) {
        console.error('Proxy Internal Error:', error);
        const ermsg = error instanceof Error ? error.message : "Unknown error occurred";
        return NextResponse.json({ error: `Proxy failed: ${ermsg}` }, { status: 500 });
    }
}
