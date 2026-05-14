import { useState, useContext, useEffect } from 'react'

import { AuthContext } from 'src/context/AuthContext'
import Error404 from 'src/pages/404'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'

import {
  getAnimalReport,
  getReportTitle,
  getUserReport,
  getMedicalReport,
  getAnimalAssessment,
  getEnclosureAssessment,
  getDailyFoodWastageReport,
  getVaccinationRecords
} from 'src/lib/api/report'
import DailyReportView from 'src/views/pages/report/daily/DailyReportView'
import { Zoo, UserSettings, ReportItem, FilterParams } from 'src/types/report'

interface AuthContextType {
  userData: {
    user: { zoos: Zoo[] }
    roles: { settings: { enable_reports_module: boolean } }
    permission: { user_settings: UserSettings }
  } | null
}

const DailyReport = () => {
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportItem[]>([])
  const [downloadingRowId, setDownloadingRowId] = useState<number | string | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  // Past date filter state - default to today
  const [pastStartDate, setPastStartDate] = useState(() => Utility.formatDate(new Date()))
  const [pastEndDate, setPastEndDate] = useState(() => Utility.formatDate(new Date()))

  // Upcoming date filter state - default to tomorrow
  const [upcomingStartDate, setUpcomingStartDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    return Utility.formatDate(tomorrow)
  })
  const [upcomingEndDate, setUpcomingEndDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    return Utility.formatDate(tomorrow)
  })

  const [apiFilterParams] = useState<FilterParams>({
    include_class: 1,
    include_order: 1,
    include_family: 1,
    include_genus: 1
  })

  const authData = useContext(AuthContext) as AuthContextType
  const reports_module = authData?.userData?.roles?.settings?.enable_reports_module
  const enable_daily_report = authData?.userData?.permission?.user_settings?.enable_daily_report

  useEffect(() => {
    if (enable_daily_report && reports_module) {
      setLoading(true)

      const fetchReportType = async () => {
        try {
          const response = await getReportTitle({
            page_no: 1,
            limit: 100
          })
          if (Array.isArray(response)) {
            setReportData(response)
          }
        } catch (error) {
          console.error('Error fetching report titles:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchReportType()
    }
  }, [enable_daily_report, reports_module])

  // Split reports into past and upcoming based on date_type
  const pastReports = reportData.filter(r => r.date_type !== 'future')
  const upcomingReports = reportData.filter(r => r.date_type === 'future')

  const downloadNewCSVFile = (csvContent: string) => {
    try {
      const link = document.createElement('a')
      link.href = csvContent
      link.setAttribute('download', 'download')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading CSV:', error)
    }
  }

  const getDataToExport = async (type: string, startDate: string, endDate: string) => {
    try {
      const params: FilterParams = { type, ...apiFilterParams }
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      params.response_type = 'csv'

      let response: { success?: boolean; data?: unknown; message?: string } = {}
      if (type === 'user_report') {
        response = await getUserReport(params)
      } else if (type === 'medical_report') {
        response = await getMedicalReport(params)
      } else if (type === 'animal_assessment') {
        response = await getAnimalAssessment(params)
      } else if (type === 'enclosure_assessment') {
        response = await getEnclosureAssessment(params)
      } else if (type === 'food_wastage') {
        response = await getDailyFoodWastageReport(params)
      } else if (
        ['upcoming_vaccination', 'upcoming_deworming', 'pending_vaccination', 'pending_deworming', 'completed_vaccination', 'completed_deworming'].includes(type)
      ) {
        const [status, category] = type.split('_')
        params.response_type = 'excel'
        params.type = category
        response = await getVaccinationRecords(status as 'upcoming' | 'pending' | 'completed', params)
      } else {
        response = await getAnimalReport(params)
      }

      if (response?.success) {
        downloadNewCSVFile(response?.data as string)
      } else {
        Toaster({ type: 'error', message: response?.message || 'No data available to export' })
      }
    } catch (error) {
      Toaster({ type: 'error', message: 'Error on exporting data' })
      console.error('Error exporting data:', error)
    }
  }

  const handleDownload = async (report: ReportItem) => {
    const isFuture = report.date_type === 'future'
    const startDate = isFuture
      ? (upcomingStartDate || Utility.formatDate(new Date()))
      : (pastStartDate || '')
    const endDate = isFuture
      ? (upcomingEndDate || '')
      : (pastEndDate || '')

    setDownloadingRowId(report.id)
    try {
      await getDataToExport(report.key, startDate, endDate)
    } finally {
      setDownloadingRowId(null)
    }
  }

  const handlePastDateChange = (rangeStartDate: Date | null, rangeEndDate: Date | null) => {
    if (rangeStartDate && rangeEndDate) {
      setPastStartDate(Utility.formatDate(rangeStartDate))
      setPastEndDate(Utility.formatDate(rangeEndDate))
    } else {
      setPastStartDate('')
      setPastEndDate('')
    }
  }

  const handleUpcomingDateChange = (rangeStartDate: Date | null, rangeEndDate: Date | null) => {
    if (rangeStartDate && rangeEndDate) {
      setUpcomingStartDate(Utility.formatDate(rangeStartDate))
      setUpcomingEndDate(Utility.formatDate(rangeEndDate))
    } else {
      setUpcomingStartDate('')
      setUpcomingEndDate('')
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  if (!reports_module || !enable_daily_report) {
    return <Error404 />
  }

  return (
    <DailyReportView
      activeTab={activeTab}
      onTabChange={handleTabChange}
      pastReports={pastReports}
      upcomingReports={upcomingReports}
      pastDateFilter={{ startDate: pastStartDate, endDate: pastEndDate }}
      upcomingDateFilter={{ startDate: upcomingStartDate, endDate: upcomingEndDate }}
      onPastDateChange={handlePastDateChange}
      onUpcomingDateChange={handleUpcomingDateChange}
      downloadingRowId={downloadingRowId}
      onDownload={handleDownload}
      loading={loading}
    />
  )
}

export default DailyReport
