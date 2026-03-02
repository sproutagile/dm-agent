import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // Prevent caching

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function GET(req: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const db = await getDb();
        const metrics = await db.all('SELECT * FROM source_metrics WHERE user_id = ?', user.id);

        // Transform Array of objects into a key-value Record for easy frontend lookup
        const metricsRecord: Record<string, any> = {};
        for (const m of metrics) {
            metricsRecord[m.metric_key] = {
                data: m.data,
                source: m.source,
                updated_at: m.updated_at
            };
        }

        return NextResponse.json(metricsRecord);
    } catch (err) {
        console.error("Error fetching metrics:", err);
        return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }
}
