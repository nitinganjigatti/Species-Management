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
  Button
} from '@mui/material'
// import { DataGrid } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import { ExcelExportButton } from 'src/components/Buttons'
import { getHousingReport, getSpeciesReport, getUsersReportList } from 'src/lib/api/parivesh/housing'
import { DataGrid } from '@mui/x-data-grid'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'

const Mortality = () => {
  const [userList, setUserList] = useState([])
  const [housingList, setHousingList] = useState([])
  const [speciesList, setSpeciesList] = useState([])
  const [rows, setRows] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getUsersReportList()
        if (response) {
          setUserList([...userList, response])
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

  function downloadCsvFile(csvData, fileName) {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('href', url)
    a.setAttribute('download', fileName)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

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
  return (
    <>
      <Card>
        <CardHeader title='Report Section' sx={{ mb: 10 }} />
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
          selectionModel={[]}
          // rowCount={total}
          columns={columns}
        />
      </Card>
    </>
  )
}

export default Mortality
