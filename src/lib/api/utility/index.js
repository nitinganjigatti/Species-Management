import axios from 'axios'

const base_url = `${process.env.NEXT_PUBLIC_API_BASE_URL}`

export const GetAPIHeader = () => {
  const userDetails = window.localStorage.getItem('userDetails')
  const header = { 'Content-Type': 'multipart/form-data' }

  if (userDetails?.user?.zoos.length > 0) {
    header['zoo_id'] = userDetails?.user?.zoos[0].zoo_id
  }

  return header
}

export const axiosGet = ({ url }) => {
  const completeUrl = `${base_url}${url}`
  console.log(url)
  const headers = GetAPIHeader()

  return axios.get(completeUrl, headers)
}

export const axiosPost = ({ url, body }) => {
  console.log(url)
  debugger

  const completeUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`
  const headers = GetAPIHeader()

  return axios.post(completeUrl, body, { headers })
}
