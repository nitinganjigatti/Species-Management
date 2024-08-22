import { DOWNLOAD_CSV_FOR_BATCH_DATA } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function downloadCsvForBatchData(payload) {
  try {
    // const url = `v1/parivesh/animal/site/downloadcsvforbatchdata`
    const url = `${DOWNLOAD_CSV_FOR_BATCH_DATA}`
    const response = await axiosFormPost({ url, body: payload })

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
