import Link from 'next/link';

export default function Landing() {
  return (
    <main className="landing">
      <img className="logo" src="/icon-192.png" alt="Moguru" />
      <h1>キッチンカーの<br />「今日の場所」がわかる</h1>
      <p>Moguru（もぐる）は、キッチンカーの出店場所を地図でお知らせするサービスです。アプリのインストールも会員登録もいりません。</p>
      <Link className="btn primary" href="/near">近くのキッチンカーを探す</Link>
      <Link className="btn ghost" href="/owner">キッチンカーのオーナーの方</Link>
      <p className="hint">β版です。表示される場所は、各お店が出店時に公開した位置です。</p>
    </main>
  );
}
