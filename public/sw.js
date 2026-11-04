// Moguru: ホーム画面に追加できるようにするための最小のService Worker。
// 位置情報が古くならないよう、キャッシュはしません。
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
