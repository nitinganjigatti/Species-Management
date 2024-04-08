import moment from 'moment'
import toast from 'react-hot-toast'
import FileSaver from 'file-saver'
import * as XLSX from 'xlsx'

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

function exportToCSV(tableData, fileName) {
  const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
  const fileExtension = '.xlsx'
  if (tableData?.length > 0) {
    const ws = XLSX.utils.json_to_sheet(tableData)
    const wb = { Sheets: { data: ws }, SheetNames: ['data'] }
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const data = new Blob([excelBuffer], { type: fileType })
    FileSaver.saveAs(data, fileName + fileExtension)
  }
}

function getPreviousDaysDate(todayDate, days) {
  const date = new Date(todayDate.getTime())
  date.setDate(date.getDate() - days)
  const previousDate = moment(date).format('YYYY-MM-DD')
  console.log('previous function date', previousDate)

  return previousDate
}

const Utility = {
  formatDate,
  formatNumber,
  formattedPresentDate,
  formatDisplayDate,
  errorMessageExtractorFromObject,
  exportToCSV,
  getPreviousDaysDate
}

export default Utility
