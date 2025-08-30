import React, { useEffect, useImperativeHandle, useState } from 'react'
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
  airwaybillvalue: yup.string().required('Airway bill number is required'),
  // .test('valid-awb', 'Enter a valid 11-digit airway bill number', value => {
  //   const strippedValue = value.replace(/\s/g, '')
  //   return /^\d{11}$/.test(strippedValue)
  // }),
  startDate: yup.date().nullable().required('Shipment date is required'),
  uploadedFile: yup
    .mixed()
    .required('File is required')
    .test('fileType', 'Unsupported file format', value => {
      if (!value) return true

      if (value.type) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/x-png', 'application/pdf']
        return allowedTypes.includes(value.type)
      }

      if (value.file_original_name) {
        const ext = value.file_original_name.split('.').pop().toLowerCase()
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf']
        return allowedExtensions.includes(ext)
      }

      return false
    })
})

const ShipmentBasicDetails = React.forwardRef(
  (
    {
      onEditClick,
      showEdit,
      setShowEdit,
      status,
      setStatus,
      setAirwaybillvalue,
      airwaybillvalue,
      shipmentIdval,
      setshipmentIdVal,
      setExpanded,
      linkedDocumentsData,
      mastersData
    },
    ref
  ) => {
    const [startDate, setStartDate] = useState(null)
    const [uploadedFile, setUploadedFile] = useState(null)
    const [transportType, setTransportType] = useState('airCargo')
    const [errors, setErrors] = useState({})
    const [loader, setLoader] = useState(false)
    const router = useRouter()
    const { id, action } = router.query

    useImperativeHandle(ref, () => ({
      handleSave: newStatus => handleSave(newStatus)
    }))

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

    useEffect(() => {
      if (onEditClick) onEditClick.current = handleEditClick
      if (id && mastersData?.document_type_id) {
        fetchbasicDetails()
      }
    }, [onEditClick, id, mastersData])

    useEffect(() => {
      if (shipmentIdval && status !== 'completed') {
        if (linkedDocumentsData?.exports_count > 0) {
          router.push(`/compliance/documents/shipments/AddEditShipment/?id=${shipmentIdval}&action=edit&export=1`)
        } else {
          router.push(`/compliance/documents/shipments/AddEditShipment/?id=${shipmentIdval}&action=edit`)
        }
      }
    }, [shipmentIdval, showEdit])

    const fetchbasicDetails = async () => {
      try {
        setLoader(true)
        const response = await getShipmentBasicDetails(id, mastersData?.document_type_id)
        if (response?.success) {
          // const formatAirwayBill = (value = '') => {
          //   const inputValue = value.replace(/\D/g, '').slice(0, 11)
          //   return inputValue
          //     .split('')
          //     .map((digit, index) => (index === 2 ? digit + '    ' : digit + '  '))
          //     .join('')
          //     .trim()
          // }
          setLoader(false)
          setAirwaybillvalue(response?.data?.shipment_number)
          setStartDate(response?.data?.shipment_date ? response?.data?.shipment_date : null)
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

    const handleSave = async statusToSave => {
      const isCalledViaRef = typeof statusToSave !== 'object'
      let saveStatus
      if (typeof statusToSave === 'string') {
        saveStatus = statusToSave
      } else if (statusToSave && typeof statusToSave === 'object') {
        if (statusToSave.target && typeof statusToSave.target.value === 'string') {
          saveStatus = status
        } else {
          saveStatus = status
        }
      } else {
        saveStatus = status
      }
      const isValid = await validateFields()
      if (isValid) {
        const isFileObject = uploadedFile instanceof File
        const transformedData = {
          //shipment_number: airwaybillvalue.replace(/\s+/g, '') || '',
          shipment_number: airwaybillvalue || '',
          shipment_date: dayjs(startDate).format('YYYY-MM-DD') || '',
          transport_type: transportType || '',
          shipment_state: saveStatus || '',
          notes: 'test' || '',
          document_type_id: mastersData?.document_type_id || 5,
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
            setshipmentIdVal(response?.data?.id)
            Toaster({ type: 'success', message: response?.message })
            setLoader(false)
            setShowEdit(false)
            if (!isCalledViaRef) {
              setExpanded(['animals-details'])
            }
            fetchbasicDetails()
            return true
            //saveStatus === 'completed' ? router.push(`/compliance/documents/shipments`) : ''
          } else {
            setLoader(false)
            Toaster({ type: 'error', message: response?.message })
            return false
          }
        } catch (e) {
          setLoader(false)
          Toaster({ type: 'error', message: JSON.stringify(e) })
          return false
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
)

export default ShipmentBasicDetails
