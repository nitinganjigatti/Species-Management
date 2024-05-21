import Error404 from 'src/pages/404'
import AddExistingPurchase from 'src/components/pharmacy/purchase/AddExistingPurchase'

import { usePharmacyContext } from 'src/context/PharmacyContext'

const AddPurchase = () => {
  const { selectedPharmacy } = usePharmacyContext()

  return (
    <>
      {selectedPharmacy.type === 'central' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') ? (
        <AddExistingPurchase />
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default AddPurchase
