// ** React Imports
import { use, useEffect, useState } from 'react'

// ** Next Imports
import Link from 'next/link'

// ** MUI Components
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

// ** Third Party Imports
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

// ** Hooks
import { useAuth } from 'src/hooks/useAuth'
import { useSafeRouter } from 'src/hooks/useSafeRouter'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Demo Imports
import CommonCard from 'src/components/login/CommonCard'
import CustomInput from 'src/components/login/CustomInput'
import CustomButton from 'src/components/login/CustomButton'

// ** WSO2 Auth Client + Flag + API
import { useAntzAuth } from '@antzsoft/wso2-auth-web/react'
import client from 'src/lib/auth/wso2Client'
import { isWso2AuthEnabled } from 'src/lib/auth/authMode'
import { ssoLoginCheck } from 'src/lib/api/wso-login'
import { write } from 'src/lib/windows/utils'

const LinkStyled = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: `${theme.palette.customColors.OnSecondaryContainer} !important`,
  fontSize: '14px',
  fontWeight: 500
}))

const emailSchema = yup.object().shape({
  email: yup.string().required('Username/Email required').min(1)
})

const passwordSchema = yup.object().shape({
  password: yup.string().required('Password required')
})

const legacySchema = yup.object().shape({
  email: yup.string().required('Username/Email required').min(1),
  password: yup.string().required('Password required')
})

const LoginPage = () => {
  const [loginError, setLoginError] = useState('')
  const [ssoStep, setSsoStep] = useState('email') // 'email' | 'password'
  const [ssoEmail, setSsoEmail] = useState('')
  const [ssoLoading, setSsoLoading] = useState(false)
  const [logoutReasonMsg, setLogoutReasonMsg] = useState('')
  const auth = useAuth()
  const router = useSafeRouter()
  const wso2 = isWso2AuthEnabled()

  // Hook always runs; its result only gates behavior in WSO2 mode.
  const { status } = useAntzAuth(client)

  useEffect(() => {
    if (router.query?.error) {
      setLoginError(decodeURIComponent(router.query.error))
    }
  }, [router.query?.error])

  // Wait for the package's silent-restore to land 'authenticated' before
  // redirecting. The previous synchronous client.isAuthenticated() ran before
  // restore completed, so a returning user briefly saw the login form.
  useEffect(() => {
    if (wso2 && status === 'authenticated') {
      router.replace('/')
    }
  }, [wso2, status])

  const emailForm = useForm({
    defaultValues: { email: '' },
    mode: 'onBlur',
    resolver: yupResolver(emailSchema)
  })

  const passwordForm = useForm({
    defaultValues: { password: '' },
    mode: 'onBlur',
    resolver: yupResolver(passwordSchema)
  })

  const legacyForm = useForm({
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
    resolver: yupResolver(legacySchema)
  })

  const redirectToWso2 = async email => {
    try {
      const userEmail = email || ssoEmail
      const returnUrl = router.query?.returnUrl || '/'
      sessionStorage.setItem('returnUrl', returnUrl)

      await client.login({ loginHint: userEmail?.trim() })
      // await client.login()
    } catch (err) {
      console.error('[Login] client.login() failed:', err)
      setLoginError(err?.message || 'Failed to start SSO — check WSO2 client config')
      setSsoLoading(false)
    }
  }

  // Step 1 — email discovery
  const handleSsoEmailSubmit = async ({ email }) => {
    setLoginError('')
    setLogoutReasonMsg('')
    localStorage.removeItem('logout_reason')
    setSsoLoading(true)

    const res = await ssoLoginCheck({ email })

    // Scenario 3: user not in Antz (or suspended)
    if (res?.success === false) {
      setLoginError(res?.message || 'Login failed')
      setSsoLoading(false)

      return
    }

    const method = res?.data?.auth_method

    // Scenario 1: user in both Antz + WSO2 → straight to WSO2 (keep spinner until redirect)
    if (method === 'sso') {
      setSsoEmail(email)
      await redirectToWso2(email)

      return
    }

    // Scenario 2: user in Antz but not WSO2 → reveal password field
    if (method === 'password') {
      setSsoEmail(email)
      setSsoStep('password')
      setSsoLoading(false)

      return
    }

    setLoginError(res?.message || 'Unexpected response from server')
    setSsoLoading(false)
  }

  // Step 2 — full auth (email + password) → backend provisions WSO2 user → redirect to WSO2
  // Two possible success shapes from the backend:
  //   a) Normal login:  { success: true, token, user: {...}, ... }
  //      → store session directly, update AuthContext, navigate to dashboard
  //   b) SSO provision: { success: true, message: "Proceed with SSO login" }
  //      → redirect to WSO2 PKCE flow
  const handleSsoPasswordSubmit = async ({ password }) => {
    setLoginError('')
    setLogoutReasonMsg('')
    localStorage.removeItem('logout_reason')
    setSsoLoading(true)
    const res = await ssoLoginCheck({ email: ssoEmail, password })

    if (res?.success === false) {
      setLoginError(res?.message || 'Login failed')
      setSsoLoading(false)

      return
    }

    if (res?.token && res?.success) {
      const u = res?.user || {}
      const userData = {
        email: u?.user_email,
        fullName: u?.user_first_name,
        lastName: u?.user_last_name,
        role: 'admin',
        id: u?.user_role_id || res?.roles?.role_id,
        username: u?.user_name || u?.user_first_name
      }
      const roleName = res?.user?.role_name || res?.roles?.role_name
      write('userDetails', res)
      write('role', roleName)
      write('userData', userData)
      window.localStorage.setItem('accessToken', res?.token)
      auth.setUser({ ...userData })
      auth.setUserData({ ...res })

      setSsoLoading(false)
      const returnUrl = router?.query?.returnUrl || '/'
      router.replace(returnUrl)

      return
    }

    // SSO provision response — keep spinner active until WSO2 redirect
    await redirectToWso2(ssoEmail)
  }

  const handleLegacySubmit = data => {
    setLoginError('')
    setLogoutReasonMsg('')
    localStorage.removeItem('logout_reason')
    auth.login({ email: data.email, password: data.password, rememberMe: true }, () =>
      setLoginError('Email or Password is invalid')
    )
  }

  const handleBackToEmail = () => {
    setSsoStep('email')
    setSsoEmail('')
    setLoginError('')
    passwordForm.reset()
  }
  useEffect(() => {
    const reason = localStorage.getItem('logout_reason')
    if (reason === 'session_expired') {
      setLogoutReasonMsg('Your session has expired. Please sign in again.')
    }
    // Do NOT removeItem here — the key must survive intermediate client-side
    // renders (AuthGuard race) and StrictMode double-mounts. Remove only when
    // the user actually interacts (onChange / submit handlers below).
  }, [])

  // While WSO2 silent-restore is in flight, render nothing so a returning
  // authenticated user doesn't see the login form flash before the redirect.
  // Non-SSO mode skips this gate entirely (form renders immediately).
  if (wso2 && (status === 'idle' || status === 'loading')) return null

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default'
      }}
    >
      <CommonCard title='Login to your account' subtitle=''>
        {loginError && (
          <Typography variant='body2' sx={{ mb: 3, color: 'error.main', textAlign: 'center' }}>
            {loginError}
          </Typography>
        )}

        {wso2 && ssoStep === 'email' && (
          <form noValidate autoComplete='off' onSubmit={emailForm.handleSubmit(handleSsoEmailSubmit)}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <Controller
                name='email'
                control={emailForm.control}
                render={({ field: { value, onChange, onBlur } }) => (
                  <CustomInput
                    type='email'
                    name='email'
                    label='Username/Email'
                    placeholder='Enter username/email'
                    value={value}
                    onChange={e => {
                      onChange(e)
                      setLogoutReasonMsg('')
                      localStorage.removeItem('logout_reason')
                    }}
                    onBlur={onBlur}
                    autoComplete='email'
                    error={!!emailForm.formState.errors.email}
                  />
                )}
              />
              {emailForm.formState.errors.email && (
                <FormHelperText sx={{ color: 'error.main', m: 0 }}>
                  {emailForm.formState.errors.email.message}
                </FormHelperText>
              )}
            </FormControl>
            {logoutReasonMsg && (
              <Typography variant='body2' sx={{ mb: 3, color: 'error.main', textAlign: 'center' }}>
                {logoutReasonMsg}
              </Typography>
            )}

            <CustomButton type='submit' fullWidth size='large' sx={{ mb: 4, mt: 3 }} loading={ssoLoading}>
              Continue
            </CustomButton>
          </form>
        )}

        {wso2 && ssoStep === 'password' && (
          <form noValidate autoComplete='off' onSubmit={passwordForm.handleSubmit(handleSsoPasswordSubmit)}>
            <Typography variant='body2' sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
              {ssoEmail}
            </Typography>

            <FormControl fullWidth sx={{ mb: 1 }}>
              <Controller
                name='password'
                control={passwordForm.control}
                render={({ field: { value, onChange, onBlur } }) => (
                  <CustomInput
                    type='password'
                    name='password'
                    label='Password'
                    placeholder='Enter password'
                    value={value}
                    onChange={e => {
                      onChange(e)
                      setLogoutReasonMsg('')
                      localStorage.removeItem('logout_reason')
                    }}
                    onBlur={onBlur}
                    autoComplete='current-password'
                    error={!!passwordForm.formState.errors.password}
                  />
                )}
              />
              {passwordForm.formState.errors.password && (
                <FormHelperText sx={{ color: 'error.main', m: 0 }}>
                  {passwordForm.formState.errors.password.message}
                </FormHelperText>
              )}
            </FormControl>

            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant='body2'
                onClick={handleBackToEmail}
                sx={{ cursor: 'pointer', color: 'customColors.OnSecondaryContainer', fontWeight: 500 }}
              >
                ← Change email
              </Typography>
              {/* <LinkStyled href='/forgot-password'>Forgot Password?</LinkStyled> */}
            </Box>

            <CustomButton type='submit' fullWidth size='large' sx={{ mb: 4, mt: 1 }} loading={ssoLoading}>
              Continue
            </CustomButton>
          </form>
        )}

        {!wso2 && (
          <form noValidate autoComplete='off' onSubmit={legacyForm.handleSubmit(handleLegacySubmit)}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <Controller
                name='email'
                control={legacyForm.control}
                render={({ field: { value, onChange, onBlur } }) => (
                  <CustomInput
                    type='email'
                    name='email'
                    label='Username/Email'
                    placeholder='Enter username/email'
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    autoComplete='email'
                    error={!!legacyForm.formState.errors.email}
                  />
                )}
              />
              {legacyForm.formState.errors.email && (
                <FormHelperText sx={{ color: 'error.main', m: 0 }}>
                  {legacyForm.formState.errors.email.message}
                </FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth sx={{ mb: 1 }}>
              <Controller
                name='password'
                control={legacyForm.control}
                render={({ field: { value, onChange, onBlur } }) => (
                  <CustomInput
                    type='password'
                    label='Password'
                    placeholder='Enter password'
                    name='password'
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    autoComplete='current-password'
                    error={!!legacyForm.formState.errors.password}
                  />
                )}
              />
              {legacyForm.formState.errors.password && (
                <FormHelperText sx={{ color: 'error.main', m: 0 }}>
                  {legacyForm.formState.errors.password.message}
                </FormHelperText>
              )}
            </FormControl>
            <Box sx={{ mb: 4 }}>
              <LinkStyled href='/forgot-password'>Forgot Password?</LinkStyled>
            </Box>

            <CustomButton type='submit' fullWidth size='large' sx={{ mb: 4, mt: 3 }} loading={auth.loginLoading}>
              Login
            </CustomButton>
          </form>
        )}
      </CommonCard>
    </Box>
  )
}

LoginPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
LoginPage.guestGuard = true

export default LoginPage
