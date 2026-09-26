export function registerPwa(): void {
  const isProd = (import.meta as ImportMeta & { env?: { PROD?: boolean } }).env?.PROD
  if (!isProd) return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[pwa] service worker registration failed', err)
    })
  })
}
