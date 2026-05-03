/**
 * Returns one of: 'granted' | 'denied' | 'prompt' | 'unsupported'.
 * On older WebKit (some iPad versions) navigator.permissions is missing — treat as 'prompt'.
 */
export async function getGeolocationPermission() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return 'unsupported'
  if (!navigator.permissions?.query) return 'prompt'
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' })

    return status.state
  } catch {
    return 'prompt'
  }
}
