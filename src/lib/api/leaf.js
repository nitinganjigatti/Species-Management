import axios from 'axios'
import { LEAF } from 'src/constants/ApiConstant'

export async function getLeafs() {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${LEAF}`

  return axios
    .get(url)
    .then(response => {
      console.log('response data', response)
      if (response?.status == 200 && response?.data?.success) {
        return response.data.data
      } else {
        return []
      }
    })
    .catch(error => {
      console.error(url)
      if (error.response) {
        console.info('Request made and server responded')
        console.error(error.response.data)
        console.error(error.response.status)
        console.error(error.response.headers)
      } else if (error.request) {
        console.info('The request was made but no response was received')
        console.error(error.request)
      } else {
        console.info('Something happened in setting up the request that triggered an Error')
        console.error('Error', error.message)
      }

      return error

      // throw new Error(error);
    })
}
