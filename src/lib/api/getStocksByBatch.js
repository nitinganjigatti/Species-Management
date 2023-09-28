import axios from 'axios'
import { STOCK_BY_BATCH } from '../../constants/ApiConstant'

export async function getStocksByBatch(id) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${STOCK_BY_BATCH}/${id}`
  console.log('url', url)

  return axios
    .get(url)
    .then(response => {
      console.log('stocks report response data', response)

      return response.data.data
    })
    .catch(error => {
      console.log(error)
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

      return error.response
    })
}
