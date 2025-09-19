import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define token type based on usage
interface Token {
  email?: string;
  user?: {
    createdAt?: string;
  };
}

export default async function AppMiddleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;
  const isInvited = url.searchParams.has('invitation');
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: 'next-auth.session-token',
  }) as Token | null;
  console.log('AppMiddleware: Processing', {
    pathname: path,
    host: url.host,
    token,
    cookies: req.cookies.get('next-auth.session-token'),
    nextauthUrl: process.env.NEXTAUTH_URL,
    nextauthSecret: !!process.env.NEXTAUTH_SECRET,
  });

  if (!token?.email && path !== '/login') {
    const loginUrl = new URL(`/login`, req.url);
    if (path !== '/') {
      const nextPath =
        path === '/auth/confirm-email-change' ? `${path}${url.search}` : path;
      loginUrl.searchParams.set('next', encodeURIComponent(nextPath));
    }
    console.log('AppMiddleware: Redirecting to login', { loginUrl: loginUrl.toString() });
    return NextResponse.redirect(loginUrl);
  }

  if (
    token?.email &&
    token?.user?.createdAt &&
    new Date(token.user.createdAt).getTime() > Date.now() - 10000 &&
    path !== '/welcome' &&
    !isInvited
  ) {
    console.log('AppMiddleware: Redirecting to welcome');
    return NextResponse.redirect(new URL('/welcome', req.url));
  }

  if (token?.email && path === '/login') {
    const nextPath = url.searchParams.get('next') || '/dashboard';
    console.log('AppMiddleware: Redirecting to', { nextPath });
    return NextResponse.redirect(new URL(decodeURIComponent(nextPath), req.url));
  }

  return NextResponse.next();
}
