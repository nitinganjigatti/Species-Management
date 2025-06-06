import { Card } from '@mui/material'
import { useRouter } from 'next/router'
import React from 'react'

import OrderReceiveForm from 'src/components/pharmacy/request/OrderReceiveForm'

const AllShipmentDetails = () => {
  const router = useRouter()
  const { requestId, orderId, requestType } = router.query

  return (
    <Card sx={{ p: 6 }}>
      <OrderReceiveForm orderId={orderId} requestId={requestId} requestedFrom={requestType} />
    </Card>
  )
}

export default AllShipmentDetails
