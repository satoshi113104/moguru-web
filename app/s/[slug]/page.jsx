import StoreView from '@/components/StoreView';
import { serverClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const sb = serverClient();
  let store = null;
  if (sb) {
    const { data } = await sb.from('stores').select('name,photo_url,logo_url').eq('slug', params.slug).maybeSingle();
    store = data;
  }
  if (!store) return { title: 'Moguru' };
  const title = `${store.name}｜今日の場所はこちら`;
  const description = `${store.name}の今日の出店場所を地図で確認できます。アプリ不要・無料です。`;
  const img = store.photo_url || store.logo_url;
  return {
    title,
    description,
    openGraph: { title, description, images: img ? [img] : [], type: 'website', siteName: 'Moguru' },
    twitter: { card: img ? 'summary_large_image' : 'summary', title, description, images: img ? [img] : [] },
  };
}

export default function Page({ params }) {
  return <StoreView slug={params.slug} />;
}
