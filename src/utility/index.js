import moment from 'moment'
import toast from 'react-hot-toast'

const formatDate = dateString => {
  if (dateString !== null) {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } else {
    return ''
  }
}

function formatNumber(number) {
  if (number !== null && !isNaN(number)) {
    var formattedNumber = parseFloat(number).toFixed(2)
    formattedNumber = formattedNumber.replace(/\.0+$/, '')

    return formattedNumber
  } else {
    return ''
  }
}

function formattedPresentDate() {
  const date = new Date()

  const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')}`

  return formattedDate
}

function formatDisplayDate(date) {
  return moment(date).format('DD MMM YYYY')
}

function errorMessageExtractorFromObject(errorMessages) {
  for (const key in errorMessages) {
    if (Object.prototype.hasOwnProperty.call(errorMessages, key)) {
      debugger
      const errorMessage = errorMessages[key]
      toast.error(errorMessage)

      // console.log(`${key}: ${errorMessage}`)
    }
  }
}

const Utility = {
  formatDate,
  formatNumber,
  formattedPresentDate,
  formatDisplayDate,
  errorMessageExtractorFromObject
}

export default Utility
