import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { serialize } from 'cookie';

export async function POST(req: Request) {
    try {
        const { email, password, name, jobRole } = await req.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDb();

        // Check if user exists
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', email);
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // Check if this is the first user (make them ADMIN)
        const userCount = await db.get('SELECT COUNT(*) as count FROM users');
        const isFirstUser = userCount.count === 0;

        const systemRole = isFirstUser ? 'ADMIN' : 'USER';
        const status = isFirstUser ? 'APPROVED' : 'PENDING';
        const hashedPassword = await hashPassword(password);
        const id = crypto.randomUUID();

        await db.run(
            'INSERT INTO users (id, email, password, name, job_role, system_role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            id, email, hashedPassword, name, jobRole, systemRole, status
        );

        // If approved, login immediately
        if (status === 'APPROVED') {
            const token = signToken({ id, email, systemRole, name });
            const cookie = serialize('auth_token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 60 * 60 * 24 * 7,
                path: '/'
            });

            return NextResponse.json(
                { user: { id, email, name, systemRole, status } },
                { headers: { 'Set-Cookie': cookie } }
            );
        }

        return NextResponse.json({
            message: 'Registration successful. Please wait for admin approval.',
            user: { id, email, name, systemRole, status }
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
