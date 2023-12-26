import AddPurchaseForm from 'src/components/pharmacy/purchase/AddPurchaseForm'
import Error404 from 'src/pages/404'

import { usePharmacyContext } from 'src/context/PharmacyContext'

const AddPurchase = () => {
  const { selectedPharmacy } = usePharmacyContext()

  return (
    <>
      {selectedPharmacy.type === 'central' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') ? (
        <AddPurchaseForm />
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default AddPurchase
