import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
    '/home',
    '/profile',
    '/rewards',
    '/my-reports',
    '/report',
    '/report-detail',
    '/admin',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    // For protected routes, we'll rely on client-side auth checks
    // Middleware can't access localStorage, so we'll let the page components handle auth
    // Each protected page should check auth and redirect if needed

    return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
