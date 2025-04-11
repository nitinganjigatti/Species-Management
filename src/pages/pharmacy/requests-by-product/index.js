import { Grid } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import RequestDetailsScreen from 'src/components/pharmacy/allStoresRequests/RequestDetailsScreen'
import { usePharmacyContext } from 'src/context/PharmacyContext'

const RequestByProduct = () => {
  const { selectedPharmacy } = usePharmacyContext()
  const router = useRouter()

  const navigateToCentralStore = useCallback(() => {
    // debugger
    if (selectedPharmacy?.type === 'central' && router.pathname !== '/pharmacy/requests-by-store') {
      // debugger
      router.push({
        pathname: `/pharmacy/requests-by-store`,
        query: selectedPharmacy?.id
      })
    }
  }, [selectedPharmacy.type])

  return (
    <>
      {selectedPharmacy?.type === 'local' ? (
        <Grid container>
          <RequestDetailsScreen />
        </Grid>
      ) : (
        <>{navigateToCentralStore()}</>
      )}
    </>
  )
}

export default RequestByProduct
