// TEMPORARY (2026-08-21): dev-only auth black-box recorder — finds what kills
// the session. Self-guarded to development builds in the browser; a no-op
// everywhere else. Logs to /api/dev-authlog → .dev-authlog.jsonl:
//   • every response from the WSO2 auth server (token refreshes included)
//   • every failed (>=400) backend XHR call
//   • every 'session-expired' event and logout_reason write, WITH stack trace
// Tokens are redacted. Delete this file + the /api/dev-authlog route + the
// import in src/app/providers.tsx once the bug is fixed.

/* eslint-disable */
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && !window.__authLogInstalled) {
  window.__authLogInstalled = true

  const origFetch = window.fetch.bind(window)

  const log = evt => {
    try {
      origFetch('/api/dev-authlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: new Date().toISOString(), page: window.location.pathname, ...evt })
      }).catch(() => {})
    } catch {}
  }

  const redact = text =>
    String(text)
      .replace(/"(access_token|refresh_token|id_token)"\s*:\s*"[^"]+"/g, '"$1":"<redacted>"')
      .replace(/(refresh_token|code|assertion)=[^&\s"]+/g, '$1=<redacted>')

  const stack = () => (new Error().stack || '').split('\n').slice(2, 8).join(' | ')

  // ── fetch: capture ALL traffic to the WSO2 auth server ──
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input && input.url) || ''
    const isAuthServer = url.includes('auth.antzsystems.com')
    const method = (init && init.method) || (typeof input === 'object' && input && input.method) || 'GET'
    let reqBody = ''
    if (isAuthServer && init && typeof init.body === 'string') reqBody = redact(init.body).slice(0, 300)
    try {
      const res = await origFetch(input, init)
      if (isAuthServer) {
        let body = ''
        try {
          body = redact(await res.clone().text()).slice(0, 800)
        } catch {}
        log({ kind: 'wso2', method, url: url.split('?')[0], status: res.status, reqBody, body })
      }
      return res
    } catch (err) {
      if (isAuthServer) log({ kind: 'wso2-network-error', method, url: url.split('?')[0], error: String(err), reqBody })
      throw err
    }
  }

  // ── XHR (axios): capture every failed backend call ──
  const origOpen = XMLHttpRequest.prototype.open
  const origSend = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.open = function (m, u) {
    this.__logMethod = m
    this.__logUrl = u
    return origOpen.apply(this, arguments)
  }
  XMLHttpRequest.prototype.send = function () {
    this.addEventListener('loadend', () => {
      const u = String(this.__logUrl || '')
      if (this.status >= 400 && !u.includes('/api/dev-authlog')) {
        let body = ''
        try {
          body = redact(this.responseText || '').slice(0, 500)
        } catch {}
        log({ kind: 'xhr-fail', method: this.__logMethod, url: u.split('?')[0], status: this.status, body })
      }
    })
    return origSend.apply(this, arguments)
  }

  // ── the logout triggers themselves, with stacks ──
  window.addEventListener('session-expired', () => log({ kind: 'EVENT session-expired', stack: stack() }))

  const origSetItem = Storage.prototype.setItem
  Storage.prototype.setItem = function (k, v) {
    if (k === 'logout_reason' || k === 'session_expired') {
      log({ kind: 'STORAGE ' + k + '=' + String(v).slice(0, 60), stack: stack() })
    }
    return origSetItem.call(this, k, v)
  }

  log({ kind: 'logger-installed' })
}

export {}
