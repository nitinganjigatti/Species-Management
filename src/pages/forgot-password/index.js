// ** Next Import
import Link from 'next/link'

// ** MUI Components
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Hooks
import { useSettings } from 'src/@core/hooks/useSettings'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

// ** Demo Imports

import CommonCard from 'src/components/login/CommonCard'
import CustomButton from 'src/components/login/CustomButton'
import CustomInput from 'src/components/login/CustomInput'
import { useRouter } from 'next/router'
import VerifyOtp from '../verify-otp'
import { useState } from 'react'
import { sendOTP } from 'src/lib/api/login'
import toast from 'react-hot-toast'
import Utility from 'src/utility'
import { useForgotPassword } from 'src/context/ForgotPasswordContext'

const TypographyStyled = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  letterSpacing: '0.18px',
  marginBottom: theme.spacing(1.5),
  [theme.breakpoints.down('md')]: { marginTop: theme.spacing(8) }
}))

const ForgotPassword = () => {
  const router = useRouter()
  const theme = useTheme()
  const { settings } = useSettings()
  const { skin } = settings
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const { setForgotPasswordData } = useForgotPassword()

  const schema = yup.object().shape({
    // email: yup.string().email('Enter a valid email').required('Email is required')
    email: yup
      .string()
      .test(
        'username-or-email',
        'Please enter a valid username or email address.',
        value => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value) || /^[A-Za-z0-9]{1,}$/.test(value)
      )
      .required('Username or Email is required')
  })

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: '' }
  })

  const [isOtpSent, setIsOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async data => {
    console.log('Submitted Data:', data)

    const payload = {
      user_email: data.email,
      medium: 'whatsapp'
    }
    try {
      setLoading(true)
      const response = await sendOTP(payload)
      console.log('OTP Sent:', response)
      if (response.success === true) {
        // const { user_id, account_status, user_email, user_mobile_number, temp_auth_token } = response.data

        // const encryptedQuery = Utility.encryptData({
        //   user_id,
        //   account_status,
        //   user_email,
        //   user_mobile_number,
        //   temp_auth_token
        // })
        toast.success(response?.message)

        // setIsOtpSent(true)
        router.push('/verify-otp')
        setForgotPasswordData(response.data)

        // router.push({
        //   pathname: '/verify-otp',
        //   query: { data: encryptedQuery }
        //   // query: {
        //   //   user_id,
        //   //   account_status,
        //   //   user_email,
        //   //   user_mobile_number,
        //   //   temp_auth_token
        //   // }
        // })
        setLoading(false)
      } else {
        toast.error(response?.message)
        setLoading(false)
      }
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  return (
    <>
      {isOtpSent && <VerifyOtp />}
      <CommonCard
        // bgImage='/images/frog_img.png'
        // logoVantara='/images/login/Vantara_Logo_registered.svg'
        // logoAntz
        title='Recover account'
        subtitle='An OTP will be sent via SMS to your phone number for login verification'
      >
        <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Controller
              name='email'
              control={control}
              render={({ field: { value, onChange, onBlur } }) => (
                <CustomInput
                  type='email'
                  name='email'
                  label='Username/Email'
                  placeholder='Enter username/email'
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={!!errors.email}
                  autoComplete='email'
                />
              )}
            />
            {errors.email && <FormHelperText sx={{ color: 'error.main', m: 0 }}>{errors.email.message}</FormHelperText>}
          </FormControl>
          <CustomButton type='submit' fullWidth size='large' sx={{ mb: 4, mt: 3 }} loading={loading}>
            SEND OTP
          </CustomButton>
        </form>
      </CommonCard>
    </>
  )
}

ForgotPassword.guestGuard = true
ForgotPassword.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default ForgotPassword

// // ** Next Import
// import Link from 'next/link'

// // ** MUI Components
// import Button from '@mui/material/Button'
// import TextField from '@mui/material/TextField'
// import Box from '@mui/material/Box'
// import useMediaQuery from '@mui/material/useMediaQuery'
// import { styled, useTheme } from '@mui/material/styles'
// import Typography from '@mui/material/Typography'

// // ** Icon Imports
// import Icon from 'src/@core/components/icon'

// // ** Configs
// import themeConfig from 'src/configs/themeConfig'

// // ** Layout Import
// import BlankLayout from 'src/@core/layouts/BlankLayout'

// // ** Hooks
// import { useSettings } from 'src/@core/hooks/useSettings'

// // ** Demo Imports
// import FooterIllustrationsV2 from 'src/views/pages/auth/FooterIllustrationsV2'

// import PublicLogo from 'src/components/utility/publicLogo'

// // Styled Components
// const ForgotPasswordIllustrationWrapper = styled(Box)(({ theme }) => ({
//   padding: theme.spacing(20),
//   paddingRight: '0 !important',
//   [theme.breakpoints.down('lg')]: {
//     padding: theme.spacing(10)
//   }
// }))

// const ForgotPasswordIllustration = styled('img')(({ theme }) => ({
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

// const LinkStyled = styled(Link)(({ theme }) => ({
//   display: 'flex',
//   '& svg': { mr: 1.5 },
//   alignItems: 'center',
//   textDecoration: 'none',
//   justifyContent: 'center',
//   color: theme.palette.primary.main
// }))

// const ForgotPassword = () => {
//   // ** Hooks
//   const theme = useTheme()
//   const { settings } = useSettings()

//   // ** Vars
//   const { skin } = settings
//   const hidden = useMediaQuery(theme.breakpoints.down('md'))

//   const imageSource =
//     skin === 'bordered' ? 'auth-v2-forgot-password-illustration-bordered' : 'auth-v2-forgot-password-illustration'

//   return (
//     <Box className='content-right'>
//       {!hidden ? (
//         <Box sx={{ flex: 1, display: 'flex', position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
//           <ForgotPasswordIllustrationWrapper>
//             <ForgotPasswordIllustration
//               alt='forgot-password-illustration'
//               src={`/images/pages/${imageSource}-${theme.palette.mode}.png`}
//             />
//           </ForgotPasswordIllustrationWrapper>
//           <FooterIllustrationsV2 image={`/images/pages/auth-v2-forgot-password-mask-${theme.palette.mode}.png`} />
//         </Box>
//       ) : null}
//       <RightWrapper sx={skin === 'bordered' && !hidden ? { borderLeft: `1px solid ${theme.palette.divider}` } : {}}>
//         <Box
//           sx={{
//             p: 7,
//             height: '100%',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             backgroundColor: 'background.paper'
//           }}
//         >
//           <BoxWrapper>
//             <Box
//               sx={{
//                 top: 30,
//                 left: 40,
//                 display: 'flex',
//                 position: 'absolute',
//                 alignItems: 'center',
//                 justifyContent: 'center'
//               }}
//             >
//               <PublicLogo />
//               {/* <svg width={47} fill='none' height={26} viewBox='0 0 268 150' xmlns='http://www.w3.org/2000/svg'>
//                 <rect
//                   rx='25.1443'
//                   width='50.2886'
//                   height='143.953'
//                   fill={theme.palette.primary.main}
//                   transform='matrix(-0.865206 0.501417 0.498585 0.866841 195.571 0)'
//                 />
//                 <rect
//                   rx='25.1443'
//                   width='50.2886'
//                   height='143.953'
//                   fillOpacity='0.4'
//                   fill='url(#paint0_linear_7821_79167)'
//                   transform='matrix(-0.865206 0.501417 0.498585 0.866841 196.084 0)'
//                 />
//                 <rect
//                   rx='25.1443'
//                   width='50.2886'
//                   height='143.953'
//                   fill={theme.palette.primary.main}
//                   transform='matrix(0.865206 0.501417 -0.498585 0.866841 173.147 0)'
//                 />
//                 <rect
//                   rx='25.1443'
//                   width='50.2886'
//                   height='143.953'
//                   fill={theme.palette.primary.main}
//                   transform='matrix(-0.865206 0.501417 0.498585 0.866841 94.1973 0)'
//                 />
//                 <rect
//                   rx='25.1443'
//                   width='50.2886'
//                   height='143.953'
//                   fillOpacity='0.4'
//                   fill='url(#paint1_linear_7821_79167)'
//                   transform='matrix(-0.865206 0.501417 0.498585 0.866841 94.1973 0)'
//                 />
//                 <rect
//                   rx='25.1443'
//                   width='50.2886'
//                   height='143.953'
//                   fill={theme.palette.primary.main}
//                   transform='matrix(0.865206 0.501417 -0.498585 0.866841 71.7728 0)'
//                 />
//                 <defs>
//                   <linearGradient
//                     y1='0'
//                     x1='25.1443'
//                     x2='25.1443'
//                     y2='143.953'
//                     id='paint0_linear_7821_79167'
//                     gradientUnits='userSpaceOnUse'
//                   >
//                     <stop />
//                     <stop offset='1' stopOpacity='0' />
//                   </linearGradient>
//                   <linearGradient
//                     y1='0'
//                     x1='25.1443'
//                     x2='25.1443'
//                     y2='143.953'
//                     id='paint1_linear_7821_79167'
//                     gradientUnits='userSpaceOnUse'
//                   >
//                     <stop />
//                     <stop offset='1' stopOpacity='0' />
//                   </linearGradient>
//                 </defs>
//               </svg>
//               <Typography variant='h6' sx={{ ml: 2, lineHeight: 1, fontWeight: 700, fontSize: '1.5rem !important' }}>
//                 {themeConfig.templateName}
//               </Typography> */}
//             </Box>
//             <Box sx={{ mb: 6 }}>
//               <TypographyStyled variant='h5'>Forgot Password? 🔒</TypographyStyled>
//               <Typography variant='body2'>
//                 Enter your email and we&prime;ll send you instructions to reset your password
//               </Typography>
//             </Box>
//             <form noValidate autoComplete='off' onSubmit={e => e.preventDefault()}>
//               <TextField autoFocus type='email' label='Email' sx={{ display: 'flex', mb: 4 }} />
//               <Button fullWidth size='large' type='submit' variant='contained' sx={{ mb: 5.25 }}>
//                 Send reset link
//               </Button>
//               <Typography sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                 <LinkStyled href='/login'>
//                   <Icon icon='mdi:chevron-left' fontSize='2rem' />
//                   <span>Back to login</span>
//                 </LinkStyled>
//               </Typography>
//             </form>
//           </BoxWrapper>
//         </Box>
//       </RightWrapper>
//     </Box>
//   )
// }
// ForgotPassword.guestGuard = true
// ForgotPassword.getLayout = page => <BlankLayout>{page}</BlankLayout>

// export default ForgotPassword
