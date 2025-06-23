import React, { useState } from 'react'
import * as yup from 'yup'
import BasicDetails from '../view-component/BasicDetails'
import BasicDetailsAddEdit from '../view-component/BasicDetailsAddEdit'

const validationSchema = yup.object({
  airwaybillvalue: yup
    .string()
    .required('Airway bill number is required')
    .test('valid-awb', 'Enter a valid 11-digit airway bill number', value => {
      const strippedValue = value.replace(/\s/g, '') // Remove spaces
      return /^\d{11}$/.test(strippedValue) // Ensure 11 digits
    }),
  startDate: yup.date().nullable().required('Shipment date is required'),
  uploadedFile: yup.mixed().required('File upload is required')
})

const ShipmentBasicDetails = ({ onEditClick, showEdit, setShowEdit }) => {
  const [airwaybillvalue, setAirwaybillvalue] = useState('')
  const [startDate, setStartDate] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [errors, setErrors] = useState({})

  const validateFields = async () => {
    try {
      await validationSchema.validate({ airwaybillvalue, startDate, uploadedFile }, { abortEarly: false })
      setErrors({})
      return true
    } catch (validationErrors) {
      const formattedErrors = {}
      validationErrors.inner.forEach(error => {
        formattedErrors[error.path] = error.message
      })
      setErrors(formattedErrors)
      return false
    }
  }

  const handleEditClick = () => {
    setShowEdit(true) // triggered from parent
  }

  // listen to parent instruction to trigger edit mode
  React.useEffect(() => {
    if (onEditClick) onEditClick.current = handleEditClick
  }, [onEditClick])

  const handleSave = async () => {
    const isValid = await validateFields()
    if (isValid) {
      console.log('Form submitted:', { airwaybillvalue, startDate, uploadedFile })
      setShowEdit(false)
    }
  }

  return (
    <>
      {showEdit ? (
        <BasicDetailsAddEdit
          onSave={handleSave}
          onCancel={() => setShowEdit(false)}
          airwaybillvalue={airwaybillvalue}
          setAirwaybillvalue={setAirwaybillvalue}
          startDate={startDate}
          setStartDate={setStartDate}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
          errors={errors}
          setErrors={setErrors}
        />
      ) : (
        <BasicDetails airwaybillvalue={airwaybillvalue} />
      )}
    </>
  )
}

export default ShipmentBasicDetails
