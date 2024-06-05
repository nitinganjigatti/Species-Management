import Error404 from 'src/pages/404'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import AddStockAdjustment from 'src/components/pharmacy/stockAdjustment/AddStcokAdjustMent'

const AddPurchase = () => {
  const { selectedPharmacy } = usePharmacyContext()

  return (
    <>
      {selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD' ? (
        <AddStockAdjustment />
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default AddPurchase
