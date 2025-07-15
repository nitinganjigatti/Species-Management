import { Card } from '@mui/material'
import { useRouter } from 'next/router'
import React from 'react'

import OrderReceiveForm from 'src/components/pharmacy/request/OrderReceiveForm'

const ShipmentDetails = () => {
  const router = useRouter()

  // const { requestId, orderId } = router.query
  const { shipmentId } = router.query

  return (
    <Card sx={{ p: 6 }}>
      <OrderReceiveForm orderId={shipmentId} requestedFrom={'requestByAllStores'} />
    </Card>
  )
}

export default ShipmentDetails
