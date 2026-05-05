// ** React Imports
import { useEffect, useState } from 'react'

// ** Next Imports
import Link from 'next/link'
import Image from 'next/image'

// ** MUI Components
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import useMediaQuery from '@mui/material/useMediaQuery'
import OutlinedInput from '@mui/material/OutlinedInput'
import { styled, useTheme } from '@mui/material/styles'
import MuiCard from '@mui/material/Card'
import FormHelperText from '@mui/material/FormHelperText'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import toast from 'react-hot-toast'

// ** Hooks
import { useAuth } from 'src/hooks/useAuth'
import { useSettings } from 'src/@core/hooks/useSettings'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Demo Imports
import CommonCard from 'src/components/login/CommonCard'
import CustomInput from 'src/components/login/CustomInput'
import CustomButton from 'src/components/login/CustomButton'
import { describeGeofenceError } from 'src/lib/geofence/copy'
import { getGeolocationPermission } from 'src/lib/geofence/permission'

// ** Custom Components

// ** Styled Components
const LinkStyled = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: `${theme.palette.customColors.OnSecondaryContainer} !important`,
  fontSize: '14px',
  fontWeight: 500
}))

const schema = yup.object().shape({
  email: yup.string().required('Username/Email required').min(1),

  // password: yup.string().trim('Password required').required()
  password: yup.string().required('Password required')
})

const defaultValues = {
  password: '',
  email: ''
}

const LoginPage = () => {
  const [rememberMe, setRememberMe] = useState(true)
  const [loginError, setLoginError] = useState('')

  // ** Hooks
  const auth = useAuth()
  const theme = useTheme()
  const { settings } = useSettings()

  // Geofence error lives in AuthContext so it survives GuestGuard fallback swaps.
  const geofenceError = auth.geofenceLoginError

  useEffect(() => {
    if (sessionStorage.getItem('session_expired') === 'true') {
      sessionStorage.removeItem('session_expired')
      toast.error('Session expired. Please log in again.')
    }
  }, [])

  // Pre-flight geolocation permission check. If the browser already has a denied
  // permission for this site, surface the modal proactively so the user knows
  // before typing credentials. Listens for permission changes — if they re-grant
  // while the modal is open, dismiss it automatically.
  useEffect(() => {
    let permissionStatus = null
    let cancelled = false

    const showDeniedModal = () => {
      auth.setGeofenceLoginError?.({
        kind: 'geofence',
        code: 'permission_denied',
        message: 'Location permission is blocked',
        data: {}
      })
    }

    const handleChange = () => {
      if (!permissionStatus) return
      if (permissionStatus.state === 'denied') {
        showDeniedModal()
      } else {
        // Granted or back to prompt — dismiss the proactive modal so they can log in
        auth.clearGeofenceLoginError?.()
      }
    }

    ;(async () => {
      const state = await getGeolocationPermission()
      if (cancelled) return
      if (state === 'denied' || state === 'unsupported') {
        showDeniedModal()
      }
      // Subscribe to live permission changes (Chrome / modern Safari)
      if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
        try {
          permissionStatus = await navigator.permissions.query({ name: 'geolocation' })
          if (cancelled) return
          permissionStatus.addEventListener?.('change', handleChange)
        } catch {
          // Older Safari may throw — non-fatal
        }
      }
    })()

    return () => {
      cancelled = true
      permissionStatus?.removeEventListener?.('change', handleChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Vars
  const { skin } = settings

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onBlur',
    resolver: yupResolver(schema)
  })

  const onSubmit = async data => {
    const { email, password } = data
    setLoginError('')
    auth.clearGeofenceLoginError?.()
    auth.login({ email, password, rememberMe }, err => {
      // err is either a string (bad credentials) or { kind: 'geofence', ... } from AuthContext.
      // The geofence path is also written to auth.geofenceLoginError in the context, which the
      // modal reads — this callback only needs to handle non-geofence errors.
      if (!err || typeof err !== 'object' || err.kind !== 'geofence') {
        setLoginError('Email or Password is invalid')
      }
    })
  }

  const geofenceCopy = geofenceError ? describeGeofenceError(geofenceError) : null
  const isError = geofenceCopy?.severity === 'error'

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        position: 'relative'
      }}
    >
      <Dialog
        open={!!geofenceCopy}
        onClose={(_, reason) => {
          // Block backdrop click + ESC dismiss — user must explicitly Close or Retry.
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return
          auth.clearGeofenceLoginError?.()
        }}
        disableEscapeKeyDown
        aria-labelledby='geofence-error-title'
        aria-describedby='geofence-error-body'
        maxWidth='xs'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: isError ? 'error.main' : 'warning.main',
            boxShadow: theme =>
              `0 16px 40px -12px ${isError ? theme.palette.error.main : theme.palette.warning.main}55`
          }
        }}
      >
        {geofenceCopy && (
          <>
            <Box
              sx={{
                px: 4,
                py: 2.5,
                bgcolor: isError ? 'error.main' : 'warning.main',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Icon icon={geofenceCopy.icon} fontSize={22} />
              <Typography
                id='geofence-error-title'
                variant='subtitle1'
                sx={{ fontWeight: 700, color: '#fff', flex: 1 }}
              >
                {geofenceCopy.title}
              </Typography>
            </Box>
            <Box sx={{ px: 4, py: 3 }}>
              <Typography
                id='geofence-error-body'
                variant='body2'
                sx={{ color: 'customColors.OnSurfaceVariant', lineHeight: 1.6, mb: 2.5 }}
              >
                {geofenceCopy.body}
              </Typography>
              {geofenceError?.code === 'outside_geofence' && typeof geofenceError?.data?.distance_m === 'number' && (
                <Box
                  sx={{
                    mb: 2.5,
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: 'customColors.BgTeritary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Icon icon='mdi:map-marker-distance' fontSize={18} />
                  <Typography variant='caption' sx={{ color: 'customColors.OnSurfaceVariant', fontWeight: 500 }}>
                    Approx. distance from facility:{' '}
                    <strong>
                      {geofenceError.data.distance_m >= 1000
                        ? `${(geofenceError.data.distance_m / 1000).toFixed(1)} km`
                        : `${Math.round(geofenceError.data.distance_m)} m`}
                    </strong>
                  </Typography>
                </Box>
              )}
              <Button
                variant='contained'
                fullWidth
                onClick={() => auth.clearGeofenceLoginError?.()}
                sx={{
                  height: 44,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                Got it
              </Button>
            </Box>
          </>
        )}
      </Dialog>
      <CommonCard
        // bgImage='/images/frog_img.png'
        // logoVantara='/images/login/Vantara_Logo_registered.svg'
        // logoAntz
        title='Login to your account'
        subtitle=''
      >
        <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          {loginError && (
            <Typography
              variant='body2'
              sx={{
                mb: 3,
                color: 'error.main',
                textAlign: 'center'
              }}
            >
              {loginError}
            </Typography>
          )}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Controller
              name='email'
              control={control}
              rules={{ required: true }}
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
                  error={!!errors.email}
                />
              )}
            />
            {errors.email && <FormHelperText sx={{ color: 'error.main', m: 0 }}>{errors.email.message}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth sx={{ mb: 1 }}>
            <Controller
              name='password'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange, onBlur } }) => (
                <CustomInput
                  type={'password'}
                  label='Password'
                  placeholder='Enter password'
                  name='password'
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  autoComplete='current-password'
                  error={!!errors.password}
                />
              )}
            />
            {errors.password && (
              <FormHelperText sx={{ color: 'error.main', m: 0 }}>{errors.password.message}</FormHelperText>
            )}
          </FormControl>
          <Box sx={{ mb: 4 }}>
            <LinkStyled href='/forgot-password'>Forgot Password?</LinkStyled>
          </Box>

          <CustomButton type='submit' fullWidth size='large' sx={{ mb: 4, mt: 3 }} loading={auth.loginLoading}>
            Login
          </CustomButton>
        </form>
      </CommonCard>
    </Box>
  )
}

LoginPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
LoginPage.guestGuard = true

export default LoginPage

// // ** React Imports
// import { useState } from 'react'

// // ** Next Imports
// import Link from 'next/link'

// // ** MUI Components
// import Alert from '@mui/material/Alert'
// import Button from '@mui/material/Button'
// import Divider from '@mui/material/Divider'
// import Checkbox from '@mui/material/Checkbox'
// import TextField from '@mui/material/TextField'
// import InputLabel from '@mui/material/InputLabel'
// import IconButton from '@mui/material/IconButton'
// import CardContent from '@mui/material/CardContent'
// import Box from '@mui/material/Box'
// import FormControl from '@mui/material/FormControl'
// import useMediaQuery from '@mui/material/useMediaQuery'
// import OutlinedInput from '@mui/material/OutlinedInput'
// import { styled, useTheme } from '@mui/material/styles'
// import MuiCard from '@mui/material/Card'
// import FormHelperText from '@mui/material/FormHelperText'
// import InputAdornment from '@mui/material/InputAdornment'
// import Typography from '@mui/material/Typography'
// import MuiFormControlLabel from '@mui/material/FormControlLabel'

// // ** Icon Imports
// import Icon from 'src/@core/components/icon'

// // ** Third Party Imports
// import * as yup from 'yup'
// import { useForm, Controller } from 'react-hook-form'
// import { yupResolver } from '@hookform/resolvers/yup'

// import Image from 'next/image'

// // ** Hooks
// import { useAuth } from 'src/hooks/useAuth'
// import useBgColor from 'src/@core/hooks/useBgColor'
// import { useSettings } from 'src/@core/hooks/useSettings'

// // ** Configs
// import themeConfig from 'src/configs/themeConfig'

// // ** Layout Import
// import BlankLayout from 'src/@core/layouts/BlankLayout'

// // ** Demo Imports
// import FooterIllustrationsV2 from 'src/views/pages/auth/FooterIllustrationsV2'

// import PublicLogo from 'src/components/utility/publicLogo'

// // ** Styled Components
// const LoginIllustrationWrapper = styled(Box)(({ theme }) => ({
//   padding: theme.spacing(20),
//   paddingRight: '0 !important',
//   [theme.breakpoints.down('lg')]: {
//     padding: theme.spacing(10)
//   }
// }))

// // ** Styled Components
// const Card = styled(MuiCard)(({ theme }) => ({
//   [theme.breakpoints.up('sm')]: { width: '25rem', textAlign: 'center', marginRight: '5%' }
// }))

// const LinkStyled = styled(Link)(({ theme }) => ({
//   textDecoration: 'none',
//   color: `${theme.palette.primary.main} !important`
// }))

// const FormControlLabel = styled(MuiFormControlLabel)(({ theme }) => ({
//   '& .MuiFormControlLabel-label': {
//     color: theme.palette.text.secondary
//   }
// }))

// const LoginIllustration = styled('img')(({ theme }) => ({
//   maxWidth: '48rem',
//   [theme.breakpoints.down('xl')]: {
//     maxWidth: '38rem'
//   },
//   [theme.breakpoints.down('lg')]: {
//     maxWidth: '30rem'
//   }
// }))

// const RightWrapper = styled(Box)(({ theme }) => ({
//   width: '100%',
//   [theme.breakpoints.up('md')]: {
//     maxWidth: 400
//   },
//   [theme.breakpoints.up('lg')]: {
//     maxWidth: 450
//   }
// }))

// const BoxWrapper = styled(Box)(({ theme }) => ({
//   width: '100%',
//   [theme.breakpoints.down('md')]: {
//     maxWidth: 400
//   }
// }))

// const TypographyStyled = styled(Typography)(({ theme }) => ({
//   fontWeight: 600,
//   letterSpacing: '0.18px',
//   marginBottom: theme.spacing(1.5),
//   [theme.breakpoints.down('md')]: { marginTop: theme.spacing(8) }
// }))

// const schema = yup.object().shape({
//   email: yup.string().required('Username/Email required').min(4),
//   password: yup.string().trim('').required()
// })

// const defaultValues = {
//   password: '',
//   email: ''
// }

// const LoginPage = () => {
//   const [rememberMe, setRememberMe] = useState(true)
//   const [showPassword, setShowPassword] = useState(false)

//   // ** Hooks
//   const auth = useAuth()
//   const theme = useTheme()
//   const bgColors = useBgColor()
//   const { settings } = useSettings()
//   const hidden = useMediaQuery(theme.breakpoints.down('md'))

//   // ** Vars
//   const { skin } = settings

//   const {
//     control,
//     setError,
//     handleSubmit,
//     formState: { errors }
//   } = useForm({
//     defaultValues,
//     mode: 'onBlur',
//     resolver: yupResolver(schema)
//   })

//   const onSubmit = data => {
//     const { email, password } = data
//     auth.login({ email, password, rememberMe }, () => {
//       setError('email', {
//         type: 'manual',
//         message: 'Email or Password is invalid'
//       })
//     })
//   }
//   const imageSource = skin === 'bordered' ? 'auth-v2-login-illustration-bordered' : 'auth-v2-login-illustration'

//   return (
//     <Box
//       className=''
//       sx={{
//         height: '100vh',
//         width: '100vw',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'flex-end',
//         backgroundImage: 'url(/images/frog_img.png)',
//         backgroundSize: 'cover',
//         backgroundPosition: 'bottom',
//         padding: '1.25rem'
//       }}
//     >
//       <Card sx={{ background: 'transparent', border: '1px solid transparent', pt: 13 }}>
//         <CardContent className='element' sx={{ p: theme => `${theme.spacing(10.5, 8, 8)} !important` }}>
//           <RightWrapper sx={skin === 'bordered' && !hidden ? { borderLeft: `1px solid ${theme.palette.divider}` } : {}}>
//             <Box
//               sx={{
//                 // p: 7,
//                 height: '100%',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 backgroundColor: 'transparent'
//               }}
//             >
//               <BoxWrapper>
//                 <Box
//                   sx={{
//                     top: 30,
//                     left: 40,
//                     display: 'flex',
//                     position: 'absolute',
//                     alignItems: 'center',
//                     justifyContent: 'center'
//                   }}
//                 >
//                   {/* <PublicLogo /> */}
//                 </Box>
//                 <Box sx={{ mb: 6 }}>
//                   <img src='/images/branding/Antz_logo_color.svg' />
//                   <TypographyStyled variant='h5' sx={{ color: '#fff' }}>
//                     <span style={{ color: '#37BD69' }}>Login</span> to your account
//                   </TypographyStyled>
//                   <Typography variant='body2' sx={{ color: '#fff', fontSize: '13px' }}>
//                     Access exclusive features with ease
//                   </Typography>
//                 </Box>

//                 <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
//                   <FormControl fullWidth sx={{ mb: 4, mt: 4, borderColor: 'white' }}>
//                     <Controller
//                       name='email'
//                       control={control}
//                       rules={{ required: true }}
//                       render={({ field: { value, onChange, onBlur } }) => (
//                         <TextField
//                           autoFocus
//                           label='Username/Email'
//                           value={value}
//                           onBlur={onBlur}
//                           onChange={onChange}
//                           error={Boolean(errors.email)}
//                           InputProps={{
//                             style: { color: 'white', height: '50px' }
//                           }}
//                           InputLabelProps={{
//                             style: { color: 'white' }
//                           }}
//                           sx={{
//                             '& .MuiOutlinedInput-root': {
//                               '& fieldset': {
//                                 borderColor: 'white'
//                               },
//                               '&:hover fieldset': {
//                                 borderColor: 'white'
//                               },
//                               '&.Mui-focused fieldset': {
//                                 borderColor: 'white'
//                               }
//                             },
//                             '& .MuiInputBase-input': {
//                               color: 'white'
//                             },
//                             '& .MuiInputLabel-root': {
//                               color: 'white'
//                             },
//                             '& .MuiFormHelperText-root': {
//                               color: 'white'
//                             },

//                             '& .MuiInputBase-root:hover': {
//                               borderColor: 'white'
//                             },
//                             '& .MuiOutlinedInput-notchedOutline': {
//                               borderColor: 'white!important'
//                             }
//                           }}
//                         />
//                       )}
//                     />
//                     {errors.email && (
//                       <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText>
//                     )}
//                   </FormControl>
//                   <FormControl fullWidth>
//                     <InputLabel
//                       htmlFor='auth-login-v2-password'
//                       error={Boolean(errors.password)}
//                       sx={{
//                         color: 'white',
//                         '&.Mui-focused': {
//                           color: 'white'
//                         },
//                         '&.Mui-error': {
//                           color: 'white'
//                         }
//                       }}
//                     >
//                       Password
//                     </InputLabel>
//                     <Controller
//                       name='password'
//                       control={control}
//                       rules={{ required: true }}
//                       render={({ field: { value, onChange, onBlur } }) => (
//                         <OutlinedInput
//                           value={value}
//                           onBlur={onBlur}
//                           label='Password'
//                           onChange={onChange}
//                           id='auth-login-v2-password'
//                           error={Boolean(errors.password)}
//                           type={showPassword ? 'text' : 'password'}
//                           endAdornment={
//                             <InputAdornment position='end'>
//                               <IconButton
//                                 edge='end'
//                                 onMouseDown={e => e.preventDefault()}
//                                 onClick={() => setShowPassword(!showPassword)}
//                                 sx={{ color: 'white' }}
//                               >
//                                 <Icon icon={showPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} fontSize={20} />
//                               </IconButton>
//                             </InputAdornment>
//                           }
//                           sx={{
//                             height: '50px',
//                             '& .MuiOutlinedInput-root': {
//                               '& fieldset': {
//                                 borderColor: 'white'
//                               },
//                               '&:hover fieldset': {
//                                 borderColor: 'white'
//                               },
//                               '&.Mui-focused fieldset': {
//                                 borderColor: 'white'
//                               }
//                             },
//                             '& .MuiInputBase-input': {
//                               color: 'white'
//                             },
//                             '& .MuiFormHelperText-root': {
//                               color: 'white'
//                             },
//                             '& .MuiIconButton-root': {
//                               color: 'white'
//                             },
//                             '& .MuiOutlinedInput-notchedOutline': {
//                               borderColor: 'white!important'
//                             }
//                           }}
//                         />
//                       )}
//                     />
//                     {errors.password && (
//                       <FormHelperText sx={{ color: 'error.main' }} id=''>
//                         {errors.password.message}
//                       </FormHelperText>
//                     )}
//                   </FormControl>
//                   <Box
//                     sx={{
//                       mb: 4,
//                       display: 'flex',
//                       alignItems: 'center',
//                       flexWrap: 'wrap',
//                       justifyContent: 'space-between'
//                     }}
//                   >
//                     {' '}
//                     {/* <Typography
//                       sx={{ marginLeft: 'auto', mt: 3, color: '#E4B819', textDecoration: 'underline', fontSize: 12 }}
//                       variant='body2'
//                       color='primary'
//                     >
//                       Forgot Password
//                     </Typography> */}
//                   </Box>

//                   <Button fullWidth size='large' type='submit' variant='contained' sx={{ mb: 5 }}>
//                     Login
//                   </Button>
//                 </form>
//               </BoxWrapper>
//             </Box>
//           </RightWrapper>
//         </CardContent>
//         <Typography sx={{ mt: 4, color: '#fff', fontSize: 11 }}>
//           Copyright © 2024 Antz systmes. All Rights Reserved
//         </Typography>
//       </Card>
//     </Box>
//   )
// }
// LoginPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
// LoginPage.guestGuard = true

// export default LoginPage
