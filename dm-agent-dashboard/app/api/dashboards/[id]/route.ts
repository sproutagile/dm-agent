import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();
    const dashboard = await db.get('SELECT * FROM dashboards WHERE id = ?', id);

    if (!dashboard) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Security check: Ensure user owns the dashboard
    if (dashboard.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse JSON fields
    dashboard.layout = dashboard.layout ? JSON.parse(dashboard.layout) : [];
    dashboard.graphs = dashboard.graphs ? JSON.parse(dashboard.graphs) : [];

    return NextResponse.json(dashboard);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = await getDb();

    // Verify ownership
    const existing = await db.get('SELECT user_id FROM dashboards WHERE id = ?', id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
        updates.push('name = ?');
        values.push(body.name);
    }
    if (body.icon !== undefined) {
        updates.push('icon = ?');
        values.push(body.icon);
    }
    if (body.layout !== undefined) {
        updates.push('layout = ?');
        values.push(JSON.stringify(body.layout));
    }
    if (body.graphs !== undefined) {
        updates.push('graphs = ?');
        values.push(JSON.stringify(body.graphs));
    }

    if (updates.length === 0) return NextResponse.json({ success: true });

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const query = `UPDATE dashboards SET ${updates.join(', ')} WHERE id = ?`;
    values.push(id);

    await db.run(query, ...values);

    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();

    // Verify ownership
    const existing = await db.get('SELECT user_id FROM dashboards WHERE id = ?', id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await db.run('DELETE FROM dashboards WHERE id = ?', id);

    return NextResponse.json({ success: true });
}
