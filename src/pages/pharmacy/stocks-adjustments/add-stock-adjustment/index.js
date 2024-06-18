import Error404 from 'src/pages/404'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import AddStockAdjustment from 'src/components/pharmacy/stockAdjustment/AddStcokAdjustMent'

const AddStockAdjustments = () => {
  const { selectedPharmacy } = usePharmacyContext()

  return (
    <>
      {selectedPharmacy.permission.key === 'allow_full_access' ||
      selectedPharmacy.permission.stock_adjustment === 1 ||
      selectedPharmacy.permission.stock_adjustment === '1' ? (
        <AddStockAdjustment />
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default AddStockAdjustments
