import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { setEncryptedItem, getEncryptedItem, setEncryptedCookie, getEncryptedCookie } from './cryptoStorage'

const DEVICE_ID_KEY = 'antz_device_id'
const LAST_USER_KEY = 'antz_last_logged_user'

// Generate a UUID — crypto.randomUUID() if secure context, manual fallback otherwise
const generateUUID = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // crypto.randomUUID not available (non-secure context)
  }

  // Fallback: manual UUID v4 generation using Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0

    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// Simple hash fallback for non-secure contexts (not cryptographic, but unique enough for device ID)
const simpleHash = str => {
  try {
    let h1 = 0xdeadbeef
    let h2 = 0x41c6ce57

    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i)
      h1 = Math.imul(h1 ^ ch, 2654435761)
      h2 = Math.imul(h2 ^ ch, 1597334677)
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)

    const hash = 4294967296 * (2097151 & h2) + (h1 >>> 0)

    return hash.toString(16).padStart(16, '0')
  } catch (error) {
    console.error('Simple hash failed:', error)

    return Math.random().toString(16).slice(2).padStart(16, '0')
  }
}

// Parse browser name and version from userAgent
const parseBrowser = () => {
  try {
    const ua = navigator.userAgent
    let browserName = 'Unknown'
    let browserVersion = ''

    if (ua.includes('Firefox/')) {
      browserName = 'Firefox'
      browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || ''
    } else if (ua.includes('Edg/')) {
      browserName = 'Edge'
      browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || ''
    } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
      browserName = 'Chrome'
      browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || ''
    } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
      browserName = 'Safari'
      browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || ''
    }

    return { browserName, browserVersion }
  } catch (error) {
    console.error('parseBrowser failed:', error)

    return { browserName: 'Unknown', browserVersion: '' }
  }
}

// Parse OS name and version from userAgent
const parseOS = () => {
  try {
    const ua = navigator.userAgent
    let osName = 'Unknown'
    let osVersion = ''

    if (ua.includes('Windows NT')) {
      osName = 'Windows'
      const versionMap = { '10.0': '10/11', 6.3: '8.1', 6.2: '8', 6.1: '7' }
      const ntVersion = ua.match(/Windows NT ([\d.]+)/)?.[1] || ''
      osVersion = versionMap[ntVersion] || ntVersion
    } else if (ua.includes('Mac OS X')) {
      osName = 'macOS'
      osVersion = ua.match(/Mac OS X ([\d_.]+)/)?.[1]?.replace(/_/g, '.') || ''
    } else if (ua.includes('Linux')) {
      osName = 'Linux'
    } else if (ua.includes('Android')) {
      osName = 'Android'
      osVersion = ua.match(/Android ([\d.]+)/)?.[1] || ''
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
      osName = 'iOS'
      osVersion = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') || ''
    }

    return { osName, osVersion }
  } catch (error) {
    console.error('parseOS failed:', error)

    return { osName: 'Unknown', osVersion: '' }
  }
}

// Get or create a persistent UUID (does NOT save — saving happens after login success)
const getStoredUUID = async () => {
  try {
    // Try localStorage first
    let uuid = await getEncryptedItem(DEVICE_ID_KEY)

    // Fallback to cookie if localStorage was cleared
    if (!uuid) {
      uuid = await getEncryptedCookie(DEVICE_ID_KEY)
    }

    // Generate new UUID if neither exists
    if (!uuid) {
      uuid = generateUUID()
    }

    return uuid
  } catch (error) {
    console.error('getStoredUUID failed:', error)

    return generateUUID()
  }
}

// Save device UUID to both localStorage and cookie (call after login success)
export const saveDeviceId = async () => {
  try {
    const uuid = await getStoredUUID()
    await Promise.all([setEncryptedItem(DEVICE_ID_KEY, uuid), setEncryptedCookie(DEVICE_ID_KEY, uuid)])
  } catch (error) {
    console.error('saveDeviceId failed:', error)
  }
}

// Get fingerprint ID from FingerprintJS
const getFingerprintId = async () => {
  try {
    const fp = await FingerprintJS.load()
    const result = await fp.get()

    // Debug: Log full fingerprint data and components
    console.group('FingerprintJS Data', result)
    console.log('Visitor ID:', result.visitorId)
    console.log('Confidence Score:', result.confidence?.score)
    console.group('Components')

    const components = result.components
    console.table(
      Object.entries(components).reduce((acc, [key, val]) => {
        acc[key] = {
          value: typeof val.value === 'object' ? JSON.stringify(val.value) : val.value,
          duration: val.duration
        }

        return acc
      }, {})
    )
    console.groupEnd()

    console.groupEnd()

    return result.visitorId
  } catch (error) {
    console.error('FingerprintJS error:', error)

    return null
  }
}

// Detect device type from userAgent and screen size
const getDeviceType = () => {
  try {
    const ua = navigator.userAgent

    if (/iPad/i.test(ua)) {
      return 'tablet'
    }

    // Macintosh with touch = iPad (but only if screen size is tablet-range, to avoid DevTools false positive)
    if (/Macintosh/i.test(ua) && 'ontouchend' in document && window.screen.width <= 1366) {
      return 'tablet'
    }

    if (/Android/i.test(ua)) {
      // Android tablets typically have no 'Mobile' in UA
      return /Mobile/i.test(ua) ? 'mobile' : 'tablet'
    }

    if (/iPhone|iPod/i.test(ua)) {
      return 'mobile'
    }

    return 'web'
  } catch (error) {
    console.error('getDeviceType failed:', error)

    return 'web'
  }
}

// Generate device_id by hashing UUID + fingerprint_id together
// Uses SHA-256 in secure context, simple hash fallback otherwise
const generateDeviceId = async (uuid, fingerprintId) => {
  const combined = `${uuid}_${fingerprintId || 'unknown'}`

  try {
    // Try SHA-256 via Web Crypto API (requires secure context)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder()
      const data = encoder.encode(combined)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))

      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }
  } catch (error) {
    console.warn('SHA-256 hash unavailable, using fallback hash:', error)
  }

  // Fallback: simple non-cryptographic hash for non-secure contexts (HTTP + IP)
  return simpleHash(combined)
}

// Get the last logged-in user info (localStorage first, cookie fallback)
const getLastLoggedUser = async () => {
  try {
    // Try localStorage first
    const stored = await getEncryptedItem(LAST_USER_KEY)
    if (stored) return JSON.parse(stored)

    // Fallback to cookie (survives localStorage.clear())
    const cookieStored = await getEncryptedCookie(LAST_USER_KEY)
    if (cookieStored) return JSON.parse(cookieStored)

    return null
  } catch (error) {
    console.error('getLastLoggedUser failed:', error)

    return null
  }
}

// Save the current user as the last logged-in user (both localStorage + cookie)
export const setLastLoggedUser = async (userId, userEmail) => {
  try {
    const data = JSON.stringify({ user_id: userId, user_email: userEmail })

    // Save to both localStorage and cookie for redundancy
    await Promise.all([setEncryptedItem(LAST_USER_KEY, data), setEncryptedCookie(LAST_USER_KEY, data)])
  } catch (err) {
    console.error('Failed to save last logged user:', err)
  }
}

// Debug: Log all stored device values in readable format (call from browser console)
// export const debugDeviceStorage = async () => {
//   const lsDeviceId = await getEncryptedItem(DEVICE_ID_KEY)
//   const lsLastUser = await getEncryptedItem(LAST_USER_KEY)
//   const cookieDeviceId = await getEncryptedCookie(DEVICE_ID_KEY)
//   const cookieLastUser = await getEncryptedCookie(LAST_USER_KEY)

//   const lsRawDeviceId = localStorage.getItem(DEVICE_ID_KEY)
//   const lsRawLastUser = localStorage.getItem(LAST_USER_KEY)

//   console.group('Device Storage Debug')

//   console.group('localStorage (encrypted → decrypted)')
//   console.table({
//     antz_device_id: { encrypted: lsRawDeviceId || '(empty)', decrypted: lsDeviceId || '(empty)' },
//     antz_last_logged_user: {
//       encrypted: lsRawLastUser || '(empty)',
//       decrypted: lsLastUser ? JSON.parse(lsLastUser) : '(empty)'
//     }
//   })
//   console.groupEnd()

//   console.group('Cookies (encrypted → decrypted)')
//   console.table({
//     antz_device_id: { decrypted: cookieDeviceId || '(empty)' },
//     antz_last_logged_user: { decrypted: cookieLastUser ? JSON.parse(cookieLastUser) : '(empty)' }
//   })
//   console.groupEnd()

//   console.groupEnd()

//   return {
//     localStorage: {
//       device_id: lsDeviceId,
//       last_logged_user: lsLastUser ? JSON.parse(lsLastUser) : null
//     },
//     cookie: {
//       device_id: cookieDeviceId,
//       last_logged_user: cookieLastUser ? JSON.parse(cookieLastUser) : null
//     }
//   }
// }

// Get complete device info for login payload
export const getDeviceInfo = async currentUserEmail => {
  try {
    const { browserName, browserVersion } = parseBrowser()
    const { osName, osVersion } = parseOS()
    const [uuid, fingerprintId, lastUser] = await Promise.all([
      getStoredUUID(),
      getFingerprintId(),
      getLastLoggedUser()
    ])
    const deviceId = await generateDeviceId(uuid, fingerprintId)

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

    // Check if a different user previously used this device
    const isDifferentUser = lastUser ? lastUser.user_email !== currentUserEmail : false

    const deviceDetails = {
      device_id: deviceId,
      device_type: getDeviceType(),
      browser_name: browserName,
      browser_version: browserVersion,
      os_name: osName,
      os_version: osVersion,
      platform: navigator.platform || '',
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      network_online: navigator.onLine,
      network_type: connection?.effectiveType || '',
      previous_user_id: lastUser?.user_id || null,
      previous_user_email: lastUser?.user_email || null,
      is_different_user: isDifferentUser
    }

    // Debug: Log device details and stored values
    // console.group('Device Detection - getDeviceInfo()')
    // console.log('Current login email:', currentUserEmail)
    // console.log('UUID:', uuid)
    // console.log('Fingerprint ID:', fingerprintId)
    // console.log('Last logged user (from storage):', lastUser)
    // console.log('Is different user:', isDifferentUser)
    // console.table(deviceDetails)
    // console.groupEnd()

    return deviceDetails
  } catch (error) {
    console.error('getDeviceInfo failed:', error)

    // Return minimal device details so login doesn't break entirely
    return {
      device_id: 'unknown',
      device_type: 'web',
      browser_name: 'Unknown',
      browser_version: '',
      os_name: 'Unknown',
      os_version: '',
      platform: '',
      screen_resolution: '',
      language: '',
      timezone: '',
      network_online: true,
      network_type: '',
      previous_user_id: null,
      previous_user_email: null,
      is_different_user: false
    }
  }
}

// Expose debug function on window for browser console testing
// if (typeof window !== 'undefined') {
//   window.debugDeviceStorage = debugDeviceStorage
// }
