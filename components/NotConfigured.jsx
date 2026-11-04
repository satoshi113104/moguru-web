export default function NotConfigured() {
  return (
    <div className="auth">
      <h1>設定がまだです</h1>
      <p>Vercel の Environment Variables に <b>NEXT_PUBLIC_SUPABASE_URL</b> と <b>NEXT_PUBLIC_SUPABASE_ANON_KEY</b> を入れてから、もう一度デプロイしてください。</p>
    </div>
  );
}
