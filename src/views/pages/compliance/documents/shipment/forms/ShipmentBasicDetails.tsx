import React, { useEffect, useImperativeHandle, useState } from 'react'
import * as yup from 'yup'
import BasicDetails from '../shipment-view/BasicDetails'
import BasicDetailsAddEdit from '../shipment-view/BasicDetailsAddEdit'
import Toaster from 'src/components/Toaster'
import dayjs from 'dayjs'
import useSafeRouter from 'src/hooks/useSafeRouter'
import {
  addShipmentBasicDetails,
  getShipmentBasicDetails,
  updateShipmentBasicDetails
} from 'src/lib/api/compliance/shipment'
import { MastersData } from 'src/types/compliance'

interface LinkedDocumentsData {
  exports_count?: number
  [key: string]: unknown
}

interface ShipmentBasicDetailsProps {
  onEditClick: React.MutableRefObject<(() => void) | null>
  showEdit: boolean
  setShowEdit: React.Dispatch<React.SetStateAction<boolean>>
  status: string
  setStatus: React.Dispatch<React.SetStateAction<string>>
  setAirwaybillvalue: React.Dispatch<React.SetStateAction<string>>
  airwaybillvalue: string
  shipmentIdval: string | number | null
  setshipmentIdVal: React.Dispatch<React.SetStateAction<string | number | null>>
  setExpanded: React.Dispatch<React.SetStateAction<string[]>>
  linkedDocumentsData: LinkedDocumentsData
  mastersData: MastersData
  exportCount: number
}

const validationSchema = yup.object({
  airwaybillvalue: yup.string().required('Airway bill number is required'),

  // .test('valid-awb', 'Enter a valid 11-digit airway bill number', value => {
  //   const strippedValue = value.replace(/\s/g, '')
  //   return /^\d{11}$/.test(strippedValue)
  // }),
  fileNumberValue: yup.string().required('File Number is required'),
  startDate: yup.date().nullable().required('Shipment date is required'),
  uploadedFile: yup
    .mixed()
    .required('File is required')
    .test('fileType', 'Unsupported file format', value => {
      if (!value) return true

      if ((value as File).type) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/x-png', 'application/pdf']

return allowedTypes.includes((value as File).type)
      }

      if ((value as Record<string, unknown>).file_original_name) {
        const ext = ((value as Record<string, unknown>).file_original_name as string).split('.').pop()!.toLowerCase()
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf']

return allowedExtensions.includes(ext)
      }

      return false
    })
})

const ShipmentBasicDetails = React.forwardRef<{ handleSave: (status: string) => Promise<boolean | undefined> }, ShipmentBasicDetailsProps>(
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
      mastersData,
      exportCount
    },
    ref
  ) => {
    const [startDate, setStartDate] = useState<string | null>(null)
    const [uploadedFile, setUploadedFile] = useState<File | Record<string, unknown> | null>(null)
    const [transportType, setTransportType] = useState<string>('airCargo')
    const [fileNumberValue, setFileNumberValue] = useState<string>('')
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loader, setLoader] = useState<boolean>(false)
    const router = useSafeRouter()
    const { id, action } = router.query

    useImperativeHandle(ref, () => ({
      handleSave: (newStatus: string) => handleSave(newStatus)
    }))

    const validateFields = async () => {
      try {
        await validationSchema.validate(
          { airwaybillvalue, fileNumberValue, startDate, uploadedFile },
          { abortEarly: false }
        )
        setErrors({})

return true
      } catch (validationErrors) {
        const yupError = validationErrors as yup.ValidationError
        const formattedErrors: Record<string, string> = {}
        yupError.inner.forEach(error => {
          if (error.path) formattedErrors[error.path] = error.message
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
        if ((linkedDocumentsData?.exports_count ?? 0) > 0 || exportCount > 0) {
          router.push(`/compliance/documents/shipments/AddEditShipment/?id=${shipmentIdval}&action=edit&export=1`)
        } else {
          router.push(`/compliance/documents/shipments/AddEditShipment/?id=${shipmentIdval}&action=edit`)
        }
      }
    }, [shipmentIdval, showEdit])

    const fetchbasicDetails = async () => {
      try {
        setLoader(true)
        const response = await getShipmentBasicDetails(id as string | number, mastersData?.document_type_id as string | number)
        if (response?.success) {
          setLoader(false)
          setAirwaybillvalue(response?.data?.shipment_number as string ?? '')
          setStartDate(response?.data?.shipment_date ? response?.data?.shipment_date as string : null)
          setTransportType(response?.data?.transport_type as string ?? '')
          setFileNumberValue(response?.data?.file_number as string ?? '')
          setUploadedFile((response?.data?.documents as unknown[])?.[0] as Record<string, unknown> ?? null)
          setStatus(response?.data?.shipment_state as string ?? '')
        } else {
          setLoader(false)
          Toaster({ type: 'error', message: response?.message })
        }
      } catch (e) {
        setLoader(false)
        Toaster({ type: 'error', message: 'Error fetching shipment basic details' })
      }
    }

    const handleSave = async (statusToSave: string | React.SyntheticEvent): Promise<boolean | undefined> => {
      const isCalledViaRef = typeof statusToSave !== 'object'
      let saveStatus: string
      if (typeof statusToSave === 'string') {
        saveStatus = statusToSave
      } else if (statusToSave && typeof statusToSave === 'object') {
        if ((statusToSave as React.SyntheticEvent).target && typeof ((statusToSave as React.ChangeEvent<HTMLInputElement>).target as HTMLInputElement).value === 'string') {
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

        const transformedData: Record<string, unknown> = {
          //shipment_number: airwaybillvalue.replace(/\s+/g, '') || '',
          shipment_number: airwaybillvalue || '',
          shipment_date: dayjs(startDate).format('YYYY-MM-DD') || '',
          transport_type: transportType || '',
          file_number: fileNumberValue || '',
          shipment_state: saveStatus || '',
          notes: 'test',
          document_type_id: mastersData?.document_type_id || 5,
          attachment: isFileObject ? uploadedFile : undefined,
          ...(isFileObject
            ? {}
            : {
                'attachment[file_path]': (uploadedFile as Record<string, unknown>)?.file_path,
                'attachment[file_original_name]': (uploadedFile as Record<string, unknown>)?.file_original_name,
                'attachment[document_type_id]': (uploadedFile as Record<string, unknown>)?.document_type_id,
                'attachment[trade_document_id]': (uploadedFile as Record<string, unknown>)?.trade_document_id
              })
        }

        try {
          setLoader(true)

          const response = id
            ? await updateShipmentBasicDetails(id as string | number, transformedData)
            : await addShipmentBasicDetails(transformedData)
          if (response?.success) {
            setshipmentIdVal(response?.data?.id ?? null)
            Toaster({ type: 'success', message: response?.message })
            setLoader(false)
            setShowEdit(false)
            if (!isCalledViaRef) {
              setExpanded(['animals-details'])
            }

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
            onSave={handleSave as any}
            onCancel={() => setShowEdit(false)}
            airwaybillvalue={airwaybillvalue}
            setAirwaybillvalue={setAirwaybillvalue}
            startDate={startDate}
            setStartDate={setStartDate}
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
            setTransportType={setTransportType}
            transportType={transportType}
            fileNumberValue={fileNumberValue}
            setFileNumberValue={setFileNumberValue}
            errors={errors}
            setErrors={setErrors}
            loader={loader}
          />
        ) : id && action === 'details' ? (
          <BasicDetails
            airwaybillvalue={airwaybillvalue}
            fileNumberValue={fileNumberValue}
            setShowEdit={setShowEdit}
            showEdit={showEdit}
            startDate={startDate}
            uploadedFile={uploadedFile as any}
            loader={loader}
          />
        ) : (
          <BasicDetailsAddEdit
            onSave={handleSave as any}
            onCancel={() => setShowEdit(false)}
            airwaybillvalue={airwaybillvalue}
            setAirwaybillvalue={setAirwaybillvalue}
            startDate={startDate}
            setStartDate={setStartDate}
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
            setTransportType={setTransportType}
            transportType={transportType}
            fileNumberValue={fileNumberValue}
            setFileNumberValue={setFileNumberValue}
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
