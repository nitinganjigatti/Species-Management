// ** React Imports
import { useState } from 'react'

// ** Next Imports
import Link from 'next/link'
import { useRouter } from 'next/router'

// ** MUI Components
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { styled } from '@mui/material/styles'

// ** Third Party Imports
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Demo Imports
import CommonCard from 'src/components/login/CommonCard'
import CustomButton from 'src/components/login/CustomButton'
import CustomInput from 'src/components/login/CustomInput'

// ** WSO2 Auth Client + Flag
import client from 'src/lib/auth/wso2Client'
import { isWso2AuthEnabled } from 'src/lib/auth/authMode'

// ** Legacy flow deps
// import { sendOTP } from 'src/lib/api/wso-login'
import { sendOTP } from 'src/lib/api/login'
import { useForgotPassword } from 'src/context/ForgotPasswordContext'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const LinkStyled = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: `${theme.palette.customColors.OnSecondaryContainer} !important`,
  fontSize: '14px',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}))

const schema = yup.object().shape({
  email: yup
    .string()
    .test(
      'username-or-email',
      'Please enter a valid username or email address.',
      value => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value) || /^[A-Za-z0-9]{1,}$/.test(value)
    )
    .required('Username or Email is required')
})

const ForgotPassword = () => {
  const wso2 = isWso2AuthEnabled()
  const router = useRouter()
  const forgotPasswordCtx = useForgotPassword()
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: '' }
  })

  const handleWso2ForgotPassword = () => {
    client.forgotPassword()
  }

  const onSubmit = async data => {
    const payload = {
      user_email: data.email,
      medium: 'whatsapp'
    }
    try {
      setLoading(true)
      const response = await sendOTP(payload)
      if (response.success === true) {
        toast.success(response?.message)
        router.push('/verify-otp')
        forgotPasswordCtx?.setForgotPasswordData(response.data)
      } else {
        toast.error(response?.message)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (wso2) {
    return (
      <CommonCard
        title='Recover account'
        subtitle='You will be redirected to the identity portal to reset your password.'
      >
        <CustomButton fullWidth size='large' sx={{ mb: 4, mt: 3 }} onClick={handleWso2ForgotPassword}>
          Reset Password
        </CustomButton>
        <Typography sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LinkStyled href='/login'>
            <Icon icon='mdi:chevron-left' fontSize='2rem' />
            <span>Back to login</span>
          </LinkStyled>
        </Typography>
      </CommonCard>
    )
  }

  return (
    <CommonCard
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
  )
}

ForgotPassword.guestGuard = true
ForgotPassword.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default ForgotPassword
