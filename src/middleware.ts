import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Pages that don't require authentication
const publicPages = ['/login', '/signup', '/pending-approval'];

// Pages that require admin access
const adminPages = ['/admin'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;
  
  const isPublicPage = publicPages.some(page => pathname.startsWith(page));
  const isAdminPage = adminPages.some(page => pathname.startsWith(page));
  const isPendingPage = pathname === '/pending-approval';

  // Not logged in - redirect to login (unless on public page)
  if (!token && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Logged in on auth pages - redirect to deals
  if (token && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    return NextResponse.redirect(new URL('/deals', request.url));
  }

  // Check user status from token
  if (token) {
    const userStatus = token.status as string | undefined;
    const isGlobalAdmin = token.isGlobalAdmin as boolean | undefined;

    // Global admins bypass all checks
    if (isGlobalAdmin) {
      return NextResponse.next();
    }

    // Pending users can only see the pending page
    if (userStatus === 'PENDING' && !isPendingPage) {
      return NextResponse.redirect(new URL('/pending-approval', request.url));
    }

    // Approved users shouldn't see pending page
    if (userStatus === 'APPROVED' && isPendingPage) {
      return NextResponse.redirect(new URL('/deals', request.url));
    }

    // Rejected/Suspended users go to pending page with message
    if ((userStatus === 'REJECTED' || userStatus === 'SUSPENDED') && !isPendingPage) {
      return NextResponse.redirect(new URL('/pending-approval', request.url));
    }

    // Admin pages require admin role
    if (isAdminPage) {
      const role = token.role as string | undefined;
      if (role !== 'ADMIN' && role !== 'OWNER' && !isGlobalAdmin) {
        return NextResponse.redirect(new URL('/deals', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
