export const isWso2AuthEnabled = () => process.env.NEXT_PUBLIC_WSO2_AUTH_ENABLED === 'true'

// Public-demo mode: when true, the app seeds a stub admin session and skips all
// backend auth (no login, no refresh-token call). Used ONLY for the public Vercel
// demo of the Species Management module. Default false — the real ANTZ build never
// sets this, so production auth is unaffected.
export const isPublicDemo = () => process.env.NEXT_PUBLIC_PUBLIC_DEMO === 'true'
