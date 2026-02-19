import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { endpoint, type, ...rest } = body;

        // Default webhook URL if not provided
        const targetUrl = endpoint || 'https://agile.sprout.ph/webhook/049a56fd-7cf2-46b6-abe9-b24d41ecc092/chat';

        // The webhook likely expects "chatInput" for n8n/chat workflows.
        // We append strict instructions to ensure we get JSON back.
        const contextInstruction = rest.context ? ` Context: ${rest.context}.` : "";

        // Simplified prompt to avoid 502/timeouts.
        const prompt = `Analyze delivery metrics for ${rest.title || 'this chart'}. Check for webhook nodes for datasources. Return a raw JSON array of objects with "name" and "value" keys based on REAL data.`;

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
            const errorText = await response.text();
            console.error(`Webhook failed: ${response.status} ${response.statusText}`, errorText);
            return NextResponse.json(
                { error: `Webhook error: ${response.status} ${response.statusText}`, details: errorText },
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
            // Try to extract JSON from the string.
            console.log("Raw response is not JSON, attempting to extract...");
            // Use [\s\S]* instead of . with s flag for multiline matching if needed, or just standard match
            const jsonMatch = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                try {
                    data = JSON.parse(jsonMatch[0]);
                } catch (e2) {
                    console.error("Extraction parse error:", e2);
                    // Proceed to check for output field logic below or throw
                }
            }

            if (!data) {
                // It's just text (like the "output": "..." case from n8n sometimes)
                // If it's the n8n object { "output": "text" }, we might need to parse the inner text.
                try {
                    // We already failed text parse above, but check if we can parse it as a simple object now?
                    // Actually, if the FIRST JSON.parse failed, text is NOT valid JSON.
                    // But maybe the extraction above failed too.

                    // Let's look for the specific n8n pattern where output might be a key in a larger string, 
                    // or maybe the user meant the response IS valid JSON but has an "output" key containing the string.

                    // Wait, if line 40 `JSON.parse(text)` failed, then `text` is NOT a JSON object.
                    // So looking for `potentialObj.output` implies `text` WAS valid JSON. 
                    // My previous logic was slightly flawed nesting.

                    // Let's re-evaluate:
                    // 1. Try to parse `text` as JSON.
                    // 2. If success -> check if it has `output` string that needs parsing.
                    // 3. If fail -> try to finding JSON substring.

                    // Since we are in the catch block of step 1, we know `text` is not JSON.
                    // So we only rely on extraction.
                    throw new Error("Could not parse JSON from response");
                } catch (e3) {
                    // If we are here, we really couldn't get JSON.
                    // One last check: if the text itself IS the "output" content from n8n (unlikely if n8n returns JSON usually)
                    // But sometimes n8n returns just the string if configured to return "Body".
                    throw new Error("Invalid response format: " + text.substring(0, 50));
                }
            }
        }

        // Post-processing: If data is an object with "output", try to parse "output"
        // This handles { "output": "[...]" } case which is valid JSON but stringified internal data
        if (data && !Array.isArray(data) && typeof data === 'object' && data.output && typeof data.output === 'string') {
            try {
                const innerData = JSON.parse(data.output);
                if (Array.isArray(innerData)) {
                    data = innerData;
                }
            } catch (e) {
                // Try extracting from output string
                const innerMatch = data.output.match(/\[[\s\S]*\]/);
                if (innerMatch) {
                    try {
                        data = JSON.parse(innerMatch[0]);
                    } catch (e2) { }
                }
            }
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Proxy Internal Error:', error);
        return NextResponse.json({ error: `Proxy failed: ${error.message}` }, { status: 500 });
    }
}
