import { forwardRef, useState, useRef, useContext, useEffect } from 'react'

import {
  Box,
  Button,
  Card,
  CardHeader,
  Checkbox,
  CircularProgress,
  FormControl,
  FormHelperText,
  Popover,
  TextField,
  Typography
} from '@mui/material'
import { useTheme } from '@emotion/react'

import { AuthContext } from 'src/context/AuthContext'
import Error404 from 'src/pages/404'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import SingleDatePicker from 'src/components/SingleDatePicker'
import Toaster from 'src/components/Toaster'

import {
  getAnimalReport,
  getReportTitle,
  getUserReport,
  getMedicalReport,
  getAnimalAssessment,
  getEnclosureAssessment
} from 'src/lib/api/report'


const Animal = () => {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [errors, setErrors] = useState({})
  const [reportData, setReportData] = useState([])
  const [downloadingRowId, setDownloadingRowId] = useState(null)

  const authData = useContext(AuthContext)
  const reports_module = authData?.userData?.roles?.settings?.enable_reports_module
  const enable_daily_report = authData?.userData?.permission?.user_settings?.enable_daily_report

  const startDateRef = useRef()
  const endDateRef = useRef()

  useEffect(() => {
    // Calculate yesterday's date
    const yesterday = new Date()

    // Format the date as YYYY-MM-DD
    const year = yesterday.getFullYear()
    const month = String(yesterday.getMonth() + 1).padStart(2, '0') // Months are zero-based
    const day = String(yesterday.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`

    // Set the formatted date
    setStartDate(formattedDate)
    setEndDate(formattedDate)
  }, [])

  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} />
  })

  const [popoverData, setPopoverData] = useState({
    Taxonomy: [
      { label: 'Class', key: 'include_class', checked: false },
      { label: 'Order', key: 'include_order', checked: false },
      { label: 'Family', key: 'include_family', checked: false },
      { label: 'Genus', key: 'include_genus', checked: false }
    ]
  })

  const [apiFilterParams, setApiFilterParams] = useState({
    include_class: 0,
    include_order: 0,
    include_family: 0,
    include_genus: 0
  })

  const jsonToCsv = jsonData => {
    if (!jsonData || jsonData.length === 0) return 'No data available'

    // Extract keys from the first object to use as headers
    const keys = Object.keys(jsonData[0])
    const header = keys.join(',')

    const rows = jsonData.map(item =>
      keys.map(key => (item[key] !== null && item[key] !== undefined ? `"${item[key]}"` : '')).join(',')
    )

    return [header, ...rows].join('\n')
  }

  useEffect(() => {
    if (enable_daily_report && reports_module && enable_daily_report) {
      setLoading(true)
      const fetchReportType = async () => {
        try {
          const response = await getReportTitle({
            page_no: paginationModel.page + 1,
            limit: paginationModel.pageSize
          })
          if (response) {
            setReportData(response)
          } else {
            console.error('error >')
          }
        } catch (error) {
          console.error('Error fetching report titles:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchReportType()
    }
  }, [paginationModel])

  const downloadNewCSVFile = csvContent => {
    try {
      // const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = csvContent
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'download')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading CSV:', error)
    }
  }

  const getDataToExport = async type => {
    try {
      const params = { type: type, ...apiFilterParams }
      if (startDate) {
        params.start_date = startDate
      }
      if (endDate) {
        params.end_date = endDate
      }
      params.response_type = 'csv'
      let response = []
      if (type === 'user_report') {
        response = await getUserReport(params)
      } else if (type === 'medical_report') {
        response = await getMedicalReport(params)
      } else if (type === 'animal_assessment') {
        response = await getAnimalAssessment(params)
      } else if (type === 'enclosure_assessment') {
        response = await getEnclosureAssessment(params)
      } else {
        response = await getAnimalReport(params)
      }
      if (response?.success) {
        downloadNewCSVFile(response?.data)
      } else {
        Toaster({ type: 'error', message: response?.message || 'no assessments are recorded' })
        console.warn('No  data available to export')
      }
    } catch (error) {
      Toaster({ type: 'error', message: 'Error on exporting data' })
      console.error('Error exporting data:', error)
    }
  }

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleStartDateChange = dateString => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`

    setStartDate(formattedDate)

    if (endDate && new Date(formattedDate) > new Date(endDate)) {
      setErrors(prevErrors => ({ ...prevErrors, startDate: true }))
    } else {
      setErrors(prevErrors => ({ ...prevErrors, startDate: false }))
    }
  }

  const handleEndDateChange = dateString => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`

    // Update end date
    setEndDate(formattedDate)

    if (startDate && new Date(formattedDate) < new Date(startDate)) {
      setErrors(prevErrors => ({ ...prevErrors, endDate: true }))
    } else {
      setErrors(prevErrors => ({ ...prevErrors, endDate: false }))
    }
  }

  const handleConfirm = async () => {
    let updatedApiParams = { ...apiFilterParams }

    // Process `popoverData` to extract selected options
    Object.keys(popoverData).forEach(category => {
      popoverData[category].forEach(option => {
        updatedApiParams[option.key] = option.checked ? 1 : 0 // Add only selected options
      })
    })

    // Update API parameters and reset pagination
    setApiFilterParams(updatedApiParams)
    setPaginationModel({ ...paginationModel, page: 0 })
    setAnchorEl(null)
  }

  const handleOptionChange = (category, itemIndex) => {
    setPopoverData(prevData => {
      const updatedData = {
        ...prevData,
        [category]: prevData[category].map((el, index) => (index === itemIndex ? { ...el, checked: !el.checked } : el))
      }

      return updatedData
    })
  }

  const reportRows = reportData
  const open = Boolean(anchorEl)
  const id = open ? 'filter-popover' : undefined

  const columns = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 0.7,
      headerAlign: 'left',
      renderCell: params => (
        <Typography
          sx={{ color: theme.palette.customColors.customHeadingTextColor, fontWeight: 500, fontSize: '14px', ml: 3 }}
        >
          {params.row.title}
        </Typography>
      )
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 0.7,
      renderCell: params => {
        const handleExport = params => {
          const { row } = params
          setDownloadingRowId(row.id)
          getDataToExport(row.key)
            .then(() => setDownloadingRowId(null))
            .catch(() => setDownloadingRowId(null))
        }

        return (
          <Button
            variant='contained'
            disabled={downloadingRowId === params.row.id}
            onClick={() => handleExport(params)}
            sx={{
              width: '120px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {downloadingRowId === params.row.id ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              params.row.action
            )}
          </Button>
        )
      }
    }
  ]

  const title = (
    <Typography
      sx={{
        fontSize: '24px',
        fontWeight: 500,
        fontFamily: 'Inter',
        color: theme.palette.customColors.OnSurfaceVariant
      }}
    >
      Daily Report
    </Typography>
  )

  return (
    <>
      {reports_module && enable_daily_report ? (
        <Card>
          <CardHeader title={title} sx={{ mb: '16px' }} />
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              px: '16px',
              mb: '16px'
            }}
          >
            <Box sx={{ display: 'flex', gap: 3 }}>
              <FormControl fullWidth>
                <SingleDatePicker
                  value={startDate}
                  name='FromDate*'
                  onChange={handleStartDateChange}
                  customInput={
                    <TextField
                      label='Start Date*'
                      error={Boolean(errors.startDate)}
                      sx={{
                        '& .MuiInputBase-input': {
                          mt: 1,
                          height: '25px',
                          padding: '8px'
                        }
                      }}
                    />
                  }
                  maxDate={new Date()}
                  ref={startDateRef}
                />
                {errors.startDate && (
                  <FormHelperText sx={{ color: 'error.main' }}>Start date should be less than end date</FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth>
                <SingleDatePicker
                  value={endDate}
                  name='EndDate*'
                  onChange={handleEndDateChange}
                  customInput={
                    <TextField
                      label='End Date*'
                      error={Boolean(errors.endDate)}
                      sx={{
                        '& .MuiInputBase-input': {
                          mt: 1,
                          height: '25px',
                          padding: '8px'
                        }
                      }}
                    />
                  }
                  maxDate={new Date()}
                  ref={endDateRef}
                />
                {errors.endDate && (
                  <FormHelperText sx={{ color: 'error.main' }}>
                    End date should be greater than start date
                  </FormHelperText>
                )}
              </FormControl>

              <Box>
                <Button
                  onClick={handleClick}
                  variant='outlined'
                  aria-describedby={'popoverButton'}
                  sx={{
                    width: '140px', // Width of Show/Hide button
                    height: '45px', // Height of Show/Hide button
                    display: 'flex',
                    borderRadius: '8px',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 400,
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '100px'
                  }}
                >
                  <img
                    src='/images/show_popup.png'
                    style={{
                      width: '24px',
                      height: '24px',
                      marginBottom: '2px',
                      marginRight: '3px',
                      marginTop: '2px'
                    }}
                    alt='Filter Icon'
                  />
                  <Typography
                    sx={{ color: theme.palette.customColors.OnPrimaryContainer, textTransform: 'capitalize' }}
                  >
                    Show/Hide
                  </Typography>
                </Button>
                <Popover
                  id={id}
                  open={open}
                  anchorEl={anchorEl}
                  onClose={handleClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                >
                  <Box sx={{ p: 2, width: 300 }}>
                    {Object.keys(popoverData).map(category => (
                      <Box key={category}>
                        <Typography variant='h6'>{category}</Typography>
                        {popoverData[category].map((item, index) => (
                          <Box key={item.key} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Checkbox checked={item.checked} onChange={() => handleOptionChange(category, index)} />
                            <Typography>{item.label}</Typography>
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: 2,
                      mb: 5,
                      mr: 14
                    }}
                  >
                    <Button
                      variant='outlined'
                      onClick={() => {
                        setAnchorEl(null)
                      }}
                      sx={{
                        minWidth: '100px',
                        padding: '6px 16px'
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant='contained'
                      onClick={handleConfirm}
                      sx={{
                        minWidth: '100px',
                        padding: '6px 16px'
                      }}
                    >
                      Confirm
                    </Button>
                  </Box>
                </Popover>
              </Box>
            </Box>
          </Box>
          <Box sx={{ width: '98%', margin: 4 }}>
            <Box sx={{ borderRadius: '8px' }}>
              <CommonTable
                setPaginationModel={setPaginationModel}
                indexedRows={reportRows}
                total={''}
                loading={loading}
                disableColumnSorting={true}
                columns={columns}
                paginationModel={paginationModel}
                disableColumnFilter={false}
                rowHeight={70}
                scrollbarSize={10}
              />
            </Box>
          </Box>
        </Card>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default Animal
