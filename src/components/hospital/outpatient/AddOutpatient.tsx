import React from 'react'
import { useTranslation } from 'react-i18next'
import AddPatientForm from 'src/components/hospital/AddPatientForm/AddPatientForm'
import useSafeRouter from 'src/hooks/useSafeRouter'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

const AddPatient = () => {
  const { t } = useTranslation()
  const router = useSafeRouter()

  return (
    <>
      <DynamicBreadcrumbs
        pageItems={[
          { title: t('navigation.hospital') },
          { title: t('hospital_module.patients') },
          { title: t('hospital_module.outpatient'), onClick: () => router.back() },
          { title: t('hospital_module.add_patient') }
        ]}
      />
      <AddPatientForm defaultTreatmentType='opd' />
    </>
  )
}

export default AddPatient
