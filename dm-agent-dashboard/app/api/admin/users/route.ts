import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// Middleware should ideally protect this, but good to have double check
async function isAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return false;
    const payload = verifyToken(token);
    return payload && payload.systemRole === 'ADMIN';
}

export async function GET() {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = await getDb();
    const users = await db.all('SELECT id, email, name, job_role, status, created_at FROM users WHERE system_role != "ADMIN" ORDER BY created_at DESC');

    return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, status } = await req.json();

    if (!userId || !['APPROVED', 'REJECTED'].includes(status)) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const db = await getDb();
    await db.run('UPDATE users SET status = ? WHERE id = ?', status, userId);

    return NextResponse.json({ success: true });
}
