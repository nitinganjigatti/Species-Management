import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import AllStoresRequestList from 'src/components/pharmacy/allStoresRequests/AllStoresRequestList'
import { usePharmacyContext } from 'src/context/PharmacyContext'

export default function StoresRequestList() {
  const router = useRouter()
  const { selectedPharmacy } = usePharmacyContext()

  const navigateToLocalStore = useCallback(() => {
    if (selectedPharmacy?.type === 'local' && router.pathname !== '/pharmacy/requests-by-product') {
      router.push({
        pathname: `/pharmacy/requests-by-product`,
        query: selectedPharmacy?.id
      })
    }
  }, [selectedPharmacy?.id])

  return <div>{selectedPharmacy.type === 'local' ? <>{navigateToLocalStore()}</> : <AllStoresRequestList />}</div>
}
