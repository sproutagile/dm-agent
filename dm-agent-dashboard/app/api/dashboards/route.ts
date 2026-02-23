import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();
    // Fetch only dashboards belonging to the user
    const dashboards = await db.all('SELECT * FROM dashboards WHERE user_id = ?', user.id);

    // Parse JSON fields
    const parsedDashboards = dashboards.map(d => ({
        ...d,
        layout: d.layout ? JSON.parse(d.layout) : [],
        graphs: d.graphs ? JSON.parse(d.graphs) : []
    }));

    return NextResponse.json(parsedDashboards);
}

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, icon } = await req.json();

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const db = await getDb();
    const id = crypto.randomUUID();

    await db.run(
        'INSERT INTO dashboards (id, user_id, name, icon, layout, graphs) VALUES (?, ?, ?, ?, ?, ?)',
        id, user.id, name, icon || 'LayoutDashboard', '[]', '[]'
    );

    return NextResponse.json({ id, name, icon, graphs: [] });
}
