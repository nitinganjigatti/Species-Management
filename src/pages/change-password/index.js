/**
 * Change Password — WSO2-backed, client-side only.
 *
 * Flow (mirrors sample-nextjs-client-antz-auth 2):
 *   1. User fills current + new + confirm password → Continue
 *   2. client.sendOtp() → { otpRequired: false } → changePassword() directly
 *                      → { otpRequired: true  } → show OTP input
 *   3. User enters OTP → client.changePassword(current, new, otp)
 *   4. On success, WSO2 invalidates the refresh_token → logout for clean re-auth
 *
 * Password rule (enforced client-side before hitting WSO2):
 *   Min. 8 characters, at least one letter, one number, one special char from @#$&*
 */

import { useState } from 'react'
import { useRouter } from 'next/router'
import { Box, FormControl, FormHelperText, Typography, Alert } from '@mui/material'
import {
  AntzInvalidCredentialsError,
  AntzInvalidOtpError,
  AntzOtpExpiredError,
  AntzOtpRequiredError,
  AntzOtpMaxAttemptsError,
  AntzPasswordPolicyError,
  AntzSessionExpiredError
} from '@antzsoft/wso2-auth-web'

import BlankLayout from 'src/@core/layouts/BlankLayout'
import CommonCard from 'src/components/login/CommonCard'
import CustomInput from 'src/components/login/CustomInput'
import CustomButton from 'src/components/login/CustomButton'
import client from 'src/lib/auth/wso2Client'
import { useAuth } from 'src/hooks/useAuth'

// --- Password policy ---
// Rule: min 8 chars, at least one letter, one number, one special char from @#$&*
// Validated client-side before calling sendOtp() so the user gets a clear message
// before a WSO2 round-trip. AntzPasswordPolicyError from the SDK is still handled
// in errorMessage() as a fallback in case WSO2-side policy is stricter.
const passwordRequirement =
  'Min. 8 chars with uppercase, lowercase, number & special character (@#$&*) (e.g., Pass@1234)'

const validateNewPassword = pwd => {
  if (pwd.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(pwd)) return 'Password must include at least one uppercase letter.'
  if (!/[a-z]/.test(pwd)) return 'Password must include at least one lowercase letter.'
  if (!/[0-9]/.test(pwd)) return 'Password must include at least one number.'
  if (!/[@#$&*]/.test(pwd)) return 'Password must include a special character (@#$&*).'

  return ''
}

// Returns true only when all 4 rules pass — used to decide hint color.
const isPasswordValid = pwd => validateNewPassword(pwd) === ''

const errorMessage = err => {
  if (err instanceof AntzInvalidCredentialsError) return 'Current password is incorrect.'
  if (err instanceof AntzInvalidOtpError) return 'The OTP you entered is incorrect.'
  if (err instanceof AntzOtpExpiredError) return 'OTP has expired. Please request a new one.'
  if (err instanceof AntzOtpRequiredError) return 'OTP is required. Please request an OTP first.'
  if (err instanceof AntzOtpMaxAttemptsError) return 'Too many incorrect attempts. Please request a new OTP.'
  if (err instanceof AntzPasswordPolicyError) return err.message
  if (err instanceof AntzSessionExpiredError) return 'Session expired. Please log in again.'

  return err instanceof Error ? err.message : 'An unexpected error occurred.'
}

const extractDest = message => {
  const m = message?.match(/sent to (.+?)\.\s*Valid/i)

  return m ? m[1] : 'your registered contact'
}

const ChangePasswordPage = () => {
  const router = useRouter()
  const { logout } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [otp, setOtp] = useState('')

  const [step, setStep] = useState('form') // 'form' | 'otp' | 'success'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSentMsg, setOtpSentMsg] = useState('')

  // Tracks whether the user has started typing in the new password field.
  // Prevents showing red validation hints before the user touches the field.
  const [newPasswordTouched, setNewPasswordTouched] = useState(false)

  const handleSessionExpired = () => {
    logout()
  }

  const doChangePassword = async otpCode => {
    try {
      await client.changePassword(currentPassword, newPassword, otpCode)
      setStep('success')
      // Refresh token invalidated by WSO2 on password change — force clean logout.
      setTimeout(() => logout(), 2000)
    } catch (err) {
      setError(errorMessage(err))
      if (err instanceof AntzSessionExpiredError) handleSessionExpired()
    }
  }

  const handleContinue = async e => {
    e.preventDefault()
    setError('')

    if (!currentPassword) {
      setError('Please enter your current password.')

      return
    }

    // Full password policy check — gives the user a specific message for each
    // failing rule rather than a generic "invalid password" from WSO2.
    const pwdError = validateNewPassword(newPassword)
    if (pwdError) {
      setError(pwdError)

      return
    }

    if (newPassword !== confirm) {
      setError('Passwords do not match.')

      return
    }

    setLoading(true)
    try {
      const { otpRequired, message } = await client.sendOtp()

      if (!otpRequired) {
        await doChangePassword(undefined)

        return
      }

      setOtpSentMsg(
        message
          ? `A 6-digit OTP has been sent to ${extractDest(message)}.`
          : 'A 6-digit OTP has been sent to your registered contact.'
      )
      setStep('otp')
    } catch (err) {
      setError(errorMessage(err))
      if (err instanceof AntzSessionExpiredError) handleSessionExpired()
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async e => {
    e.preventDefault()
    setError('')

    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Please enter the 6-digit OTP.')

      return
    }

    setLoading(true)
    try {
      await doChangePassword(otp)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setOtp('')
    setOtpSentMsg('')
    setLoading(true)
    try {
      const { message } = await client.sendOtp()
      setOtpSentMsg(
        message
          ? `A new OTP has been sent to ${extractDest(message)}.`
          : 'A new OTP has been sent to your registered contact.'
      )
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleBackToForm = () => {
    setStep('form')
    setError('')
    setOtp('')
    setOtpSentMsg('')
  }

  const touchedError = newPasswordTouched ? validateNewPassword(newPassword) : null
  const touchedValid = newPasswordTouched && touchedError === ''

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
      <CommonCard title='Change Password' subtitle=''>
        {step === 'success' && (
          <Alert severity='success' sx={{ mb: 3 }}>
            Password changed successfully. Signing you out…
          </Alert>
        )}

        {error && (
          <Typography variant='body2' sx={{ mb: 3, color: 'error.main', textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        {step === 'form' && (
          <form noValidate autoComplete='off' onSubmit={handleContinue}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <CustomInput
                type='password'
                name='currentPassword'
                label='Current Password'
                placeholder='Enter current password'
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                autoComplete='current-password'
              />
            </FormControl>

            <FormControl fullWidth sx={{}}>
              <CustomInput
                type='password'
                name='newPassword'
                label='New Password'
                // placeholder='Min. 8 chars, letter, number, @#$&*'
                placeholder='New Password'
                value={newPassword}
                onChange={e => {
                  setNewPasswordTouched(true)
                  setNewPassword(e.target.value)
                }}
                autoComplete='new-password'
              />
            </FormControl>

            {/* Password requirements — shown as list until touched, then single status line */}
            {touchedValid ? (
              <FormHelperText sx={{ mb: 2, mt: 0, color: 'success.main', fontSize: 12 }}>
                Password meets all requirements.
              </FormHelperText>
            ) : touchedError ? (
              <FormHelperText sx={{ mb: 2, mt: 0, color: 'error.main', fontSize: 12 }}>{touchedError}</FormHelperText>
            ) : (
              <Box sx={{ mb: 2, px: 0.5 }}>
                <Typography variant='caption' sx={{ color: 'text.secondary', lineHeight: 0.2 }}>
                  {passwordRequirement}
                </Typography>
              </Box>
            )}

            <FormControl fullWidth sx={{ mb: 3 }}>
              <CustomInput
                type='password'
                name='confirmPassword'
                label='Confirm New Password'
                placeholder='Re-enter new password'
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete='new-password'
              />
            </FormControl>

            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Typography
                variant='body2'
                onClick={() => router.back()}
                sx={{ cursor: 'pointer', color: 'customColors.OnSecondaryContainer', fontWeight: 500 }}
              >
                ← Cancel
              </Typography>
            </Box>

            <CustomButton type='submit' fullWidth size='large' sx={{ mb: 2, mt: 1 }} loading={loading}>
              Continue
            </CustomButton>
          </form>
        )}

        {step === 'otp' && (
          <form noValidate autoComplete='off' onSubmit={handleOtpSubmit}>
            {otpSentMsg && (
              <Alert severity='info' sx={{ mb: 3 }}>
                {otpSentMsg}
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 3 }}>
              <CustomInput
                type='text'
                name='otp'
                label='One-Time Password'
                placeholder='Enter 6-digit OTP'
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                isOtp
                autoFocus
              />
              <FormHelperText sx={{ color: 'text.secondary', m: 0, mt: 0.5 }}>
                Enter the 6-digit OTP sent to your registered contact.
              </FormHelperText>
            </FormControl>

            <CustomButton type='submit' fullWidth size='large' sx={{ mb: 2, mt: 1 }} loading={loading}>
              Change Password
            </CustomButton>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant='body2'
                onClick={handleBackToForm}
                sx={{ cursor: 'pointer', color: 'customColors.OnSecondaryContainer', fontWeight: 500 }}
              >
                ← Edit passwords
              </Typography>
              <Typography
                variant='body2'
                onClick={loading ? undefined : handleResend}
                sx={{
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: 'primary.main',
                  fontWeight: 500,
                  opacity: loading ? 0.5 : 1
                }}
              >
                Resend OTP
              </Typography>
            </Box>
          </form>
        )}
      </CommonCard>
    </Box>
  )
}

ChangePasswordPage.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default ChangePasswordPage
