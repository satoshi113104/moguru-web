'use client';

import { useState } from 'react';
import GoogleMap, { googleEnabled } from './GoogleMap';
import LeafletMap from './LeafletMap';

// Googleマップのキーがあれば Googleマップ、なければ・読み込めなければ OpenStreetMap
export default function MapView(props) {
  const [failed, setFailed] = useState(false);
  if (googleEnabled && !failed) return <GoogleMap {...props} onFail={() => setFailed(true)} />;
  return <LeafletMap {...props} />;
}
