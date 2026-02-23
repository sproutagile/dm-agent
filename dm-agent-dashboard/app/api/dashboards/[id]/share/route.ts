import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();

    // Verify ownership
    const dashboard = await db.get('SELECT user_id FROM dashboards WHERE id = ?', id);
    if (!dashboard) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (dashboard.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const shareToken = crypto.randomUUID();

    await db.run(
        'UPDATE dashboards SET is_public = 1, share_token = ? WHERE id = ?',
        shareToken, id
    );

    return NextResponse.json({ shareToken, isPublic: true });
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
    const dashboard = await db.get('SELECT user_id FROM dashboards WHERE id = ?', id);
    if (!dashboard) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (dashboard.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await db.run(
        'UPDATE dashboards SET is_public = 0, share_token = NULL WHERE id = ?',
        id
    );

    return NextResponse.json({ isPublic: false, shareToken: null });
}
