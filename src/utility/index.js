import moment from 'moment'
import toast from 'react-hot-toast'
import FileSaver from 'file-saver'
import * as XLSX from 'xlsx'
import CustomAvatar from 'src/@core/components/mui/avatar'

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

  return previousDate
}
function getFeaturesDates(todayDate, days) {
  const date = new Date(todayDate.getTime())
  date.setDate(date.getDate() + days)
  const featureDate = moment(date).format('YYYY-MM-DD')

  return featureDate
}
function daysFromToday(inputDate) {
  const today = moment()
  const targetDate = moment(inputDate, 'YYYY-MM-DD')

  const differenceInDays = targetDate.diff(today, 'days')
  if (Math.abs(differenceInDays) === 0) {
    return 'Today'
  } else if (Math.abs(differenceInDays) === 1) {
    return `${Math.abs(differenceInDays)} Day`
  } else {
    return `${Math.abs(differenceInDays)} Days`
  }
}

function renderUserAvatar(image) {
  if (image) {
    return <CustomAvatar src={image} sx={{ mr: '16px', width: '40px', height: '40px' }} />
  } else {
    return <CustomAvatar sx={{ mr: '16px', width: '40px', height: '40px', fontSize: '.8rem' }}></CustomAvatar>
  }
}
function convertUTCToLocal(date) {
  var stillUtc = moment.utc(date).toDate()
  var local = moment(stillUtc).local(true).format('YYYY-MM-DD HH:mm:ss')

  return local
}

function extractHoursAndMinutes(date) {
  //9:21 PM
  return moment(date).format('hh:mm A')
}

function toPascalSentenceCase(str) {
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
    .join(' ')
}

const Utility = {
  formatDate,
  formatNumber,
  formattedPresentDate,
  formatDisplayDate,
  errorMessageExtractorFromObject,
  exportToCSV,
  getFeaturesDates,
  getPreviousDaysDate,
  daysFromToday,
  convertUTCToLocal,
  extractHoursAndMinutes,
  toPascalSentenceCase,
  renderUserAvatar
}

export default Utility
