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
import SmsIcon from '@mui/icons-material/Sms'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import EmailIcon from '@mui/icons-material/Email'
import CommonCard from 'src/components/login/CommonCard'
import CustomButton from 'src/components/login/CustomButton'
import LoginField from 'src/components/login/LoginField'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import { useRouter } from 'next/router'
import { verifyOTP } from 'src/lib/api/login'
import toast from 'react-hot-toast'

const schema = yup.object().shape({
  //   otp: yup.string().length(4, 'Enter a valid 4-digit OTP').required('OTP is required')
  otp: yup
    .string()
    .matches(/^\d{4}$/, 'OTP must be a 4-digit number')
    .required('OTP is required')
})

const VerifyOtp = () => {
  const theme = useTheme()
  const router = useRouter()
  const { user_id, account_status, user_email, user_mobile_number, temp_auth_token } = router.query

  console.log('Received Data:', {
    user_id,
    account_status,
    user_email,
    user_mobile_number,
    temp_auth_token
  })
  const [countdown, setCountdown] = useState(59)
  const [showResendOptions, setShowResendOptions] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setShowResendOptions(true)
    }
  }, [countdown])

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { otp: '' }
  })

  const onSubmit = async data => {
    console.log('OTP Verified:', data)

    const payload = {
      otp: data.otp,
      user_id: user_id
    }
    try {
      setLoading(true)
      const response = await verifyOTP(payload, temp_auth_token)
      console.log('verify OTP :', response)
      if (response.success === true) {
        toast.success(response?.message)
        const { user_id, profile_pic, user_first_name, user_last_name, temp_auth_token } = response.data
        router.push({
          pathname: '/reset-password',
          query: {
            user_id,
            profile_pic,
            user_first_name,
            user_last_name,
            temp_auth_token
          }
        })
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
      logoSrc='/images/login/Vantara_Logo_registered.svg'
      title='Enter OTP'
      subtitle={`Please enter the 4-digit OTP sent to your phone number ${user_mobile_number} `}
    >
      <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
        <FormControl fullWidth sx={{ mb: 4 }}>
          <Controller
            name='otp'
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <LoginField
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
        </FormControl>

        {!showResendOptions ? (
          <Typography sx={{ mb: 5, color: 'customColors.OnSecondaryContainer', fontSize: '14px', fontWeight: 500 }}>
            Resend OTP in <span style={{ color: theme.palette.primary.main }}>{countdown} Sec</span>
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 6 }}>
            <Button
              variant='text'
              sx={{ color: 'customColors.OnPrimaryContainer', bgcolor: 'customColors.neutral05' }}
              startIcon={<SmsIcon />}
            >
              SMS
            </Button>
            <Button
              variant='text'
              sx={{ color: 'customColors.OnPrimaryContainer', bgcolor: 'customColors.neutral05' }}
              startIcon={<WhatsAppIcon />}
            >
              WhatsApp
            </Button>
            <Button
              variant='text'
              sx={{ color: 'customColors.OnPrimaryContainer', bgcolor: 'customColors.neutral05' }}
              startIcon={<EmailIcon />}
            >
              Email
            </Button>
          </Box>
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
