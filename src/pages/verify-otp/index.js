import { useState, useEffect } from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Button from '@mui/material/Button'
import { useTheme, styled } from '@mui/material/styles'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import CommonCard from 'src/components/login/CommonCard'
import CustomButton from 'src/components/login/CustomButton'
import CustomInput from 'src/components/login/CustomInput'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import { useRouter } from 'next/router'
import { sendOTP, verifyOTP } from 'src/lib/api/login'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { CircularProgress } from '@mui/material'
import Utility from 'src/utility'
import { useForgotPassword } from 'src/context/ForgotPasswordContext'

const schema = yup.object().shape({
  //   otp: yup.string().length(4, 'Enter a valid 4-digit OTP').required('OTP is required')
  // otp: yup
  //   .string()
  //   .matches(/^\d{4}$/, 'OTP must be a 4-digit number')
  //   .required('OTP is required')
  otp: yup
    .string()
    .test('len', 'OTP must be a 4-digit number', value => !value || value.length <= 4)
    .matches(/^\d{4}$/, 'OTP must be a 4-digit number')
    .required('OTP is required')
})

const VerifyOtp = () => {
  const theme = useTheme()
  const router = useRouter()
  const { data } = router.query
  const userData = data ? Utility.decryptData(data) : null
  const { forgotPasswordData, setForgotPasswordData, setVerifyOtpData } = useForgotPassword()

  const initialCountdown = 59
  const [countdown, setCountdown] = useState(0)
  const [showResendOptions, setShowResendOptions] = useState(false)
  const [loading, setLoading] = useState(false)

  const [loadingStates, setLoadingStates] = useState({
    sms: false,
    whatsapp: false,
    email: false
  })

  console.log('forgotPasswordData:', forgotPasswordData)

  // useEffect(() => {
  //   if (countdown > 0) {
  //     const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
  //     return () => clearTimeout(timer)
  //   } else {
  //     setShowResendOptions(true)
  //   }
  // }, [countdown])

  useEffect(() => {
    const storedTimestamp = localStorage.getItem('otpTimestamp')
    const storedCountdown = localStorage.getItem('otpCountdown')

    if (storedTimestamp && storedCountdown) {
      const elapsedTime = Math.floor((Date.now() - parseInt(storedTimestamp, 10)) / 1000)
      const remainingTime = parseInt(storedCountdown, 10) - elapsedTime

      if (remainingTime > 0) {
        setCountdown(remainingTime)
        setShowResendOptions(false)
      } else {
        setShowResendOptions(true)
      }
    } else {
      localStorage.setItem('otpTimestamp', Date.now().toString())
      localStorage.setItem('otpCountdown', initialCountdown.toString())
      setCountdown(initialCountdown)
      setShowResendOptions(false)
    }
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prevCountdown => {
          if (prevCountdown <= 1) {
            clearInterval(timer)
            setShowResendOptions(true)
            localStorage.removeItem('otpTimestamp')
            localStorage.removeItem('otpCountdown')

            return 0
          }
          localStorage.setItem('otpCountdown', (prevCountdown - 1).toString())

          return prevCountdown - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [countdown])

  const sendOtpRequest = async medium => {
    const payload = {
      user_email: forgotPasswordData?.user_email,
      medium: medium
    }

    try {
      setLoadingStates(prev => ({ ...prev, [medium]: true }))
      const response = await sendOTP(payload)
      console.log(`OTP Sent via ${medium}:`, response)

      if (response.success === true) {
        setForgotPasswordData(response.data)
        toast.success(response?.message)
        localStorage.setItem('otpTimestamp', Date.now().toString())
        localStorage.setItem('otpCountdown', initialCountdown.toString())
        setCountdown(initialCountdown)
        setShowResendOptions(false)
        setLoadingStates(prev => ({ ...prev, [medium]: false }))

        // const { user_id, account_status, user_email, user_mobile_number, temp_auth_token } = response.data

        // console.log('User Details:', {
        //   user_id,
        //   account_status,
        //   user_email,
        //   user_mobile_number,
        //   temp_auth_token
        // })

        // toast.success(response?.message)
        // setLoadingStates(prev => ({ ...prev, [medium]: false }))
        // router.push({
        //   pathname: '/verify-otp',
        //   query: {
        //     user_id,
        //     account_status,
        //     user_email,
        //     user_mobile_number,
        //     temp_auth_token
        //   }
        // })
      } else {
        toast.error(response?.message)
      }
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong, please try again.')
    } finally {
      setLoadingStates(prev => ({ ...prev, [medium]: false }))
    }
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { otp: '' }
  })

  const onSubmit = async data => {
    console.log('OTP Verified:', data)

    const payload = {
      otp: data.otp,

      // user_id: userData?.user_id
      user_id: forgotPasswordData?.user_id
    }
    try {
      setLoading(true)
      const response = await verifyOTP(payload, forgotPasswordData?.temp_auth_token)
      console.log('verify OTP :', response)
      if (response.success === true) {
        setVerifyOtpData(response.data)
        toast.success(response?.message)
        localStorage.removeItem('otpTimestamp')
        localStorage.removeItem('otpCountdown')
        router.push('/reset-password')

        // const { user_id, profile_pic, user_first_name, user_last_name, temp_auth_token } = response.data

        // const encryptedQuery = Utility.encryptData({
        //   user_id,
        //   profile_pic,
        //   user_first_name,
        //   user_last_name,
        //   temp_auth_token
        // })
        // router.push({
        //   pathname: '/reset-password',
        //   query: { data: encryptedQuery }
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
    <CommonCard
      // bgImage='/images/frog_img.png'
      // logoVantara='/images/login/Vantara_Logo_registered.svg'
      // logoAntz
      title='Enter OTP'
      subtitle={`Please enter the 4-digit OTP sent to your phone number ${
        forgotPasswordData?.user_mobile_number && forgotPasswordData?.user_mobile_number
      } `}
    >
      <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
        <FormControl fullWidth sx={{ mb: 6 }}>
          <Controller
            name='otp'
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <CustomInput
                type='otp'
                label='OTP'
                placeholder='Enter the OTP'
                value={value}
                onChange={e => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, '')
                  if (numericValue.length > 4) {
                    setError('otp', { type: 'manual', message: 'OTP cannot exceed 4 digits' })
                  } else {
                    clearErrors('otp')
                  }
                  onChange(numericValue)
                }}
                onBlur={onBlur}
                error={!!errors.otp}
                isOtp
              />
            )}
          />
          {errors.otp && <FormHelperText sx={{ color: 'error.main' }}>{errors.otp.message}</FormHelperText>}
        </FormControl>
        {/* <FormControl fullWidth sx={{ mb: 4 }}>
          <Controller
            name='otp'
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <CustomInput
                type='otp'
                label='OTP'
                placeholder='Enter the OTP'
                value={value}
                onChange={e => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, '')
                  onChange(numericValue)
                }}
                onBlur={onBlur}
                error={!!errors.otp}
                isOtp
              />
            )}
          />
          {errors.otp && <FormHelperText sx={{ color: 'error.main' }}>{errors.otp.message}</FormHelperText>}
        </FormControl> */}

        {!showResendOptions ? (
          <Typography sx={{ mb: 6, color: 'customColors.OnSecondaryContainer', fontSize: '14px', fontWeight: 500 }}>
            Resend OTP in <span style={{ color: theme.palette.primary.main }}>{countdown} Sec</span>
          </Typography>
        ) : (
          <>
            <Typography
              sx={{
                mb: 3,
                color: 'customColors.OnSurfaceVariant',
                fontSize: '14px',
                fontWeight: 400,
                textAlign: 'center'
              }}
            >
              Didn’t receive OTP? Resend via
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 6 }}>
              <Button
                variant='text'
                sx={{ color: 'customColors.OnPrimaryContainer', bgcolor: 'customColors.neutral05' }}
                startIcon={!loadingStates.sms && <Icon icon='ic:outline-sms' />}
                onClick={() => sendOtpRequest('sms')}
              >
                {loadingStates.sms ? <CircularProgress size={20} /> : 'SMS'}{' '}
              </Button>
              <Button
                variant='text'
                sx={{ color: 'customColors.OnPrimaryContainer', bgcolor: 'customColors.neutral05' }}
                startIcon={!loadingStates.whatsapp && <Icon icon='ic:outline-whatsapp' />}
                onClick={() => sendOtpRequest('whatsapp')}
              >
                {loadingStates.whatsapp ? <CircularProgress size={20} /> : 'WhatsApp'}
              </Button>
              {/* <Button
                variant='text'
                sx={{ color: 'customColors.OnPrimaryContainer', bgcolor: 'customColors.neutral05' }}
                startIcon={!loadingStates.email && <Icon icon='ic:outline-email' />}
                onClick={() => sendOtpRequest('email')}
              >
                {loadingStates.email ? <CircularProgress size={20} /> : 'Email'}
              </Button> */}
            </Box>
          </>
        )}

        <CustomButton type='submit' fullWidth size='large' sx={{ mb: 3 }} loading={loading}>
          VERIFY OTP
        </CustomButton>
      </form>
    </CommonCard>
  )
}

VerifyOtp.guestGuard = true
VerifyOtp.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default VerifyOtp
