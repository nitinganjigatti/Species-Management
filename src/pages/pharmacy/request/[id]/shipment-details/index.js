import { Card } from '@mui/material'
import { useRouter } from 'next/router'
import React from 'react'

import OrderReceiveForm from 'src/components/pharmacy/request/OrderReceiveForm'

const ShipmentDetails = () => {
  const router = useRouter()
  const { id, orderId } = router.query

  console.log(id, orderId, '123')

  return (
    <Card sx={{ p: 6 }}>
      <OrderReceiveForm orderId={orderId} requestId={id} />
    </Card>
  )
}

export default ShipmentDetails
