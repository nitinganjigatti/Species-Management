import React from 'react'
import AddSymptoms from 'src/components/hospital/inpatient/AddSymptoms'

const AddSymptomsAny: any = AddSymptoms

function AddSymptomsPage() {
  return <AddSymptomsAny from='outPatient' />
}

export default AddSymptomsPage
