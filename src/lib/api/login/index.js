import { axiosAuthFormPost, axiosFormPost, axiosGet, axiosPost } from 'src/lib/api/utility'

export async function sendOTP(params) {
  try {
    const response = await axiosFormPost({
      url: `user/generate-otp-temp`,
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
      url: `user/validate-otp-with-temp-token`,
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
      url: `user/reset-password-with-temp-token`,
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
