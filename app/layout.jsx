import './globals.css';

export const metadata = {
  title: 'Moguru｜キッチンカーの今日の場所',
  description: '街の“動くおいしい瞬間”をつなぐ。キッチンカーの今日の場所が、アプリなしでわかります。',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
  appleWebApp: { capable: true, title: 'Moguru', statusBarStyle: 'default' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F76B15',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@700;900&family=Noto+Sans+JP:wght@400;500;700&display=swap" />
      </head>
      <body><div className="shell">{children}</div></body>
    </html>
  );
}
