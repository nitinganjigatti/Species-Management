import { useContext } from 'react'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Checkbox,
  FormControl,
  FormHelperText,
  Grid,
  Popover,
  TextField,
  Typography
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { forwardRef, useState, useRef } from 'react'
import SingleDatePicker from 'src/components/SingleDatePicker'
import { getMortalityList, getNatalityList, getTransferList } from 'src/lib/api/report'
import { AuthContext } from 'src/context/AuthContext'
import Error404 from 'src/pages/404'

const Animal = () => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [errors, setErrors] = useState({})

  const authData = useContext(AuthContext)
  const reports_module = authData?.userData?.roles?.settings?.enable_reports_module

  const startDateRef = useRef()
  const endDateRef = useRef()

  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
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

  const downloadNewCSVFile = (csvContent, fileName) => {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading CSV:', error)
    }
  }

  const getNatalityDataToExport = async () => {
    try {
      const params = { type: 'birth', ...apiFilterParams }
      if (startDate) {
        params.start_date = startDate
      }
      if (endDate) {
        params.end_date = endDate
      }
      const response = await getNatalityList(params)
      if (response?.data?.animal_list?.length > 0) {
        const csvData = jsonToCsv(response.data.animal_list)
        const fileName = 'natality_data.csv'
        downloadNewCSVFile(csvData, fileName)
      } else {
        console.warn('No natality data available to export')
      }
    } catch (error) {
      console.error('Error exporting natality data:', error)
    }
  }

  const getMortalityDataToExport = async () => {
    try {
      const params = { type: 'death', ...apiFilterParams }
      if (startDate) {
        params.start_date = startDate
      }
      if (endDate) {
        params.end_date = endDate
      }
      const response = await getMortalityList(params)
      if (response?.data?.animal_list?.length > 0) {
        const csvData = jsonToCsv(response.data.animal_list)
        const fileName = 'mortality_data.csv'
        downloadNewCSVFile(csvData, fileName)
      } else {
        console.warn('No mortality data available to export')
      }
    } catch (error) {
      console.error('Error exporting natality data:', error)
    }
  }

  const getTransferDataToExport = async () => {
    try {
      const params = { type: 'transfer', ...apiFilterParams }
      if (startDate) {
        params.start_date = startDate
      }
      if (endDate) {
        params.end_date = endDate
      }
      const response = await getTransferList(params)
      if (response?.data?.animal_list?.length > 0) {
        const csvData = jsonToCsv(response.data.animal_list)
        const fileName = 'transfer_data.csv'
        downloadNewCSVFile(csvData, fileName)
      } else {
        console.warn('No mortality data available to export')
      }
    } catch (error) {
      console.error('Error exporting natality data:', error)
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

  const reportRows = [
    { id: 1, title: 'Natality', action: 'Download Natality' },
    { id: 2, title: 'Mortality', action: 'Download Mortality' },
    { id: 3, title: 'External Transfer', action: 'Download Transfer' }
  ]

  const id = open ? 'filter-popover' : undefined

  const columns = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 0.7,
      headerAlign: 'left',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', ml: 3 }}>
          {params.row.title}
        </Typography>
      )
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 0.7,
      renderCell: params => {
        const handleExport = () => {
          if (params.row.title === 'Natality') {
            getNatalityDataToExport()
          } else if (params.row.title === 'Mortality') {
            getMortalityDataToExport()
            console.warn('Mortality export not implemented yet')
          } else if (params.row.title === 'External Transfer') {
            getTransferDataToExport()
            console.warn('Transfer export not implemented yet')
          }
        }

        return (
          <Button variant='contained' onClick={handleExport}>
            {params.row.action}
          </Button>
        )
      }
    }
  ]

  return (
    <>
      {reports_module ? (
        <Card>
          <CardHeader title='Animal Report' sx={{ mb: '16px' }} />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', px: '16px', mb: '16px' }}>
            <Box display={{ display: 'flex', gap: 6 }}>
              <FormControl fullWidth>
                <SingleDatePicker
                  value={startDate}
                  name='FromDate*'
                  onChange={handleStartDateChange}
                  customInput={<CustomInput label='Start Date*' error={Boolean(errors.startDate)} />}
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
                  customInput={<CustomInput label='End Date*' error={Boolean(errors.endDate)} />}
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
                    width: '180px',
                    height: '40px',
                    mt: 2,
                    display: 'flex',
                    color: '#44544A',
                    fontWeight: 400,
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    alignItems: 'center',
                    justifyContent: 'center',

                    // gap: 2,
                    minWidth: '100px'
                  }}
                >
                  <img
                    src='/images/show_popup.png'
                    style={{ width: '24px', height: '24px', marginBottom: '2px' }}
                    alt='Filter Icon'
                  />

                  <Typography sx={{ color: '#1F515B', textTransform: 'capitalize' }}>Show/Hide</Typography>
                </Button>
                <Popover
                  id={'popoverButton'}
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}></Box>
          <DataGrid
            sx={{
              '.MuiDataGrid-cell:focus': { outline: 'none' },
              '& .MuiDataGrid-row:hover': { cursor: 'pointer' }
            }}
            hideFooterPagination
            autoHeight
            rows={reportRows}
            hideFooterSelectedRowCount
            rowHeight={70}
            columns={columns}
          />
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
