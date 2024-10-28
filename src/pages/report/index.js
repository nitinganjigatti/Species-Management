import {
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Tab,
  Divider,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
// import { DataGrid } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import { ExcelExportButton } from 'src/components/Buttons'
import { getHousingReport, getSpeciesReport, getUsersReportList } from 'src/lib/api/parivesh/housing'
import { DataGrid } from '@mui/x-data-grid'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import StatisticsReport from './statistics'
import { useTheme } from '@emotion/react'

const ReportList = () => {
  const theme = useTheme()

  const [userList, setUserList] = useState([])
  const [housingList, setHousingList] = useState([])
  const [speciesList, setSpeciesList] = useState([])
  const [status, setStatus] = useState('statistics')
  const [rows, setRows] = useState([])
  const [selectedSite, setSelectedSite] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getUsersReportList()
        if (response) {
          setUserList(response)
          // setRows(response)
        } else {
          console.error('Unexpected response format or request failed')
        }
      } catch (error) {
        console.error('Error occurred while fetching:', error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const fetchHousingData = async () => {
      try {
        const response = await getHousingReport()
        if (response) {
          const csvData = jsonToCsv(response?.data)
          setHousingList(csvData)

          const speciesResult = await getSpeciesReport()
          if (speciesResult) {
            const speciesCsvData = jsonToCsv(speciesResult?.data)
            setSpeciesList(speciesCsvData)
          }
        }
      } catch (error) {
        console.error('Error occurred while fetching:', error)
      }
    }
    fetchHousingData()
  }, [])

  const jsonToCsv = jsonData => {
    if (!jsonData || jsonData.length === 0) return ''

    const keys = Object.keys(jsonData[0])
    const csvRows = jsonData.map(item => keys.map(key => item[key] || '').join(','))
    return [keys.join(','), ...csvRows].join('\n')
  }

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  // function downloadCsvFile(csvData, fileName) {

  //   const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
  //   const url = window.URL.createObjectURL(blob)
  //   const a = document.createElement('a')
  //   a.setAttribute('href', url)
  //   a.setAttribute('download', fileName)
  //   document.body.appendChild(a)
  //   a.click()
  //   document.body.removeChild(a)
  // }

  const downloadNewCSVFile = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getUserDataToExport = async () => {
    const fileName = 'user_data.csv'
    downloadNewCSVFile(userList, fileName)
  }

  const getHousingDataToExport = async () => {
    const filename = 'housing_data.csv'
    downloadNewCSVFile(housingList, filename)
  }

  const getSpeciesDataToExport = async () => {
    const filename = 'species_data.csv'
    downloadNewCSVFile(speciesList, filename)
  }

  const handleChange = (event, newValue) => {
    // setTotal(0)
    setStatus(newValue)
    // setSelectedEggTab(newValue)
    // setSearchValue('')
  }

  // Manually set rows with titles and action buttons
  const reportRows = [
    { id: 1, title: 'Species', action: 'Download Species' },
    { id: 2, title: 'Housing', action: 'Download Housing' },
    { id: 3, title: 'Users', action: 'Download Users' }
  ]

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
          if (params.row.title === 'Species') {
            getSpeciesDataToExport()
          } else if (params.row.title === 'Housing') {
            getHousingDataToExport()
          } else if (params.row.title === 'Users') {
            getUserDataToExport()
          }
        }
        return <ExcelExportButton variant='contained' title='download' action={handleExport}></ExcelExportButton>
      }
    }
  ]

  const title = (
    <>
      <Typography
        sx={{
          fontSize: '24px',
          fontWeight: 500,
          fontFamily: 'Inter',
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        Statistics Report
      </Typography>
    </>
  )
  return (
    <>
      <Card>
        <CardHeader title={title} />

        <TabContext value={status}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
            {/* Tabs on the left */}
            <TabList onChange={handleChange}>
              <Tab sx={{ ml: 2 }} value='statistics' label='Statistics' />
              <Tab value='species' label='Species' />
              {/* <Tab value='all' label='All' /> */}
            </TabList>

            {/* Dropdowns on the right */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' }, // Column layout on small screens, row on larger
                alignItems: 'center', // Center align items vertically
                gap: 4, // Reduced gap between components,
                mr: 2
              }}
            >
              <FormControl fullWidth sx={{ maxWidth: '200px' }}>
                <InputLabel
                  sx={{
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    color: '#44544A',
                    width: '152px',
                    height: '17px',
                    mt: 0.5
                  }}
                >
                  All Sites
                </InputLabel>
                <Select
                  value={selectedSite}
                  onChange={e => setSelectedSite(e.target.value)}
                  label='Site'
                  sx={{
                    height: '40px',
                    mt: 2,
                    width: '200px',
                    borderRadius: '4px',
                    mr: { sm: 1, xs: 0 } // Small margin on larger screens
                  }}
                >
                  <MenuItem value='Site1'>Site 1</MenuItem>
                  <MenuItem value='Site2'>Site 2</MenuItem>
                </Select>
              </FormControl>

              {/* <ExcelExportButton variant='contained' title='download' action={""}></ExcelExportButton> */}

              <Button
                variant='contained'
                sx={{
                  width: '220px',
                  height: '38px',
                  mt: { xs: 1, sm: 2 },
                  mr: { sm: 0, xs: 0 },
                  fontSize: '14px',
                  fontFamily: 'Inter'
                }}
              >
                Download Report
                <img src='/images/download.png' />
              </Button>
            </Box>
          </Box>
          <TabPanel value='statistics' sx={{ p: 0 }}>
            <StatisticsReport />
            <Divider />

            {/* {tableDat
            a()} */}
          </TabPanel>
          <TabPanel value='species' sx={{ p: 0 }}>
            <StatisticsReport />
          </TabPanel>
          {/* <TabPanel value='all' sx={{ p: 0 }}>
            <Grid sx={{ mt: 2 }}>
              <DataGrid
                sx={{
                  '.MuiDataGrid-cell:focus': {
                    outline: 'none'
                  },

                  '& .MuiDataGrid-row:hover': {
                    cursor: 'pointer'
                  }
                }}
                hideFooterPagination={true}
                autoHeight
                rows={reportRows}
                // disableColumnSelector={true}
                hideFooterSelectedRowCount={true}
                rowHeight={70}
                // rowCount={total}
                columns={columns}
              />
            </Grid>
          </TabPanel> */}
        </TabContext>
      </Card>
    </>
  )
}

export default ReportList
