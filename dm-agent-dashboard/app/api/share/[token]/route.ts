import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const db = await getDb();

    const dashboard = await db.get('SELECT * FROM dashboards WHERE share_token = ? AND is_public = 1', token);

    if (!dashboard) {
        return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    // Parse the JSON array of graph IDs
    const graphIds = dashboard.graphs ? JSON.parse(dashboard.graphs) : [];
    let insights: any[] = [];

    // If there are graphs on the dashboard, fetch their datasets
    if (graphIds.length > 0) {
        const placeholders = graphIds.map(() => '?').join(',');
        insights = await db.all(`SELECT * FROM insights WHERE id IN (${placeholders})`, ...graphIds);
    }

    // Attach the insights dataset so the public view can render the charts
    return NextResponse.json({
        ...dashboard,
        insights
    });
}
