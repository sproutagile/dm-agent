import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from './lib/auth-edge';

// Paths that do NOT require authentication
const PUBLIC_PATHS = ['/login', '/register', '/share', '/api/share'];

export async function proxy(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // Check if path is public
    const isPublic = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));
    // Also allow API auth routes
    const isAuthApi = path.startsWith('/api/auth/');

    if (isPublic || isAuthApi) {
        return NextResponse.next();
    }

    // Protected by default
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
        if (path.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', req.url));
    }

    const payload = await verifyTokenEdge(token);
    if (!payload) {
        if (path.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // Admin protection (keep existing logic)
    if (path.startsWith('/admin') && payload.systemRole !== 'ADMIN') {
        if (path.startsWith('/api/')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
}

export const config = {
    // Match everything EXCEPT static files and images
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
