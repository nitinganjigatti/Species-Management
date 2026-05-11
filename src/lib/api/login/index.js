import { axiosAuthFormPost, axiosPost, axiosFormPost } from 'src/lib/api/utility'
import { VERIFY_OTP, RESET_PASSWORD, SEND_OTP, LEGACY_LOGIN } from 'src/constants/LegacyLoginConstant'

// SSO-specific endpoints (ssoLoginCheck, sendOTP) moved to src/lib/api/wso-login.
// This module now hosts only the legacy non-SSO password login + the
// shared verify-OTP / reset-password endpoints.
export async function sendOTP(params) {
  try {
    const response = await axiosFormPost({
      url: SEND_OTP,
      body: params
    })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}
export async function verifyOTP(params, temp_auth_token) {
  try {
    const response = await axiosAuthFormPost({
      url: VERIFY_OTP,
      body: params,
      authToken: temp_auth_token
    })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function resetPassword(params, temp_auth_token) {
  try {
    const response = await axiosAuthFormPost({
      url: RESET_PASSWORD,
      body: params,
      authToken: temp_auth_token
    })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

// normal login — non-SSO password auth.
//
// `url` may arrive with or without a leading '/api/' (callers historically
// passed '/api/v1/auth/login'). Strip that prefix because axiosPost prepends
// base_url, which already includes '/api/' in dev. Behaves identically in
// prod because base_url switches to NEXT_PUBLIC_API_BASE_URL.
export async function legacyLogin({ email, password }) {
  const body = { email, password }

  try {
    const response = await axiosPost({ url: LEGACY_LOGIN, body })

    return response?.data
  } catch (error) {
    if (error.response?.data) return error.response.data

    return {
      success: false,
      message: error.message || 'Login request failed'
    }
  }
}
