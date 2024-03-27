import AddRequestForm from 'src/components/pharmacy/request/AddRequestForm'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'

const InvoiceCard = () => {
  const { selectedPharmacy } = usePharmacyContext()

  return (
    <>
      {selectedPharmacy.type === 'local' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') ? (
        <AddRequestForm />
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default InvoiceCard
