import client from 'src/lib/auth/wso2Client'
import { write, readAsync } from 'src/lib/windows/utils'
import { saveDeviceId, setLastLoggedUser, getDeviceInfo } from 'src/utility/deviceInfo'
import { getUserDataInSsoFlow } from 'src/lib/api/wso-login'
const reconcilePharmacyStorage = async resData => {
  const options = resData?.modules?.pharmacy_data?.pharmacy
  const storedPharmacy = await readAsync('selectedStore')

  const hasStored = options?.length > 0 && storedPharmacy !== undefined && storedPharmacy !== null
  const foundStored = hasStored ? options.some(item => item?.id === storedPharmacy?.id) : false

  if (hasStored) {
    const found = options.find(item => item.id === storedPharmacy?.id)
    const permsChanged = JSON.stringify(found?.permission) !== JSON.stringify(storedPharmacy?.permission)
    if (permsChanged) write('selectedStore', found)
  }

  if (!hasStored || !foundStored) {
    if (options?.length > 0) {
      write('selectedStore', options[0])
    } else {
      localStorage.removeItem('selectedStore')
    }
  }
}

/**
 * Hydrate localStorage after a successful WSO2 callback AND on every page
 * reload while in SSO mode (the SSO equivalent of legacy callRefreshToken).
 *
 * Flow:
 *   1. Get WSO2 access token (from sessionStorage, auto-refreshed if near expiry).
 *   2. getUserDataInSsoFlow() → POST WSO_SESSION (= /api/v2/auth/session) with
 *      the WSO2 Bearer. Backend validates, maps JWT.sub → antz_users.wso2_id,
 *      and returns the full Antz session `{ token, user, roles, modules, ... }`.
 *      The returned `token` is the backend-issued JWT used for subsequent /api/* calls.
 *
 * Throws on failure. getUserDataInSsoFlow itself ALSO triggers client.logout()
 * on a falsy/error response (defence in depth — the caller should additionally
 * handle the throw, but if it forgets the package's _logoutInProgress guard
 * makes the duplicate call a safe no-op).
 */
export const hydrateBackendSession = async () => {
  const token = await client.getAccessToken()
  if (!token) throw new Error('Failed to get access token')

  const resData = await getUserDataInSsoFlow()
  console.log('[wso2Hydrate] getUserDataInSsoFlow response:', resData)
  if (!resData || resData.success === false) {
    throw new Error(resData?.message || 'v2/auth/session returned unsuccessful response')
  }

  const u = resData.user || {}
  const userData = {
    email: u.user_email,
    fullName: u.user_first_name,
    lastName: u.user_last_name,
    role: 'admin',
    id: u.user_role_id || resData?.roles?.role_id,
    username: u.user_name || u.user_first_name
  }

  const roleName = resData?.user?.role_name || resData?.roles?.role_name

  write('userDetails', resData)
  write('role', roleName)
  write('userData', userData)

  // Backup copy of the WSO2 access token (legacy code reads localStorage.accessToken directly).
  // If the backend returned its own JWT, GetAPIHeader will prefer userDetails.token.
  window.localStorage.setItem('accessToken', token)

  await reconcilePharmacyStorage(resData)

  try {
    // getDeviceInfo() must run before saveDeviceId() — it populates the
    // module-level _cachedDeviceId that saveDeviceId reads. Without this call,
    // saveDeviceId silently bails and antz_device_id is never written, which
    // breaks preserveDeviceInfo() in handleLogout (nothing to restore).
    await getDeviceInfo(resData?.user?.user_email)
    await Promise.all([saveDeviceId(), setLastLoggedUser(resData?.user?.user_id, resData?.user?.user_email)])
  } catch (err) {
    console.warn('[wso2Hydrate] device info save failed:', err?.message)
  }

  return { userData, resData }
}
