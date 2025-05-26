import React, { useEffect, useState } from 'react'
import { getReceivedMedicineschart } from 'src/lib/api/pharmacy/dashboard'
import MonthlyChart from 'src/views/utility/monthlychart'

const ReceivedMedicines = () => {
  const [purchaseData, setPurchaseData] = useState({ purchase_count: [], purchase_value: [] })

  const fetchPurchaseData = async () => {
    try {
      const result = await getReceivedMedicineschart()
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
        title='Received Medicines'
        data={purchaseData}
        barColor='#FA6140'
        lineColor='#fa614059'
        barName='Received Value'
        lineName='Received Count'
        viewMorePath='/pharmacy/reports/received-medicines-report/'
      />
    </>
  )
}

export default ReceivedMedicines
