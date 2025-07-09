import React, { useState } from 'react'
import * as yup from 'yup'
import BasicDetails from '../shipment-view/BasicDetails'
import BasicDetailsAddEdit from '../shipment-view/BasicDetailsAddEdit'
import Toaster from 'src/components/Toaster'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import {
  addShipmentBasicDetails,
  getShipmentBasicDetails,
  updateShipmentBasicDetails
} from 'src/lib/api/compliance/shipment'

const validationSchema = yup.object({
  airwaybillvalue: yup
    .string()
    .required('Airway bill number is required')
    .test('valid-awb', 'Enter a valid 11-digit airway bill number', value => {
      const strippedValue = value.replace(/\s/g, '') // Remove spaces
      return /^\d{11}$/.test(strippedValue)
    }),
  startDate: yup.date().nullable().required('Shipment date is required'),
  uploadedFile: yup
    .mixed()
    .required('File is required')
    .test('fileType', 'Unsupported file format', value => {
      if (!value) return true

      // If it's a File object (i.e., new upload)
      if (value.type) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/x-png', 'application/pdf']
        return allowedTypes.includes(value.type)
      }

      // If it's an existing uploaded file (edit mode)
      if (value.file_original_name) {
        const ext = value.file_original_name.split('.').pop().toLowerCase()
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf']
        return allowedExtensions.includes(ext)
      }

      return false
    })
})

const ShipmentBasicDetails = ({ onEditClick, showEdit, setShowEdit, status, setStatus }) => {
  const [airwaybillvalue, setAirwaybillvalue] = useState('')
  const [startDate, setStartDate] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [transportType, setTransportType] = useState('airCargo')
  const [errors, setErrors] = useState({})
  const [loader, setLoader] = useState(false)
  const router = useRouter()
  const { id, action } = router.query

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
    setShowEdit(false)
  }

  // listen to parent instruction to trigger edit mode
  React.useEffect(() => {
    if (onEditClick) onEditClick.current = handleEditClick
    if (id) {
      fetchbasicDetails()
    }
  }, [onEditClick, id])

  const fetchbasicDetails = async () => {
    try {
      setLoader(true)
      const response = await getShipmentBasicDetails(id)
      if (response?.success) {
        setLoader(false)
        setAirwaybillvalue(response?.data?.shipment_number)
        setStartDate(dayjs(response?.data?.shipment_date).toDate())
        setTransportType(response?.data?.transport_type)
        setUploadedFile(response?.data?.documents[0])
        setStatus(response?.data?.shipment_state)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (e) {
      setLoader(false)
      Toaster({ type: 'error', message: 'Error fetching shipment basic details' })
    }
  }

  const handleSave = async () => {
    const isValid = await validateFields()
    if (isValid) {
      const isFileObject = uploadedFile instanceof File
      const transformedData = {
        shipment_number: airwaybillvalue || '',
        shipment_date: dayjs(startDate).format('YYYY-MM-DD') || '',
        transport_type: transportType || '',
        shipment_state: status || '',
        notes: 'test' || '',
        document_type_id: 5 || '',
        attachment: isFileObject ? uploadedFile : undefined,
        ...(isFileObject
          ? {}
          : {
              'attachment[file_path]': uploadedFile.file_path,
              'attachment[file_original_name]': uploadedFile.file_original_name,
              'attachment[document_type_id]': uploadedFile.document_type_id,
              'attachment[trade_document_id]': uploadedFile.trade_document_id
            })
      }

      try {
        setLoader(true)
        const response = id
          ? await updateShipmentBasicDetails(id, transformedData)
          : await addShipmentBasicDetails(transformedData)
        if (response?.success) {
          Toaster({ type: 'success', message: 'Document type ' + response?.message })
          setLoader(false)

          setShowEdit(false)
          router.push(`/compliance/documents/shipments`)
        } else {
          setLoader(false)
          Toaster({ type: 'error', message: response?.message })
        }
      } catch (e) {
        setLoader(false)
        Toaster({ type: 'error', message: JSON.stringify(e) })
      }
    }
  }

  return (
    <>
      {id && action === 'edit' ? (
        <BasicDetailsAddEdit
          onSave={handleSave}
          onCancel={() => setShowEdit(false)}
          airwaybillvalue={airwaybillvalue}
          setAirwaybillvalue={setAirwaybillvalue}
          startDate={startDate}
          setStartDate={setStartDate}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
          setTransportType={setTransportType}
          transportType={transportType}
          errors={errors}
          setErrors={setErrors}
          loader={loader}
        />
      ) : id && action === 'details' ? (
        <BasicDetails
          airwaybillvalue={airwaybillvalue}
          setShowEdit={setShowEdit}
          showEdit={showEdit}
          startDate={startDate}
          uploadedFile={uploadedFile}
          loader={loader}
        />
      ) : (
        <BasicDetailsAddEdit
          onSave={handleSave}
          onCancel={() => setShowEdit(false)}
          airwaybillvalue={airwaybillvalue}
          setAirwaybillvalue={setAirwaybillvalue}
          startDate={startDate}
          setStartDate={setStartDate}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
          setTransportType={setTransportType}
          transportType={transportType}
          errors={errors}
          setErrors={setErrors}
          loader={loader}
        />
      )}
    </>
  )
}

export default ShipmentBasicDetails
