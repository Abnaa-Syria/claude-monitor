import { NextResponse } from 'next/server';

export function proxy(req) {
  const secret = process.env.SESSION_SECRET;
  if (secret && req.cookies.get('cm_auth')?.value === secret) return NextResponse.next();
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = { matcher: ['/((?!login|_next|favicon.ico|qt.png).*)'] };
