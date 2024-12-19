import React, { useEffect, useState } from 'react'
import { getMonthWisePurchaseList } from 'src/lib/api/pharmacy/dashboard'
import MonthlyChart from 'src/views/utility/monthlychart'

const MonthlyPurchaseCount = () => {
  const [purchaseData, setPurchaseData] = useState({ purchase_count: [], purchase_value: [] })

  const fetchPurchaseData = async () => {
    try {
      const result = await getMonthWisePurchaseList()
      if (result?.success === true && result?.data) {
        setPurchaseData(result.data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchPurchaseData()
  }, [])

  return (
    <>
      <MonthlyChart
        title='Month Wise Purchase'
        data={purchaseData}
        barColor='#FA6140'
        lineColor='#FFBDA8'
        barName='Purchase Value'
        lineName='Purchase Count'
        viewMorePath='/pharmacy/reports/month-wise-purchase'
      />
    </>
  )
}

export default MonthlyPurchaseCount
