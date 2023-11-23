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

const Utility = {
  formatDate,
  formatNumber
}

export default Utility
