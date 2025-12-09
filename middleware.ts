import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();

  // Admin routes check
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session || !session.user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    const userRole = session.user.role;
    console.log('Admin check - User role:', userRole, 'Session:', JSON.stringify(session.user));
    
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/api/analytics'];
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Allow guest access to main routes (/, /api/chat, /api/upload-*, /api/chats for guest sessions)
  // These will handle guest credit checking internally

  // Allow NextAuth routes to pass through
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (session && (request.nextUrl.pathname.startsWith('/auth/login') ||
                   request.nextUrl.pathname.startsWith('/auth/signup'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|share).*)',
  ],
};
