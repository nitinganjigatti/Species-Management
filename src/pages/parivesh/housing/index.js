import { Button, Card, CardHeader, Grid } from '@mui/material'
import { useEffect, useState } from 'react'
import { ExcelExportButton } from 'src/components/Buttons'
import { getHousingReport, getSpeciesReport, getUsersReportList } from 'src/lib/api/parivesh/housing'

const housing = () => {
  const [userList, setUserList] = useState([])
  const [housingList, setHousingList] = useState([])
  const [speciesList , setSpeciesList] = useState([])


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getUsersReportList()

        if (response) {
          setUserList([...userList, response])
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

          const speciesresult = await getSpeciesReport()
          if(speciesresult){
            const speciesCsvData =jsonToCsv(speciesresult?.data) 
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
    downloadCsvFile(userList, fileName)
  }

  const getHousingDataToExport = async () => {
    const filename = 'housing_data.csv'
    downloadNewCSVFile(housingList, filename)
  }

  const getSpeciesDataToExport = async () => {
    const filename = 'species_data.csv' 
    downloadNewCSVFile(speciesList , filename)
  }

  return (
    <Card sx={{ height: '200px' }}>
      <CardHeader title='Housing Module' />
      <Grid sx={{ display: 'flex', justifyContent: 'space-around', mt: 10 }}>
        <Grid>
          <ExcelExportButton
            disabled={userList.length > 0 ? false : true}
            action={() => {
              getSpeciesDataToExport()
            }}
            title='Species'
          />
        </Grid>
        <Grid>
          {' '}
          <ExcelExportButton
            disabled={userList.length > 0 ? false : true}
            action={() => {
              getHousingDataToExport()
            }}
            title='Housing'
          />
        </Grid>
        <Grid>
          {' '}
          <ExcelExportButton
            disabled={userList.length > 0 ? false : true}
            action={() => {
              getUserDataToExport()
            }}
            title='Users'
          />
        </Grid>
      </Grid>
    </Card>
  )
}
export default housing
