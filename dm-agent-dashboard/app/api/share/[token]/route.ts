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

    return NextResponse.json(dashboard);
}
