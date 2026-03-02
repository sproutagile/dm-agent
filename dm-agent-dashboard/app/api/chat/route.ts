import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth-edge'; // Use edge auth for consistency or lib/auth? APIs run in Node, so lib/auth is fine, but cookie parsing is needed.
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { parseAndStoreMetrics } from '@/lib/chatParser';

// Helper to get user
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
    const messages = await db.all('SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC', user.id);

    return NextResponse.json(messages);
}

export async function POST(req: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role, content } = await req.json();
    if (!role || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const db = await getDb();
    const id = crypto.randomUUID();

    await db.run(
        'INSERT INTO chat_messages (id, user_id, role, content) VALUES (?, ?, ?, ?)',
        id, user.id, role, content
    );

    // BACKGROUND PARSER: Look for structured metrics in assistant/webhook responses
    if (role === 'assistant' || role === 'system') {
        // Execute asynchronously so the webhook doesn't block
        parseAndStoreMetrics(user.id, content).catch(console.error);
    }

    return NextResponse.json({ id, role, content, created_at: new Date().toISOString() });
}

export async function DELETE(req: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();
    await db.run('DELETE FROM chat_messages WHERE user_id = ?', user.id); // Clear all chat for user

    return NextResponse.json({ success: true });
}
