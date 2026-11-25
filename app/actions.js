'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { timingSafeEqual } from 'crypto';
import { apiPost } from '../lib/api';

function same(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return y.length > 0 && x.length === y.length && timingSafeEqual(x, y);
}

async function requireAuth() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || (await cookies()).get('cm_auth')?.value !== secret) redirect('/login');
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

export async function setTheme(theme) {
  (await cookies()).set('theme', theme === 'light' ? 'light' : 'dark', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
}

export async function renameOrg(formData) {
  await requireAuth();
  await apiPost('/api/orgs', { id: formData.get('id'), name: formData.get('name') });
  revalidatePath('/', 'layout');
}

export async function addOrg(formData) {
  await requireAuth();
  await apiPost('/api/orgs', { name: formData.get('name') });
  revalidatePath('/', 'layout');
}

export async function setDisplayName(formData) {
  await requireAuth();
  await apiPost('/api/people', { email: formData.get('email'), display_name: formData.get('display_name') });
  revalidatePath('/', 'layout');
}

export async function deleteSession(formData) {
  await requireAuth();
  const id = String(formData.get('id') || '');
  if (!/^[\w-]+$/.test(id)) return;
  await apiPost(`/api/sessions/${id}/delete`, {});
  redirect('/sessions');
}
