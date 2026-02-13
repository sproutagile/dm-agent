
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
                        
                        /* Force single column layout for PDF to ensure full width and no clipping */
                        .grid { 
                            display: grid !important; 
                            gap: 2rem !important; 
                            width: 100% !important;
                            grid-template-columns: 1fr !important; 
                        }

                        /* Widget containers */
                        .grid > div { 
                            break-inside: avoid !important; 
                            page-break-inside: avoid !important;
                            border: 1px solid #e5e7eb;
                            border-radius: 0.5rem;
                            background: white;
                            overflow: visible !important;
                            padding: 1.5rem;
                        }

                        /* Reset col spans since we are using single column */
                        .md\\:col-span-2, .lg\\:col-span-3 { 
                            grid-column: span 1 / span 1 !important; 
                        }

                        /* Ensure SVGs don't get cut off */
                        svg {
                            overflow: visible !important;
                        }

                        /* Chart specific adjustments - Fixed height for consistency */
                        .recharts-responsive-container {
                            width: 100% !important;
                            min-height: 400px !important;
                        }

                        /* Hide non-printable elements */
                        .print\\:hidden { display: none !important; }
                    </style>
                </head>
                <body>
                    <div id="pdf-content" style="padding: 40px;">
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
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
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
