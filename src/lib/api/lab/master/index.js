import { axiosFormPost, axiosGet, axiosPost } from '../../utility'

export async function getLabSampleList({ params }) {
  const url = `masters/list-sample-types`
  const response = await axiosGet({ url: url, params })
  return response.data
}

export async function getLabSampleListById(params) {
  const url = `masters/list-sample-types`
  const response = await axiosGet({ url: url, params })
  return response.data
}

export async function addLabSample(payload) {
  try {
    const url = `masters/add-sample-types`
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

export async function updateLabSample(id, payload) {
  console.log(payload, id, 'payload')
  const url = `masters/edit-sample-types/${id}`
  try {
    const response = await axiosFormPost({ url: url, body: payload })

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

export async function deleteLabSample(id) {
  const url = `masters/delete-sample-types/${id}`

  try {
    const response = await axiosFormPost({ url })
    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }
    return error
  }
}

// ** Lab Test API

export async function getLabTestList({ params }) {
  const url = `masters/list-lab-test`
  const response = await axiosGet({ url: url, params })
  return response.data
}

export async function getLabTestListById(params) {
  const url = `masters/list-lab-test`
  const response = await axiosGet({ url: url, params })
  return response.data
}

export async function addLabTest(payload) {
  try {
    const url = `masters/add-lab-test`
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

export async function updateLabTest(id, payload) {
  console.log(payload, id, 'payload')
  const url = `masters/edit-lab-test/${id}`
  try {
    const response = await axiosFormPost({ url: url, body: payload })

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

export async function deleteLabTest(id) {
  const url = `masters/delete-lab-test/${id}`
  try {
    const response = await axiosFormPost({ url })
    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }
    return error
  }
}

export async function getLabTestListByParentChild(id, payload) {
  const url = `masters/list-sample-types?id=${id}`
  const response = await axiosGet({ url: url, payload })
  return response.data
}

export async function getLabTestDetailsById(params) {
  const url = `masters/detail-lab-test/${params?.id}`
  const response = await axiosGet({ url: url })
  return response.data
}
// masters/detail-lab-test/666
