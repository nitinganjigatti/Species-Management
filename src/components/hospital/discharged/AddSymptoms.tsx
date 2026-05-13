import React from 'react'
import AddSymptomsBase from 'src/components/hospital/inpatient/AddSymptoms'

const AddSymptomsBaseAny: any = AddSymptomsBase

function AddSymptoms() {
  return <AddSymptomsBaseAny from='discharged' />
}

export default AddSymptoms
