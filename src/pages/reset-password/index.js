import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import CommonCard from 'src/components/login/CommonCard'
import CustomButton from 'src/components/login/CustomButton'
import CustomInput from 'src/components/login/CustomInput'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import { Avatar, FormHelperText } from '@mui/material'
import { useRouter } from 'next/router'
import { resetPassword } from 'src/lib/api/login'
import toast from 'react-hot-toast'
import Utility from 'src/utility'
import { useForgotPassword } from 'src/context/ForgotPasswordContext'

const ResetPassword = () => {
  const [isInteracted, setIsInteracted] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { data } = router.query
  const userData = data ? Utility.decryptData(data) : null

  const { verifyOtpData, clearForgotPasswordData } = useForgotPassword()

  const {
    control,
    handleSubmit,
    watch,
    formState: { touchedFields, errors }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  })

  const newPassword = watch('newPassword')
  const confirmPassword = watch('confirmPassword')

  useEffect(() => {
    if (newPassword && !isInteracted) {
      setIsInteracted(true)
    }
  }, [newPassword, isInteracted])

 
  const validations = {
    minChars: newPassword.length >= 8,

   
    numerical: /[0-9]/.test(newPassword),
    special: /[@#$&*]/.test(newPassword),
    passwordMismatch: confirmPassword ? confirmPassword !== newPassword : false
  }

  const onSubmit = async data => {
    console.log('Form submitted successfully', data)

   
    const payload = {
      user_id: verifyOtpData?.user_id,
      new_password: data.newPassword
    }
    try {
      setLoading(true)
      const response = await resetPassword(payload, verifyOtpData?.temp_auth_token)
      console.log('resetPasswords :', response)
      if (response.success === true) {
        toast.success(response?.message)
        router.push('/login')
        clearForgotPasswordData()
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

  const hasErrors = () => {
    return (
      !validations.minChars ||
      !validations.upperCase ||
      !validations.numerical ||
      !validations.special ||
      validations.passwordMismatch
    )
  }

  const getColor = isValid => {
    if (!isInteracted) return 'customColors.OnSurfaceVariant'

    return isValid ? 'success.main' : 'error.main'
  }

  return (
    <CommonCard

      // bgImage='/images/frog_img.png'
      // logoVantara='/images/login/Vantara_Logo_registered.svg'
      // logoAntz
      title='Reset password'
      subtitle={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            bgcolor: '#FFFFFF66',
            p: 1,
            pr: verifyOtpData ? 2 : 0,
            borderRadius: 4
          }}
        >
          <Avatar src={verifyOtpData?.profile_pic} alt='User' sx={{ width: 40, height: 40, mr: 1.5 }} />
          <Typography sx={{ color: 'customColors.OnSurfaceVariant', fontSize: '14px', fontWeight: 500 }}>
            {verifyOtpData?.user_first_name && verifyOtpData?.user_last_name
              ? `${verifyOtpData?.user_first_name} ${verifyOtpData?.user_last_name}`
              : ''}
          </Typography>
        </Box>
      }
    >
      <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <Controller
            name='newPassword'
            control={control}
            rules={{
              required: 'Please enter a new password',
              validate: {
                minChars: value => value.length >= 8,

                // upperCase: value => /[A-Z]/.test(value),
                numerical: value => /[0-9]/.test(value),
                special: value => /[@#$&*]/.test(value)
              }
            }}
            render={({ field }) => (
              <CustomInput
                type='password'
                label='New password'
                placeholder='New password'
                value={field.value}
                onChange={e => {
                  field.onChange(e)
                  if (!isInteracted && e.target.value) {
                    setIsInteracted(true)
                  }
                }}
                onFocus={() => {
                  field.onFocus()
                  setIsInteracted(true)
                }}
                onBlur={field.onBlur}
                name={field.name}
                error={false}
              />
            )}
          />
          {errors.newPassword && (
            <FormHelperText sx={{ color: 'error.main', m: 0 }}>{errors.newPassword.message}</FormHelperText>
          )}
        </FormControl>

        {/* Always show validation section once user interacts with password field */}
        <Box sx={{ mb: 3, display: isInteracted ? 'block' : 'none' }}>
          <Typography sx={{ mb: 1, color: 'customColors.OnSurfaceVariant', fontSize: '12px', fontWeight: 600 }}>
            Password must contain:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              { label: 'Minimum 8 characters', key: 'minChars' },
              { label: '1 Numerical character', key: 'numerical' },

              // { label: 'Upper case letter', key: 'upperCase' },
              { label: '1 Special character (@#$&*)', key: 'special' }
            ].map(item => (
              <Box key={item.key} sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  component='span'
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    mr: 1,
                    bgcolor: getColor(validations[item.key])
                  }}
                />
                <Typography sx={{ color: getColor(validations[item.key]), fontSize: '12px', fontWeight: 400 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <FormControl fullWidth sx={{ mb: 4 }}>
          <Controller
            name='confirmPassword'
            control={control}
            rules={{
              required: true,
              validate: {
                match: value =>
                  value === newPassword ||
                  'Passwords don’t match. Please make sure both passwords are the same and re-enter to confirm.'
              }
            }}
            render={({ field }) => (
              <CustomInput
                type='password'
                label='Confirm Password'
                placeholder='Confirm Password'
                value={field.value}
                onChange={field.onChange}
                onFocus={field.onFocus}
                onBlur={field.onBlur}
                name={field.name}
                error={isInteracted && confirmPassword && validations.passwordMismatch}
                helperText={
                  isInteracted && confirmPassword && validations.passwordMismatch
                    ? 'Passwords don’t match. Please make sure both passwords are the same and re-enter to confirm.'
                    : ''
                }
              />
            )}
          />
        </FormControl>

        <CustomButton
          type='submit'
          fullWidth
          size='large'

          // disabled={!newPassword || hasErrors()}
          sx={{ mb: 3 }}
          loading={loading}
        >
          Reset Password
        </CustomButton>
      </form>
    </CommonCard>
  );
}

ResetPassword.guestGuard = true
ResetPassword.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default ResetPassword
