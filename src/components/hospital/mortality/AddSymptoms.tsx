import React from 'react'
import AddSymptomsBase from 'src/components/hospital/inpatient/AddSymptoms'

const AddSymptomsBaseAny: any = AddSymptomsBase

function AddSymptoms() {
  return <AddSymptomsBaseAny from='mortality' />
}

export default AddSymptoms
