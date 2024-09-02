import { Button, Card, CardHeader, Grid } from '@mui/material'
import { useEffect, useState } from 'react'
import { ExcelExportButton } from 'src/components/Buttons'
import { getUsersReportList } from 'src/lib/api/parivesh/housing'

const housing = () => {
  const [userList, setUserList] = useState([])

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

  console.log('Users >>', userList)

  const downloadCSVFile = (csvContent, fileName) => {
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
    downloadCSVFile(userList, fileName)
  }

  return (
    <Card sx={{ height: '200px' }}>
      <CardHeader title='Housing Module' />
      <Grid sx={{ display: 'flex', justifyContent: 'space-around', mt: 10 }}>
        <Grid>
          <ExcelExportButton
            disabled={userList.length > 0 ? false : true}
            action={() => {
              getUserDataToExport()
            }}
            title='Species'
          />
        </Grid>
        <Grid>
          {' '}
          <ExcelExportButton
            disabled={userList.length > 0 ? false : true}
            action={() => {
              getUserDataToExport()
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
