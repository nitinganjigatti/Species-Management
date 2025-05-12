import React, { useState } from 'react'
import { Box, TextField, InputAdornment, IconButton, Typography, Divider, alpha } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'

const CustomInput = ({
  type = 'text',
  label = '',
  placeholder = '',
  value = '',
  onChange,
  name,
  icon,
  fullWidth = true,
  required = false,
  disabled = false,
  error = false,
  helperText = '',
  autoComplete = 'off',
  autoFocus = false,
  isOtp = false
}) => {
  const theme = useTheme()
  const [focused, setFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const showLabel = value !== '' || focused

  const getIcon = () => {
    if (icon) return icon
    if (type === 'email' || name === 'email' || name === 'username')
      return <Icon icon={'ic:outline-mail-outline'} fontSize={20} />
    if (type === 'password' || isOtp) return <Icon icon={'ic:outline-lock'} fontSize={20} />
    return <Icon icon={'ic:outline-mail-outline'} fontSize={20} />
  }

  const handleFocus = () => setFocused(true)
  const handleBlur = () => setFocused(false)
  const handleClickShowPassword = () => setShowPassword(!showPassword)

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto', mb: 1.5, position: 'relative' }}>
      <TextField
        fullWidth={fullWidth}
        variant='outlined'
        type={type === 'password' || isOtp ? (showPassword ? 'text' : 'password') : type}
        placeholder={!showLabel ? placeholder : ''}
        value={value}
        onChange={onChange}
        name={name}
        required={required}
        disabled={disabled}
        error={error}
        helperText={helperText}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        onFocus={handleFocus}
        onBlur={handleBlur}
        InputProps={{
          startAdornment: (
            <InputAdornment
              position='start'
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                height: 'auto',
                pointerEvents: 'none'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'customColors.OnSurfaceVariant' }}>
                {getIcon()}
                <Divider
                  sx={{
                    mx: 2.5,
                    minHeight: 20,
                    width: '1px',
                    backgroundColor: theme.palette.customColors?.OnSurfaceVariant
                  }}
                />
              </Box>
            </InputAdornment>
          ),
          endAdornment: (type === 'password' || isOtp) && (
            <InputAdornment position='end'>
              <IconButton
                onClick={handleClickShowPassword}
                edge='end'
                sx={{
                  color: 'customColors.OnSurfaceVariant',
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              >
                <Icon icon={showPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} fontSize={20} />
              </IconButton>
            </InputAdornment>
          ),

          sx: {
            borderRadius: 0.5,
            backgroundColor: 'white',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.customColors.neutralSecondary, 0.2)
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.customColors.neutralSecondary, 0.4)
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.customColors.neutralSecondary, 1)
            },
            height: 56,
            pt: showLabel ? 2 : 0,
            '& .MuiInputBase-input::placeholder': {
              color: 'customColors.neutralSecondary',
              opacity: 1
            },
            '& .MuiInputBase-input': {
              paddingLeft: '46px !important', // Add enough padding for the icon and divider
              color: `${theme.palette.customColors.OnSurfaceVariant} !important`,
              fontWeight: 500,
              fontSize: '0.875rem'
            }
          }
        }}
      />

      {showLabel && (
        <Typography
          variant='caption'
          sx={{
            position: 'absolute',
            top: 8,
            left: 60,
            color: 'customColors.OnSurfaceVariant',
            fontSize: '0.75rem',
            fontWeight: 400
          }}
        >
          {label}
        </Typography>
      )}
    </Box>
  )
}

export default CustomInput

// import React, { useState } from 'react'

// import { Box, TextField, InputAdornment, IconButton, Typography, Divider, alpha } from '@mui/material'
// import Icon from 'src/@core/components/icon'
// import { useTheme } from '@emotion/react'

// const LoginField = ({
//   type = 'text',
//   label = '',
//   placeholder = '',
//   value = '',
//   onChange,
//   name,
//   icon,
//   fullWidth = true,
//   required = false,
//   disabled = false,
//   error = false,
//   helperText = '',
//   autoComplete = 'off',
//   autoFocus = false
// }) => {
//   const theme = useTheme()
//   const [focused, setFocused] = useState(false)
//   const [showPassword, setShowPassword] = useState(false)

//   // Determine if the field has a value or is focused
//   const showLabel = value !== '' || focused

//   // Determine the icon to use
//   const getIcon = () => {
//     if (icon) return icon
//     if (type === 'email' || name === 'email' || name === 'username')
//       return <Icon icon={'ic:outline-mail-outline'} fontSize={20} />
//     if (type === 'password') return <Icon icon={'ic:outline-lock'} fontSize={20} />
//     return <Icon icon={'ic:outline-mail-outline'} fontSize={20} />
//   }

//   // Handle focus events
//   const handleFocus = () => setFocused(true)
//   const handleBlur = () => setFocused(false)

//   // Handle password visibility toggle
//   const handleClickShowPassword = () => setShowPassword(!showPassword)

//   return (
//     <Box sx={{ width: fullWidth ? '100%' : 'auto', mb: 1.5, position: 'relative' }}>
//       <TextField
//         fullWidth={fullWidth}
//         variant='outlined'
//         type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
//         placeholder={!showLabel ? placeholder : ''}
//         value={value}
//         onChange={onChange}
//         name={name}
//         required={required}
//         disabled={disabled}
//         error={error}
//         helperText={helperText}
//         autoComplete={autoComplete}
//         autoFocus={autoFocus}
//         onFocus={handleFocus}
//         onBlur={handleBlur}
//         InputProps={{
//           startAdornment: (
//             <InputAdornment
//               position='start'
//               sx={{
//                 position: 'absolute',
//                 left: 16,
//                 top: '50%',
//                 transform: 'translateY(-50%) !important',
//                 height: 'auto',
//                 pointerEvents: 'none'
//               }}
//             >
//               <Box
//                 sx={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   color: 'customColors.OnSurfaceVariant'
//                 }}
//               >
//                 {getIcon()}
//                 <Divider
//                   orientation='vertical'
//                   sx={{
//                     mx: 1.5,
//                     height: 24,
//                     backgroundColor: 'customColors.OnSurfaceVariant'
//                   }}
//                 />
//               </Box>
//             </InputAdornment>
//           ),
//           endAdornment:
//             type === 'password' ? (
//               <InputAdornment position='end'>
//                 <IconButton
//                   aria-label='toggle password visibility'
//                   onClick={handleClickShowPassword}
//                   edge='end'
//                   sx={{
//                     color: 'customColors.OnSurfaceVariant',
//                     position: 'absolute',
//                     right: 16,
//                     top: '50%',
//                     transform: 'translateY(-50%) !important',
//                     height: 'auto'
//                   }}
//                 >
//                   <Icon icon={showPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} fontSize={20} />
//                 </IconButton>
//               </InputAdornment>
//             ) : null,
//           sx: {
//             borderRadius: 0.5,
//             backgroundColor: 'white',
//             '& .MuiOutlinedInput-notchedOutline': {
//               borderColor: alpha(theme.palette.customColors.neutralSecondary, 0.2)
//             },
//             '&:hover .MuiOutlinedInput-notchedOutline': {
//               borderColor: alpha(theme.palette.customColors.neutralSecondary, 0.4)
//             },
//             '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//               borderColor: alpha(theme.palette.customColors.neutralSecondary, 1)
//             },
//             height: 56,
//             pt: showLabel ? 2 : 0,
//             '& .MuiInputBase-input::placeholder': {
//               color: 'customColors.neutralSecondary',
//               opacity: 1
//             },
//             '& .MuiInputBase-input': {
//               paddingLeft: '46px !important', // Add enough padding for the icon and divider
//               color: `${theme.palette.customColors.OnSurfaceVariant} !important`,
//               fontWeight: 500,
//               fontSize: '0.875rem'
//             }
//           }
//         }}
//       />

//       {/* Floating label */}
//       {showLabel && (
//         <Typography
//           variant='caption'
//           component='div'
//           sx={{
//             position: 'absolute',
//             top: 8,
//             left: 60,
//             color: 'customColors.OnSurfaceVariant',
//             fontSize: '0.75rem',
//             fontWeight: 400,
//             lineHeight: 1,
//             pointerEvents: 'none',
//             zIndex: 1
//           }}
//         >
//           {label}
//         </Typography>
//       )}
//     </Box>
//   )
// }

// export default LoginField

// import React, { useState } from 'react'

// import { Box, TextField, InputAdornment, IconButton, Typography, Divider } from '@mui/material'
// import Icon from 'src/@core/components/icon'

// const LoginField = ({
//   type = 'text',
//   label = '',
//   placeholder = '',
//   value = '',
//   onChange,
//   name,
//   icon,
//   fullWidth = true,
//   required = false,
//   disabled = false,
//   error = false,
//   helperText = '',
//   autoComplete = 'off',
//   autoFocus = false
// }) => {
//   const [focused, setFocused] = useState(false)
//   const [showPassword, setShowPassword] = useState(false)

//   // Determine if the field has a value or is focused
//   const showLabel = value !== '' || focused

//   // Determine the icon to use
//   const getIcon = () => {
//     if (icon) return icon
//     if (type === 'email' || name === 'email' || name === 'username')
//       return <Icon icon={'ic:outline-mail-outline'} fontSize={20} />
//     if (type === 'password') return <Icon icon={'ic:outline-lock'} fontSize={20} />
//     return <Icon icon={'ic:outline-mail-outline'} fontSize={20} />
//   }

//   // Handle focus events
//   const handleFocus = () => setFocused(true)
//   const handleBlur = () => setFocused(false)

//   // Handle password visibility toggle
//   const handleClickShowPassword = () => setShowPassword(!showPassword)

//   return (
//     <Box sx={{ width: fullWidth ? '100%' : 'auto', mb: 2, position: 'relative' }}>
//       <TextField
//         fullWidth={fullWidth}
//         variant='outlined'
//         type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
//         placeholder={!showLabel ? placeholder : ''}
//         value={value}
//         onChange={onChange}
//         name={name}
//         required={required}
//         disabled={disabled}
//         error={error}
//         helperText={helperText}
//         autoComplete={autoComplete}
//         autoFocus={autoFocus}
//         onFocus={handleFocus}
//         onBlur={handleBlur}
//         InputProps={{
//           startAdornment: (
//             <InputAdornment position='start'>
//               <Box sx={{ display: 'flex', alignItems: 'center', color: 'customColors.OnSurfaceVariant' }}>
//                 {getIcon()}
//                 <Divider
//                   orientation='vertical'
//                   flexItem
//                   sx={{ mx: 1.5, my: 1, height: 24, backgroundColor: 'customColors.OnSurfaceVariant' }}
//                 />
//               </Box>
//             </InputAdornment>
//           ),
//           endAdornment:
//             type === 'password' ? (
//               <InputAdornment position='end'>
//                 <IconButton
//                   aria-label='toggle password visibility'
//                   onClick={handleClickShowPassword}
//                   edge='end'
//                   sx={{ color: 'customColors.OnSurfaceVariant' }}
//                 >
//                   <Icon icon={showPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} fontSize={20} />
//                 </IconButton>
//               </InputAdornment>
//             ) : null,
//           sx: {
//             borderRadius: 1,
//             backgroundColor: 'white',
//             '& .MuiOutlinedInput-notchedOutline': {
//               borderColor: 'rgba(0, 0, 0, 0.1)'
//             },
//             '&:hover .MuiOutlinedInput-notchedOutline': {
//               borderColor: 'rgba(0, 0, 0, 0.2)'
//             },
//             '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//               borderColor: 'rgba(0, 0, 0, 0.3)'
//             },
//             height: 60,
//             pt: showLabel ? 2 : 0,
//             '& .MuiInputBase-input::placeholder': {
//               color: 'customColors.neutralSecondary', // Placeholder color updated
//               opacity: 1
//             }
//           }
//         }}
//       />

//       {/* Floating label */}
//       {showLabel && (
//         <Typography
//           variant='caption'
//           component='div'
//           sx={{
//             position: 'absolute',
//             top: 10,
//             left: 60,
//             color: 'customColors.OnSurfaceVariant',
//             fontSize: '0.75rem',
//             fontWeight: 400,
//             lineHeight: 1.2,
//             pointerEvents: 'none'
//           }}
//         >
//           {label}
//         </Typography>
//       )}
//     </Box>
//   )
// }

// export default LoginField

// import React, { useState } from 'react'

// import { Box, TextField, InputAdornment, IconButton, Typography, Divider } from '@mui/material'
// import Icon from 'src/@core/components/icon'

// const LoginField = ({
//   type = 'text',
//   label = '',
//   placeholder = '',
//   value = '',
//   onChange,
//   name,
//   icon,
//   fullWidth = true,
//   required = false,
//   disabled = false,
//   error = false,
//   helperText = '',
//   autoComplete = 'off',
//   autoFocus = false
// }) => {
//   const [focused, setFocused] = useState(false)
//   const [showPassword, setShowPassword] = useState(false)

//   // Determine if the field has a value or is focused
//   const showLabel = value !== '' || focused

//   // Determine the icon to use
//   const getIcon = () => {
//     if (icon) return icon
//     if (type === 'email' || name === 'email' || name === 'username')
//       return <Icon icon={'ic:outline-mail-outline'} fontSize={20} />
//     if (type === 'password') return <Icon icon={'ic:outline-lock'} fontSize={20} />
//     return <Icon icon={'ic:outline-mail-outline'} fontSize={20} />
//   }

//   // Handle focus events
//   const handleFocus = () => setFocused(true)
//   const handleBlur = () => setFocused(false)

//   // Handle password visibility toggle
//   const handleClickShowPassword = () => setShowPassword(!showPassword)

//   return (
//     <Box sx={{ width: fullWidth ? '100%' : 'auto', mb: 2, position: 'relative' }}>
//       <TextField
//         fullWidth={fullWidth}
//         variant='outlined'
//         type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
//         placeholder={!showLabel ? placeholder : ''}
//         value={value}
//         onChange={onChange}
//         name={name}
//         required={required}
//         disabled={disabled}
//         error={error}
//         helperText={helperText}
//         autoComplete={autoComplete}
//         autoFocus={autoFocus}
//         onFocus={handleFocus}
//         onBlur={handleBlur}
//         InputProps={{
//           startAdornment: (
//             <InputAdornment
//               position='start'
//               sx={{
//                 position: 'absolute',
//                 left: 16,
//                 height: '100%',
//                 pointerEvents: 'none',
//                 transform: 'none !important' // Prevent any transforms
//               }}
//             >
//               <Box
//                 sx={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   color: 'customColors.OnSurfaceVariant'
//                   // height: '24px' // Fixed height for stability
//                 }}
//               >
//                 {getIcon()}
//                 <Divider
//                   orientation='vertical'
//                   flexItem
//                   sx={{
//                     mx: 1.5,
//                     height: 24,
//                     backgroundColor: 'customColors.OnSurfaceVariant'
//                   }}
//                 />
//               </Box>
//             </InputAdornment>
//           ),
//           endAdornment:
//             type === 'password' ? (
//               <InputAdornment position='end'>
//                 <IconButton
//                   aria-label='toggle password visibility'
//                   onClick={handleClickShowPassword}
//                   edge='end'
//                   sx={{ color: 'customColors.OnSurfaceVariant' }}
//                 >
//                   <Icon icon={showPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} fontSize={20} />
//                 </IconButton>
//               </InputAdornment>
//             ) : null,
//           sx: {
//             borderRadius: 1,
//             backgroundColor: 'white',
//             '& .MuiOutlinedInput-notchedOutline': {
//               borderColor: 'rgba(0, 0, 0, 0.1)'
//             },
//             '&:hover .MuiOutlinedInput-notchedOutline': {
//               borderColor: 'rgba(0, 0, 0, 0.2)'
//             },
//             '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//               borderColor: 'rgba(0, 0, 0, 0.3)'
//             },
//             height: 60,
//             pt: showLabel ? 2 : 0,
//             '& .MuiInputBase-input::placeholder': {
//               color: 'customColors.neutralSecondary',
//               opacity: 1
//             },
//             '& .MuiInputBase-input': {
//               paddingLeft: '46px !important' // Add enough padding for the icon and divider
//             }
//           }
//         }}
//       />

//       {/* Floating label */}
//       {showLabel && (
//         <Typography
//           variant='caption'
//           component='div'
//           sx={{
//             position: 'absolute',
//             top: 10,
//             left: 60,
//             color: 'customColors.OnSurfaceVariant',
//             fontSize: '0.75rem',
//             fontWeight: 400,
//             lineHeight: 1.2,
//             pointerEvents: 'none'
//           }}
//         >
//           {label}
//         </Typography>
//       )}
//     </Box>
//   )
// }

// export default LoginField
