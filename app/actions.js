'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { timingSafeEqual } from 'crypto';

function same(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return y.length > 0 && x.length === y.length && timingSafeEqual(x, y);
}

export async function login(formData) {
  if (!same(formData.get('password'), process.env.DASHBOARD_PASSWORD)) redirect('/login?error=1');
  (await cookies()).set('cm_auth', process.env.SESSION_SECRET, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  });
  redirect('/');
}

export async function logout() {
  (await cookies()).delete('cm_auth');
  redirect('/login');
}
