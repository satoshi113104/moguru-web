export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch { return false; }
  }
}

export async function shareText(text) {
  if (navigator.share) {
    try { await navigator.share({ text }); return 'shared'; } catch { return 'cancel'; }
  }
  return (await copyText(text)) ? 'copied' : 'failed';
}
