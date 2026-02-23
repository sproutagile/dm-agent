import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function GET(req: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();
    const insights = await db.all('SELECT * FROM insights WHERE user_id = ? ORDER BY created_at DESC', user.id);

    // Parse data field
    const parsed = insights.map(i => ({
        id: i.id,
        widgetId: i.id, // In SQL logic, row ID is widget ID
        label: i.title,
        generatedAt: i.created_at,
        data: i.data ? JSON.parse(i.data) : {} // This contains the dynamic widget config
    }));

    return NextResponse.json(parsed);
}

export async function POST(req: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { label, data } = await req.json(); // Data is the widget object

    const db = await getDb();
    const id = crypto.randomUUID();

    await db.run(
        'INSERT INTO insights (id, user_id, title, data) VALUES (?, ?, ?, ?)',
        id, user.id, label, JSON.stringify(data || {})
    );

    return NextResponse.json({ id, label, generatedAt: new Date().toISOString(), data });
}
