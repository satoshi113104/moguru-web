import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const configured = Boolean(url && key);

// ブラウザ用（ログイン状態を保持する）
export const supabase = configured ? createClient(url, key) : null;

// サーバー用（OGPなどの読み取りだけ）
export function serverClient() {
  if (!configured) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function siteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}
