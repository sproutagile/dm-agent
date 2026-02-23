import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.id) {
        return NextResponse.json({ user: null }, { status: 200 });
    }

    try {
        const db = await getDb();
        const user = await db.get(
            'SELECT id, name, email, job_role as jobRole, system_role as systemRole FROM users WHERE id = ?',
            payload.id
        );

        if (!user) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch user", error);
        return NextResponse.json({ user: null }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, jobRole } = await req.json();
        const db = await getDb();

        await db.run(
            'UPDATE users SET name = ?, job_role = ? WHERE id = ?',
            name,
            jobRole,
            payload.id
        );

        // Fetch updated user to confirm logic
        const updatedUser = await db.get(
            'SELECT id, name, email, job_role as jobRole, system_role as systemRole FROM users WHERE id = ?',
            payload.id
        );

        return NextResponse.json({
            user: updatedUser
        });

    } catch (error) {
        console.error("Profile update failed", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
