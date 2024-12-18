import React, { useEffect, useState } from 'react'
import { getMonthWiseDispatchList } from 'src/lib/api/pharmacy/dashboard'
import MonthlyChart from 'src/views/utility/monthlychart'

const MonthlyDispatchChart = () => {
  const [dispatchData, setDispatchData] = useState({ dispatch_count: [], dispatch_value: [] })

  const fetchDispatchData = async () => {
    try {
      const result = await getMonthWiseDispatchList()
      if (result?.success === true && result?.data) {
        setDispatchData(result.data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchDispatchData()
  }, [])

  return (
    <>
      <MonthlyChart
        title='Month Wise Dispatch'
        data={dispatchData}
        barColor='#006D35'
        lineColor='#37BD69'
        barName='Dispatch Value'
        lineName='Dispatch Count'
        viewMorePath='/pharmacy/reports/month-wise-dispatch'
      />
    </>
  )
}

export default MonthlyDispatchChart
