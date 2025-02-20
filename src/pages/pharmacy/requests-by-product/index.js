import { Grid } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import RequestDetailsScreen from 'src/components/pharmacy/allStoresRequests/RequestDetailsScreen'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'

const RequestByProduct = () => {
  const { selectedPharmacy } = usePharmacyContext()
  const router = useRouter()

  const navigateToCentralStore = useCallback(() => {
    // debugger
    if (
      selectedPharmacy?.type === 'central' &&
      router.pathname !== '/pharmacy/requests-by-store/all-stores-request-list'
    ) {
      debugger
      router.push({
        pathname: `/pharmacy/requests-by-store/all-stores-request-list`,
        query: selectedPharmacy?.id
      })
    }
  }, [selectedPharmacy.type])
  return (
    <>
      {/* <Grid container>
        <RequestDetailsScreen />
      </Grid> */}
      {selectedPharmacy?.type === 'local' ? (
        <Grid container>
          <RequestDetailsScreen />
        </Grid>
      ) : (
        <>
          {navigateToCentralStore()}
          {/* <Grid sx={{ mb: 6, width: '100%' }}>
            <Error404></Error404>
          </Grid> */}
        </>
      )}
    </>
  )
}

export default RequestByProduct
