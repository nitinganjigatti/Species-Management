import React from 'react'
import ShipRequest from 'src/components/pharmacy/request/ShipRequestForm'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import { useDispatch, useSelector } from 'react-redux'
import { clearDispatchedItems } from 'src/store/slices/pharmacy/request/shipmentSlice'
import { Card, Grid } from '@mui/material'
import { useRouter } from 'next/router'

export default function ShipRequestedItems() {
  const router = useRouter()
  const { selectedPharmacy } = usePharmacyContext()
  const dispatch = useDispatch()
  const dispatchedItems = useSelector(state => state.shipment.dispatchedItems)

  return (
    <>
      {selectedPharmacy?.type === 'central' ? (
        <Card>
          <ShipRequest
            dispatchedItems={dispatchedItems || []}
            storeDetails={dispatchedItems || []}
            resetForm={() => {
              dispatch(clearDispatchedItems())
              router.back()
            }}
            close={false}
            permissionView={true}
          />
        </Card>
      ) : (
        <Grid sx={{ mb: 6, width: '100%' }}>
          <Error404></Error404>
        </Grid>
      )}
    </>
  )
}
