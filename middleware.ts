import { NextRequest, NextResponse } from 'next/server';
import AppMiddleware from '@/lib/middleware/app';
import DomainMiddleware from '@/lib/middleware/domain';

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const isCustomDomain = !host.includes('papermark.io') && !host.includes('vercel.app') && !host.includes('railway.app');
  console.log('Middleware: Processing', {
    path: req.nextUrl.pathname,
    host,
    isCustomDomain,
  });

  // Explicitly skip DomainMiddleware for railway.app
  if (host.includes('papermark-production-bbd1.up.railway.app')) {
    console.log('Middleware: Using AppMiddleware for railway.app');
    return AppMiddleware(req);
  }

  if (isCustomDomain) {
    return DomainMiddleware(req);
  }

  return AppMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
