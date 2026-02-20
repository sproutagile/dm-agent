
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: Request) {
    try {
        const { html, css } = await req.json();

        if (!html) {
            return NextResponse.json({ error: 'Missing HTML content' }, { status: 400 });
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // set viewport to landscape width to trigger desktop breakpoints
        await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 2 });

        // Construct complete HTML with styles
        const fullHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>${css}</style>
                    <style>
                        * { box-sizing: border-box; }
                        body { background: white; -webkit-print-color-adjust: exact; font-family: sans-serif; }
                        
                        /* Preserve Grid layout for print, just ensure it wraps properly */
                        .grid { 
                            display: grid !important; 
                            gap: 1.5rem !important; 
                            width: 100% !important;
                            max-width: 1400px;
                            margin: 0 auto;
                        }

                        /* Ensure widgets don't break across pages */
                        .grid > div { 
                            break-inside: avoid !important; 
                            page-break-inside: avoid !important;
                            border: 1px solid #e5e7eb;
                            border-radius: 0.5rem;
                            background: white;
                            overflow: visible !important;
                        }

                        /* Ensure SVGs don't get cut off */
                        svg {
                            overflow: visible !important;
                        }

                        /* Hide non-printable elements */
                        .print\\:hidden { display: none !important; }
                    </style>
                </head>
                <body>
                    <div id="pdf-content" style="padding: 20px;">
                        ${html}
                    </div>
                </body>
            </html>
        `;

        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

        // Add a delay to ensure charts finish animating/rendering
        await new Promise(r => setTimeout(r, 2000));

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
            scale: 0.75, // Scale down slightly to ensure wide charts fit the A4 Landscape page
        });

        await browser.close();

        return new NextResponse(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="dashboard-export.pdf"',
            },
        });

    } catch (error) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
