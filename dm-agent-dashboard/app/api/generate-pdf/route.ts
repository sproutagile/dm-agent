
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

        // set viewport to something reasonable for A4
        await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });

        // Construct complete HTML with styles
        const fullHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>${css}</style>
                    <style>
                        * { box-sizing: border-box; }
                        body { background: white; -webkit-print-color-adjust: exact; font-family: sans-serif; }
                        
                        /* Ensure grid layout is preserved but items don't break */
                        .grid { 
                            display: grid !important; 
                            gap: 2rem !important; 
                            grid-template-columns: 1fr !important; /* Force single column to prevent clipping */
                            width: 100% !important;
                            max-width: 100% !important;
                        }

                        /* Widget containers */
                        .grid > div { 
                            break-inside: avoid !important; 
                            page-break-inside: avoid !important;
                            border: 1px solid #e5e7eb;
                            border-radius: 0.5rem;
                            background: white;
                            height: auto !important; 
                            width: 100% !important;
                            overflow: visible !important;
                            padding: 1rem;
                        }

                        /* Ensure SVGs don't get cut off */
                        svg {
                            overflow: visible !important;
                            max-width: 100% !important;
                            height: auto !important;
                        }

                        /* Chart specific adjustments */
                        .recharts-responsive-container {
                            width: 100% !important;
                            height: 400px !important; /* Increased height for better visibility */
                        }
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
