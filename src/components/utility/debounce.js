function debounce(func, delay) {
  let timeoutId

  return function (...args) {
    clearTimeout(timeoutId)

    return new Promise(resolve => {
      timeoutId = setTimeout(() => {
        resolve(func.apply(this, args))
      }, delay)
    })
  }
}

const searchMedicine = (query, medicines) => {
  const lowerCaseQuery = query?.toLowerCase()?.trim()

  return medicines?.filter(medicine => medicine?.name?.toLowerCase().includes(lowerCaseQuery))
}

export const debouncedSearchMedicine = debounce(searchMedicine, 300)

export const generateErrMsg = data => {
  if (typeof data === 'string') return data
  if (typeof data === 'object') {
    for (let key in data) {
      return data[key]
    }
  }

  return 'Something went wrong'
}
