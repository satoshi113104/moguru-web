# Moguru β版（ブラウザ版）

キッチンカーが「出店開始」を押すと、GPSの現在地がお客さんの地図にすぐ出るWebアプリです。アプリのインストールは、オーナーもお客さんも不要です。

| 画面 | URL | 使う人 |
| --- | --- | --- |
| トップ | `/` | だれでも |
| お店のページ（SNSに貼るURL） | `/s/お店のID`（例：`/s/shintako`） | お客さん |
| 近くのキッチンカー | `/near` | お客さん |
| オーナー画面 | `/owner` | オーナー（ログインが必要） |

## 公開までの手順（30分ほど）

### 1. Supabase：データベースを準備する

1. Supabaseのプロジェクトを開き、左メニューの「SQL Editor」→「New query」を開く
2. このフォルダの `supabase/schema.sql` の中身をすべて貼り付けて「Run」を押す
   - 「Success. No rows returned」と出れば完了です
3. 左メニューの「Authentication」→「Sign In / Providers」→「Email」を開き、**「Confirm email」をオフ**にして保存
   - β版のあいだは、確認メールなしですぐにログインできるようにします
4. 「Project Settings」→「API」で、**Project URL** と **anon public キー** をメモする

### 2. GitHub：コードを置く

1. GitHubで「New repository」を作る（名前：`moguru-web`、Privateでも大丈夫です）
2. 「uploading an existing file」を開き、このフォルダの中身をすべてドラッグして「Commit changes」

### 3. Vercel：公開する

1. Vercelで「Add New…」→「Project」→ `moguru-web` の「Import」を押す
2. 「Environment Variables」に次の2つを入れる
   - `NEXT_PUBLIC_SUPABASE_URL` ＝ SupabaseのProject URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ＝ Supabaseのanon publicキー
3. 「Deploy」を押す（2〜3分）
4. できあがったURL（例：`https://moguru-web.vercel.app`）を開いて、トップ画面が出れば完了です

公開URLが決まったら、Vercelの「Settings」→「Environment Variables」に
`NEXT_PUBLIC_SITE_URL` ＝ そのURL を追加し、「Deployments」から「Redeploy」してください。
専用URLやコピーする文章に、このURLが入るようになります。

## 使い方（オーナー）

1. Androidのchromeで `公開URL/owner` を開き、メールアドレスとパスワードで登録
2. 店名・専用URL・ジャンル・写真などを登録
3. Chromeのメニュー →「ホーム画面に追加」で、アプリのようにアイコンから開ける
4. 当日は「出店」タブ → 位置が取れたら「出店を開始する」
5. 「あなたの専用URL」をコピーして、Instagramのプロフィールに貼る

お客さん役のスマホで専用URLを開いておくと、出店開始の数秒後にピンが出ます。

## β版で入っていないもの

- InstagramやXへの自動投稿（投稿文の作成・コピー・共有まで）
- 月額課金（Stripe）
- パスワードを忘れたときの再設定画面（SupabaseのAuthentication画面から管理者が対応）

地図はOpenStreetMapを使っています。利用者が増えてきたら、要件定義書のとおりGoogle Mapsなどへ切り替えてください。

## 開発者向け

```
npm install
cp .env.example .env.local   # 値を入れる
npm run dev
```

Next.js 14（App Router）／ Supabase（Postgres・Auth・Storage・Realtime）／ Leaflet
