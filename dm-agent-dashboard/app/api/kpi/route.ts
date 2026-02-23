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
    const kpi = await db.get('SELECT * FROM kpi_stats WHERE user_id = ?', user.id);

    // Return default if not found
    if (!kpi) {
        return NextResponse.json({
            active_tasks: 0,
            throughput: 0,
            blockers: 0
        });
    }

    return NextResponse.json({
        activeTasks: kpi.active_tasks,
        throughput: kpi.throughput,
        blockers: kpi.blockers
    });
}

export async function POST(req: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = await getDb();

    // Check if exists
    const existing = await db.get('SELECT user_id FROM kpi_stats WHERE user_id = ?', user.id);

    if (existing) {
        // Update
        const updates: string[] = [];
        const values: any[] = [];

        if (body.activeTasks !== undefined) { updates.push('active_tasks = ?'); values.push(body.activeTasks); }
        if (body.throughput !== undefined) { updates.push('throughput = ?'); values.push(body.throughput); }
        if (body.blockers !== undefined) { updates.push('blockers = ?'); values.push(body.blockers); }

        if (updates.length > 0) {
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(user.id);
            await db.run(`UPDATE kpi_stats SET ${updates.join(', ')} WHERE user_id = ?`, ...values);
        }
    } else {
        // Insert
        await db.run(
            'INSERT INTO kpi_stats (user_id, active_tasks, throughput, blockers) VALUES (?, ?, ?, ?)',
            user.id,
            body.activeTasks || 0,
            body.throughput || 0,
            body.blockers || 0
        );
    }

    return NextResponse.json({ success: true });
}
