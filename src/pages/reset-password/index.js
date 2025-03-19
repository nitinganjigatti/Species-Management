import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import CommonCard from 'src/components/login/CommonCard'
import CustomButton from 'src/components/login/CustomButton'
import LoginField from 'src/components/login/LoginField'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import { Avatar } from '@mui/material'
import { useRouter } from 'next/router'
import { resetPassword } from 'src/lib/api/login'
import toast from 'react-hot-toast'

const ResetPassword = () => {
  const [isInteracted, setIsInteracted] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user_id, profile_pic, user_first_name, user_last_name, temp_auth_token } = router.query

  console.log('Received Data:', {
    user_id,
    profile_pic,
    user_first_name,
    user_last_name,
    temp_auth_token
  })

  const {
    control,
    handleSubmit,
    watch,
    formState: { touchedFields }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  })

  const newPassword = watch('newPassword')
  const confirmPassword = watch('confirmPassword')

  // Show validation as soon as the user types anything in the password field
  useEffect(() => {
    if (newPassword && !isInteracted) {
      setIsInteracted(true)
    }
  }, [newPassword, isInteracted])

  // Password validation status
  const validations = {
    minChars: newPassword.length >= 8,
    upperCase: /[A-Z]/.test(newPassword),
    numerical: /[0-9]/.test(newPassword),
    special: /[@#$&*]/.test(newPassword),
    passwordMismatch: confirmPassword ? confirmPassword !== newPassword : false
  }

  const onSubmit = async data => {
    console.log('Form submitted successfully', data)
    // Handle form submission logic here

    const payload = {
      user_id: user_id,
      new_password: data.newPassword
    }
    try {
      setLoading(true)
      const response = await resetPassword(payload, temp_auth_token)
      console.log('resetPasswords :', response)
      if (response.success === true) {
        toast.success(response?.message)
        router.push('/login')
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
      logoSrc='/images/login/Vantara_Logo_registered.svg'
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
            pr: 2,
            borderRadius: 4
          }}
        >
          <Avatar src={profile_pic} alt='User' sx={{ width: 40, height: 40, mr: 1.5 }} />
          <Typography sx={{ color: 'customColors.OnSurfaceVariant', fontSize: '14px', fontWeight: 500 }}>
            {user_first_name && user_last_name ? `${user_first_name} ${user_last_name}` : ''}
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
              required: true,
              validate: {
                minChars: value => value.length >= 8,
                upperCase: value => /[A-Z]/.test(value),
                numerical: value => /[0-9]/.test(value),
                special: value => /[@#$&*]/.test(value)
              }
            }}
            render={({ field }) => (
              <LoginField
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
        </FormControl>

        {/* Always show validation section once user interacts with password field */}
        <Box sx={{ mb: 3, display: isInteracted ? 'block' : 'none' }}>
          <Typography sx={{ mb: 1, color: 'customColors.OnSurfaceVariant', fontSize: '12px', fontWeight: 600 }}>
            Password must contain:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
            {[
              { label: 'Minimum 8 characters', key: 'minChars' },
              { label: '1 Numerical character', key: 'numerical' },
              { label: 'Upper case letter', key: 'upperCase' },
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
              <LoginField
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
          disabled={!newPassword || hasErrors()}
          sx={{ mb: 3 }}
          loading={loading}
        >
          Reset Password
        </CustomButton>
      </form>
    </CommonCard>
  )
}

ResetPassword.guestGuard = true
ResetPassword.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default ResetPassword

// import { useState } from 'react'
// import Box from '@mui/material/Box'
// import Typography from '@mui/material/Typography'
// import FormControl from '@mui/material/FormControl'
// import InputAdornment from '@mui/material/InputAdornment'
// import IconButton from '@mui/material/IconButton'
// import CommonCard from 'src/components/login/CommonCard'
// import CustomButton from 'src/components/login/CustomButton'
// import LoginField from 'src/components/login/LoginField'
// import Icon from 'src/@core/components/icon'
// import BlankLayout from 'src/@core/layouts/BlankLayout'
// import { Avatar } from '@mui/material'

// const ResetPassword = () => {
//   const [values, setValues] = useState({
//     newPassword: '',
//     confirmPassword: '',
//     showNewPassword: false,
//     showConfirmPassword: false
//   })

//   const [errors, setErrors] = useState({
//     minChars: false,
//     upperCase: false,
//     numerical: false,
//     special: false,
//     passwordMismatch: false,
//     isInteracted: false
//   })

//   const validatePassword = password => {
//     const validations = {
//       minChars: password.length >= 8,
//       upperCase: /[A-Z]/.test(password),
//       numerical: /[0-9]/.test(password),
//       special: /[@#$&*]/.test(password)
//     }

//     setErrors(prev => ({
//       ...prev,
//       ...validations,
//       passwordMismatch: values.confirmPassword && values.confirmPassword !== password,
//       isInteracted: true
//     }))

//     return Object.values(validations).every(Boolean)
//   }

//   const validateConfirmPassword = confirmPassword => {
//     const passwordMismatch = confirmPassword !== values.newPassword
//     setErrors(prev => ({ ...prev, passwordMismatch, isInteracted: true }))
//     return !passwordMismatch
//   }

//   const handleChange = prop => event => {
//     const value = event.target.value
//     setValues({ ...values, [prop]: value })

//     if (prop === 'newPassword') {
//       validatePassword(value)
//     } else if (prop === 'confirmPassword') {
//       validateConfirmPassword(value)
//     }
//   }

//   const handleClickShowPassword = prop => () => {
//     setValues({
//       ...values,
//       [prop]: !values[prop]
//     })
//   }

//   const hasErrors = () => {
//     return !errors.minChars || !errors.upperCase || !errors.numerical || !errors.special || errors.passwordMismatch
//   }

//   const getColor = isValid => {
//     if (!errors.isInteracted) return '#44544A'
//     return isValid ? 'success.main' : 'error.main'
//   }

//   return (
//     <CommonCard
//       bgImage='/images/frog_img.png'
//       logoSrc='/images/login/Vantara_Logo_registered.svg'
//       title='Reset password'
//       subtitle={
//         <Box
//           sx={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             mb: 2,
//             bgcolor: '#FFFFFF66',
//             p: 1,
//             pr: 2,
//             borderRadius: 4
//           }}
//         >
//           <Avatar src='/images/profile.jpg' alt='User' sx={{ width: 40, height: 40, mr: 1 }} />
//           <Typography>Keerthana Madhu</Typography>
//         </Box>
//       }
//     >
//       <form noValidate autoComplete='off'>
//         <FormControl fullWidth sx={{ mb: 2 }}>
//           <LoginField
//             type={values.showNewPassword ? 'text' : 'password'}
//             label='New password'
//             placeholder='New password'
//             value={values.newPassword}
//             onChange={handleChange('newPassword')}
//             InputProps={{
//               endAdornment: (
//                 <InputAdornment position='end'>
//                   <IconButton onClick={handleClickShowPassword('showNewPassword')}>
//                     <Icon icon={values.showNewPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} />
//                   </IconButton>
//                 </InputAdornment>
//               )
//             }}
//           />
//         </FormControl>

//         {errors.isInteracted && (
//           <Box sx={{ mb: 3 }}>
//             <Typography variant='body2' sx={{ mb: 1 }}>
//               Password must contain:
//             </Typography>
//             <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
//               {[
//                 'Minimum 8 characters',
//                 '1 Numerical character',
//                 'Upper case letter',
//                 '1 Special character (@#$&*)'
//               ].map((label, idx) => {
//                 const keys = ['minChars', 'numerical', 'upperCase', 'special']
//                 return (
//                   <Box key={label} sx={{ display: 'flex', alignItems: 'center' }}>
//                     <Box
//                       component='span'
//                       sx={{
//                         width: 8,
//                         height: 8,
//                         borderRadius: '50%',
//                         mr: 1,
//                         bgcolor: getColor(errors[keys[idx]])
//                       }}
//                     />
//                     <Typography variant='body2' sx={{ color: getColor(errors[keys[idx]]) }}>
//                       {label}
//                     </Typography>
//                   </Box>
//                 )
//               })}
//             </Box>
//           </Box>
//         )}

//         <FormControl fullWidth sx={{ mb: 4 }}>
//           <LoginField
//             type={values.showConfirmPassword ? 'text' : 'password'}
//             label='Confirm Password'
//             placeholder='Confirm Password'
//             value={values.confirmPassword}
//             onChange={handleChange('confirmPassword')}
//             error={errors.isInteracted && errors.passwordMismatch}
//             helperText={errors.isInteracted && errors.passwordMismatch ? 'Passwords do not match' : ''}
//             InputProps={{
//               endAdornment: (
//                 <InputAdornment position='end'>
//                   <IconButton onClick={handleClickShowPassword('showConfirmPassword')}>
//                     <Icon icon={values.showConfirmPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} />
//                   </IconButton>
//                 </InputAdornment>
//               )
//             }}
//           />
//         </FormControl>

//         <CustomButton type='submit' fullWidth size='large' disabled={!values.newPassword || hasErrors()} sx={{ mb: 3 }}>
//           Reset Password
//         </CustomButton>
//       </form>
//     </CommonCard>
//   )
// }

// ResetPassword.guestGuard = true
// ResetPassword.getLayout = page => <BlankLayout>{page}</BlankLayout>

// export default ResetPassword

// import { useState } from 'react'
// import Box from '@mui/material/Box'
// import Typography from '@mui/material/Typography'
// import FormControl from '@mui/material/FormControl'
// import FormHelperText from '@mui/material/FormHelperText'
// import InputAdornment from '@mui/material/InputAdornment'
// import IconButton from '@mui/material/IconButton'
// import CommonCard from 'src/components/login/CommonCard'
// import CustomButton from 'src/components/login/CustomButton'
// import LoginField from 'src/components/login/LoginField'
// import Avatar from '@mui/material/Avatar'
// import BlankLayout from 'src/@core/layouts/BlankLayout'
// import Icon from 'src/@core/components/icon'

// const ResetPassword = () => {
//   const [values, setValues] = useState({
//     newPassword: '',
//     confirmPassword: '',
//     showNewPassword: false,
//     showConfirmPassword: false
//   })

//   const [errors, setErrors] = useState({
//     minChars: false,
//     upperCase: false,
//     numerical: false,
//     special: false,
//     passwordMismatch: false
//   })

//   // Validation functions
//   const validatePassword = password => {
//     const validations = {
//       minChars: password.length >= 8,
//       upperCase: /[A-Z]/.test(password),
//       numerical: /[0-9]/.test(password),
//       special: /[@#$&*]/.test(password)
//     }

//     setErrors(prev => ({
//       ...prev,
//       ...validations,
//       passwordMismatch: values.confirmPassword && values.confirmPassword !== password
//     }))

//     return Object.values(validations).every(Boolean)
//   }

//   const validateConfirmPassword = confirmPassword => {
//     const passwordMismatch = confirmPassword !== values.newPassword
//     setErrors(prev => ({ ...prev, passwordMismatch }))
//     return !passwordMismatch
//   }

//   const handleChange = prop => event => {
//     const value = event.target.value
//     setValues({ ...values, [prop]: value })

//     if (prop === 'newPassword') {
//       validatePassword(value)
//     } else if (prop === 'confirmPassword') {
//       validateConfirmPassword(value)
//     }
//   }

//   const handleClickShowPassword = prop => () => {
//     setValues({
//       ...values,
//       [prop]: !values[prop]
//     })
//   }

//   const handleSubmit = e => {
//     e.preventDefault()
//     const isPasswordValid = validatePassword(values.newPassword)
//     const isConfirmValid = validateConfirmPassword(values.confirmPassword)

//     if (isPasswordValid && isConfirmValid) {
//       console.log('Password Reset:', values)
//       // Add your form submission logic here
//     }
//   }

//   // Check if any validation errors exist
//   const hasErrors = () => {
//     return !errors.minChars || !errors.upperCase || !errors.numerical || !errors.special || errors.passwordMismatch
//   }

//   return (
//     <CommonCard
//       bgImage='/images/frog_img.png'
//       logoSrc='/images/login/Vantara_Logo_registered.svg'
//       title='Reset password'
//       subtitle={
//         <Box
//           sx={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             mb: 2,
//             bgcolor: '#FFFFFF66',
//             p: 1,
//             pr: 2,
//             borderRadius: 4
//           }}
//         >
//           <Avatar src='/images/profile.jpg' alt='User' sx={{ width: 40, height: 40, mr: 1 }} />
//           <Typography>Keerthana Madhu</Typography>
//         </Box>
//       }
//     >
//       <form noValidate autoComplete='off' onSubmit={handleSubmit}>
//         <FormControl fullWidth sx={{ mb: 2 }}>
//           <LoginField
//             type={values.showNewPassword ? 'text' : 'password'}
//             label='New password'
//             placeholder='New password'
//             value={values.newPassword}
//             onChange={handleChange('newPassword')}
//             error={values.newPassword !== '' && hasErrors()}
//             InputProps={{
//               endAdornment: (
//                 <InputAdornment position='end'>
//                   <IconButton edge='end' onClick={handleClickShowPassword('showNewPassword')}>
//                     <Icon icon={values.showNewPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} />
//                   </IconButton>
//                 </InputAdornment>
//               )
//             }}
//           />
//         </FormControl>

//         <Box sx={{ mb: 3 }}>
//           <Typography variant='body2' sx={{ mb: 1 }}>
//             Password must contain -
//           </Typography>
//           <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
//             <Box sx={{ display: 'flex', alignItems: 'center' }}>
//               <Box
//                 component='span'
//                 sx={{
//                   width: 8,
//                   height: 8,
//                   borderRadius: '50%',
//                   mr: 1,
//                   bgcolor: values.newPassword && errors.minChars ? 'success.main' : 'error.main'
//                 }}
//               />
//               <Typography
//                 variant='body2'
//                 sx={{ color: values.newPassword && errors.minChars ? 'success.main' : 'error.main' }}
//               >
//                 Minimum 8 characters
//               </Typography>
//             </Box>
//             <Box sx={{ display: 'flex', alignItems: 'center' }}>
//               <Box
//                 component='span'
//                 sx={{
//                   width: 8,
//                   height: 8,
//                   borderRadius: '50%',
//                   mr: 1,
//                   bgcolor: values.newPassword && errors.numerical ? 'success.main' : 'error.main'
//                 }}
//               />
//               <Typography
//                 variant='body2'
//                 sx={{ color: values.newPassword && errors.numerical ? 'success.main' : 'error.main' }}
//               >
//                 1 Numerical character
//               </Typography>
//             </Box>
//             <Box sx={{ display: 'flex', alignItems: 'center' }}>
//               <Box
//                 component='span'
//                 sx={{
//                   width: 8,
//                   height: 8,
//                   borderRadius: '50%',
//                   mr: 1,
//                   bgcolor: values.newPassword && errors.upperCase ? 'success.main' : 'error.main'
//                 }}
//               />
//               <Typography
//                 variant='body2'
//                 sx={{ color: values.newPassword && errors.upperCase ? 'success.main' : 'error.main' }}
//               >
//                 Upper case letter
//               </Typography>
//             </Box>
//             <Box sx={{ display: 'flex', alignItems: 'center' }}>
//               <Box
//                 component='span'
//                 sx={{
//                   width: 8,
//                   height: 8,
//                   borderRadius: '50%',
//                   mr: 1,
//                   bgcolor: values.newPassword && errors.special ? 'success.main' : 'error.main'
//                 }}
//               />
//               <Typography
//                 variant='body2'
//                 sx={{ color: values.newPassword && errors.special ? 'success.main' : 'error.main' }}
//               >
//                 1 Special character (@#$&*)
//               </Typography>
//             </Box>
//           </Box>
//         </Box>

//         <FormControl fullWidth sx={{ mb: 4 }}>
//           <LoginField
//             type={values.showConfirmPassword ? 'text' : 'password'}
//             label='Re-enter password'
//             placeholder='Re-enter password'
//             value={values.confirmPassword}
//             onChange={handleChange('confirmPassword')}
//             error={values.confirmPassword !== '' && errors.passwordMismatch}
//             InputProps={{
//               endAdornment: (
//                 <InputAdornment position='end'>
//                   <IconButton edge='end' onClick={handleClickShowPassword('showConfirmPassword')}>
//                     <Icon icon={values.showConfirmPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} />
//                   </IconButton>
//                 </InputAdornment>
//               )
//             }}
//           />
//           {values.confirmPassword && errors.passwordMismatch && (
//             <FormHelperText sx={{ color: 'error.main' }}>Passwords do not match</FormHelperText>
//           )}
//         </FormControl>

//         <CustomButton
//           type='submit'
//           fullWidth
//           size='large'
//           disabled={!values.newPassword || !values.confirmPassword || hasErrors()}
//         >
//           Reset Password
//         </CustomButton>
//       </form>
//     </CommonCard>
//   )
// }

// ResetPassword.guestGuard = true
// ResetPassword.getLayout = page => <BlankLayout>{page}</BlankLayout>

// export default ResetPassword

// import Box from '@mui/material/Box'
// import Typography from '@mui/material/Typography'
// import FormControl from '@mui/material/FormControl'
// import FormHelperText from '@mui/material/FormHelperText'
// import Button from '@mui/material/Button'
// import { useTheme, styled } from '@mui/material/styles'
// import { useForm, Controller } from 'react-hook-form'
// import { yupResolver } from '@hookform/resolvers/yup'
// import * as yup from 'yup'
// import Icon from 'src/@core/components/icon'
// import CommonCard from 'src/components/login/CommonCard'
// import CustomButton from 'src/components/login/CustomButton'
// import LoginField from 'src/components/login/LoginField'
// import Avatar from '@mui/material/Avatar'
// import BlankLayout from 'src/@core/layouts/BlankLayout'

// const schema = yup.object().shape({
//   newPassword: yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
//   confirmPassword: yup
//     .string()
//     .oneOf([yup.ref('newPassword')], 'Passwords must match')
//     .required('Confirm password is required')
// })

// const ResetPassword = () => {
//   const {
//     control,
//     handleSubmit,
//     formState: { errors }
//   } = useForm({
//     resolver: yupResolver(schema),
//     defaultValues: { newPassword: '', confirmPassword: '' }
//   })

//   const onSubmit = data => {
//     console.log('Password Reset:', data)
//   }

//   return (
//     <CommonCard
//       bgImage='/images/frog_img.png'
//       logoSrc='/images/login/Vantara_Logo_registered.svg'
//       title='Reset password'
//       subtitle={
//         <Box
//           sx={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             mb: 2,
//             bgcolor: '#FFFFFF66',
//             p: 1,
//             pr: 2,
//             borderRadius: 4
//           }}
//         >
//           <Avatar src='/images/profile.jpg' alt='User' sx={{ width: 40, height: 40, mr: 1 }} />
//           <Typography>Keerthana Madhu</Typography>
//         </Box>
//       }
//     >
//       <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
//         <FormControl fullWidth sx={{ mb: 2 }}>
//           <Controller
//             name='newPassword'
//             control={control}
//             render={({ field }) => (
//               <LoginField
//                 type='password'
//                 label='New password'
//                 placeholder='New password'
//                 {...field}
//                 error={!!errors.newPassword}
//               />
//             )}
//           />
//           {errors.newPassword && (
//             <FormHelperText sx={{ color: 'error.main' }}>{errors.newPassword.message}</FormHelperText>
//           )}
//         </FormControl>

//         <FormControl fullWidth sx={{ mb: 3 }}>
//           <Controller
//             name='confirmPassword'
//             control={control}
//             render={({ field }) => (
//               <LoginField
//                 type='password'
//                 label='Re-enter password'
//                 placeholder='Re-enter password'
//                 {...field}
//                 error={!!errors.confirmPassword}
//               />
//             )}
//           />
//           {errors.confirmPassword && (
//             <FormHelperText sx={{ color: 'error.main' }}>{errors.confirmPassword.message}</FormHelperText>
//           )}
//         </FormControl>

//         <CustomButton type='submit' fullWidth size='large'>
//           Reset Password
//         </CustomButton>
//       </form>
//     </CommonCard>
//   )
// }

// ResetPassword.guestGuard = true
// ResetPassword.getLayout = page => <BlankLayout>{page}</BlankLayout>

// export default ResetPassword
