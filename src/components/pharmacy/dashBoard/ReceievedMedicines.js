// import Card from '@mui/material/Card'
// import { useTheme } from '@mui/material/styles'
// import CardHeader from '@mui/material/CardHeader'
// import Typography from '@mui/material/Typography'
// import CardContent from '@mui/material/CardContent'
// import { useEffect, useState } from 'react'
// import ReactApexcharts from 'src/@core/components/react-apexcharts'
// import { Button, Checkbox, FormControlLabel, Box } from '@mui/material'
// import Router from 'next/router'
// import { usePharmacyContext } from 'src/context/PharmacyContext'
// import { getReceivedMedicineschart } from 'src/lib/api/pharmacy/dashboard'

import React, { useEffect, useState } from 'react'
import { getReceivedMedicineschart } from 'src/lib/api/pharmacy/dashboard'
import MonthlyChart from 'src/views/utility/monthlychart'

const ReceivedMedicines = () => {
  const [dispatchData, setDispatchData] = useState({ dispatch_count: [], dispatch_value: [] })

  const fetchDispatchData = async () => {
    try {
      const result = await getReceivedMedicineschart()
      if (result?.success === true && result?.data) {
        debugger
        setDispatchData(result.data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchDispatchData()
  }, [])

  const handleClick = () => {
    Router.push({
      pathname: '/pharmacy/reports/received-medicines-report'
    })
  }

  return (
    <>
      <MonthlyChart
        title='Received Medicines'
        data={dispatchData}
        barColor='#FA6140'
        lineColor='#FFBDA8'
        barName='Received Value'
        lineName='Received Count'
        viewMorePath='/pharmacy/reports/received-medicines-report'
      />
    </>
  )
}

export default ReceivedMedicines
