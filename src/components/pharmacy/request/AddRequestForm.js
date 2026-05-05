/* eslint-disable lines-around-comment */
// ** MUI Imports
import {
  Grid,
  Divider,
  Typography,
  Box,
  Button,
  IconButton,
  DialogContent,
  DialogContentText,
  Stack
} from '@mui/material'

import Router from 'next/router'
import { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

// ** React Imports
import { useState, useEffect, useCallback, useRef } from 'react'

import CommonDialogBox from 'src/components/CommonDialogBox'
import { debounce } from 'lodash'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { getMedicineList, getGenericMedicineList } from 'src/lib/api/pharmacy/getMedicineList'

import {
  addRequestItems,
  getRequestItemsListById,
  updateRequestItems,
  // deleteLineItem,
  cancelRequestItems,
  getRequestPendingProductsList
} from 'src/lib/api/pharmacy/getRequestItemsList'
import Utility from 'src/utility'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'
// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { RequestCancelButton } from 'src/components/Buttons'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import RequestItemsForm from 'src/views/pages/pharmacy/request/RequestItemsForm'
import FileDialog from 'src/components/utility/FileDialog'

const editParamsInitialState = {
  from_store_type: '',
  // to_store_type: '',

  from_store_id: '',
  // to_store_id: '',
  from_store_type: '',
  // to_store_type: '',
  ro_date: Utility.formattedPresentDate(),
  total_qty: '',
  request_item_details: []
}

const initialNestedRowMedicine = {
  request_item_medicine_id: '',
  medicine_name: '',
  request_item_qty: '',
  request_item_leaf_id: '',
  priority_item: 'normal',
  control_substance: false,
  control_substance_file: '',
  prescription_required: false,
  prescription_required_file: '',
  package: '',
  manufacture: '',
  unit_price: '',
  genericName: '',
  notes: ''
}

const storeFormSchema = yup.object().shape({
  from_store_id: yup.string().required('This field is required')
})

const AddRequestForm = () => {
  // ** Hook
  const [toStocks, setToStocks] = useState([])
  const [fromStocks, setFromStocks] = useState([])
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [optionsMedicineList, setOptionsMedicineList] = useState([])
  const [optionsGenericMedicineList, setOptionsGenericMedicineList] = useState([])
  const [show, setShow] = useState(false)
  const [medicineItemId, setMedicineItemId] = useState('')
  const [submitLoader, setSubmitLoader] = useState(false)
  const [medicineSearchLoading, setMedicineSearchLoading] = useState(false)

  const {
    control: storeControl,
    setValue: setStoreValue,
    handleSubmit: handleStoreFormSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: { from_store_id: '' },
    resolver: yupResolver(storeFormSchema)
  })
  // const [deleteItemId, setDeleteItemId] = useState('')

  const [nestedRowMedicine, setNestedRowMedicine] = useState(initialNestedRowMedicine)
  // const [deleteDialog, setDeleteDialog] = useState(false)
  const [cancelRequestDialog, setCancelRequestDialog] = useState(false)
  const [tabStatus, setTabStatus] = useState('By product')

  const [showWarning, setShowWarning] = useState({})
  const [filePreview, setFilePreview] = useState({ open: false, url: '', name: '', type: '' })
  const router = useRouter()

  const { selectedPharmacy } = usePharmacyContext()
  const { id, action } = router.query

  const storesType = {
    local: 1,
    central: 2
  }

  const filteredStoreType = value => {
    const storeType = fromStocks?.find(item => item.id == value)?.type

    return storeType
  }

  const openCancelDialog = () => {
    setCancelRequestDialog(true)
  }

  const closeCancelDialog = () => {
    setCancelRequestDialog(false)
  }

  const closeDialog = () => {
    setShow(false)
    setNestedRowMedicine(initialNestedRowMedicine)
    setMedicineItemId('')
    setShowWarning({})
  }

  const showDialog = () => {
    setShow(true)
  }

  // local nested items delete
  const removeItemsFromTable = itemId => {
    const updatedItems = editParams?.request_item_details?.filter(el => {
      return el?.request_item_medicine_id != itemId
    })
    setEditParams({ ...editParams, request_item_details: updatedItems })
    setMedicineItemId('')
  }

  const totalQty = editParams?.request_item_details?.reduce((acc, row) => acc + parseInt(row?.request_item_qty || 0), 0)

  const totalValue = editParams?.request_item_details?.reduce(
    (acc, row) => acc + parseInt(row?.unit_price * row?.request_item_qty),
    0
  )

  const handleAddItem = payload => {
    const newData = {
      ...payload,
      request_item_leaf_id: ''
    }

    setEditParams({
      ...editParams,
      request_item_details: [...(editParams?.request_item_details || []), newData]
    })
    closeDialog()
  }

  const handleUpdateItem = payload => {
    const updatedIndex = editParams?.request_item_details?.findIndex(
      row => row.request_item_medicine_id === medicineItemId
    )

    if (updatedIndex !== -1) {
      const updatedNestedRows = [...editParams?.request_item_details]
      updatedNestedRows[updatedIndex] = {
        ...updatedNestedRows[updatedIndex],
        ...payload
      }
      setEditParams({
        ...editParams,
        request_item_details: updatedNestedRows
      })
      setMedicineItemId('')
    }
    closeDialog()
  }

  const handleSubmit = () => {
    handleStoreFormSubmit(() => {
      showDialog()
    })()
  }

  const filterToStocks = id => {
    const optionsForSelectB = fromStocks?.filter(option => option.id !== id)
    setToStocks(optionsForSelectB)
  }

  const getStoresLists = async () => {
    // setLoader(true)
    try {
      //params: { q: 'central', column: 'type' }
      const response = await getStoreList({ params: { type: 'central' } })
      if (response.success && response?.data?.list_items?.length > 0) {
        setFromStocks(response?.data?.list_items)
        setToStocks(response?.data?.list_items)

        if (id === undefined) {
          const firstStore = response?.data?.list_items[0]
          setEditParams({
            ...editParams,
            from_store_id: firstStore?.id,
            from_store_type: firstStore?.type
          })
          setStoreValue('from_store_id', firstStore?.id)
        }
      }
    } catch (error) {
      console.log('err', error)
    }
  }

  const fetchMedicineData = async searchText => {
    setMedicineSearchLoading(true)
    try {
      const params = {
        sort: 'asc',
        q: searchText,
        limit: 20,
        active: true
      }

      const searchResults = await getMedicineList({ params: params })
      if (searchResults?.data?.list_items?.length > 0) {
        let optionMedListFromApi = searchResults?.data?.list_items?.map(item => ({
          value: item?.id,
          name: item?.name,
          package: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
          label: `${item?.name} (${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}) `,
          manufacture: item?.manufacturer_name,
          control_substance: item?.controlled_substance === '1' ? true : false,
          status: item?.active === '0' ? 0 : 1,
          prescription_required:
            item?.controlled_substance === '1' ? true : item?.prescription_required === '1' ? true : false,
          unit_price: item?.unit_price ? item?.unit_price : 0,
          genericName: item?.generic_name
        }))
        setOptionsMedicineList(optionMedListFromApi)
      } else {
        setOptionsMedicineList([])
      }
    } catch (e) {
      console.log('error', e)
    } finally {
      setMedicineSearchLoading(false)
    }
  }

  const fetchGenericMedicineData = async searchText => {
    setMedicineSearchLoading(true)
    try {
      const params = {
        sort: 'asc',
        q: '',
        limit: 20,
        active: true,
        generic: searchText,
        is_specific: 1
      }

      const searchResults = await getGenericMedicineList({ params: params })
      if (searchResults?.data?.list_items?.length > 0) {
        const medicalProducts = searchResults?.data?.list_items?.filter(el => el?.stock_type != 'Non Medical')
        setOptionsGenericMedicineList(
          medicalProducts?.map(item => ({
            value: item?.id,
            genericName: item?.generic_name,
            name: item?.name,
            package: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
            label: `${item?.name} (${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}) `,
            manufacture: item?.manufacturer_name,
            control_substance: item?.controlled_substance === '1' ? true : false,
            status: item?.active === '0' ? 0 : 1,
            prescription_required:
              item?.controlled_substance === '1' ? true : item?.prescription_required === '1' ? true : false,
            unit_price: item?.unit_price ? item?.unit_price : 0
          }))
        )
      } else {
        setOptionsGenericMedicineList([])
      }
    } catch (e) {
      console.log('error', e)
    } finally {
      setMedicineSearchLoading(false)
    }
  }

  // Use refs to avoid stale closures in debounced callbacks
  const fetchMedicineDataRef = useRef(fetchMedicineData)
  fetchMedicineDataRef.current = fetchMedicineData

  const fetchGenericMedicineDataRef = useRef(fetchGenericMedicineData)
  fetchGenericMedicineDataRef.current = fetchGenericMedicineData

  const searchMedicineData = useCallback(
    debounce(async searchText => {
      await fetchMedicineDataRef.current(searchText)
    }, 500),
    []
  )

  const searchGenericMedicineData = useCallback(
    debounce(async searchText => {
      await fetchGenericMedicineDataRef.current(searchText)
    }, 500),
    []
  )

  const getUpdatedMedicineData = async searchText => {
    try {
      const params = {
        sort: 'asc',
        q: '',
        limit: 20,
        active: true,
        product_search: searchText
      }

      const searchResults = await getMedicineList({ params: params })
      if (searchResults?.data?.list_items?.length === 1) {
        let updatedData = searchResults?.data?.list_items?.map(item => ({
          value: item.id,
          name: item.name,
          package: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
          label: `${item.name} (${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}) `,
          manufacture: item.manufacturer_name,
          control_substance: item.controlled_substance === '1' ? true : false,
          status: item?.active === '0' ? 0 : 1,
          prescription_required:
            item?.controlled_substance === '1' ? true : item?.prescription_required === '1' ? true : false,
          unit_price: item?.unit_price ? item?.unit_price : 0,
          genericName: item?.generic_name
        }))

        return updatedData
      }
    } catch (e) {
      console.log('error', e)
    }
  }
  useEffect(() => {
    getStoresLists()
    fetchMedicineData('')
    fetchGenericMedicineData('')
  }, [])

  const getListOfItemsById = async id => {
    const result = await getRequestItemsListById(id)

    if (result?.success === true && result?.data?.request_item_details?.length > 0) {
      const lineItems = result?.data?.request_item_details.map(el => {
        return {
          request_item_medicine_id: el?.stock_item_id,
          medicine_name: el?.stock_name,
          request_item_qty: el?.qty,
          request_item_leaf_id: el?.stock_item_id,
          priority_item: el?.priority,
          control_substance: el?.control_substance === '1' ? true : false,
          control_substance_file: el?.control_substance_file !== '' ? el?.control_substance_file : '',
          prescription_required: el?.prescription_required === '1' ? true : false,
          prescription_required_file: el?.prescription_required_file !== '' ? el?.prescription_required_file : '',
          prescription_required_filename: el?.prescription_required_filename ? el?.prescription_required_filename : '',
          id: el?.id,
          request_item_detail_id: el?.id,
          dispatch_item_id: el?.dispatch_item_id,
          package: `${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`,
          manufacture: el?.manufacturer,
          unit_price: el?.unit_price,
          genericName: el?.generic_name,
          notes: el?.description
        }
      })

      setEditParams({
        ...editParams,
        id: result.data.id,
        from_store_id: result.data.from_store_id,
        //to_store_id: result.data.to_store_id,
        ro_date: result.data.request_date,
        from_store_type: result.data.from_store_type,
        // to_store_type: result.data.to_store_type,
        request_item_details: lineItems
      })
      setStoreValue('from_store_id', result.data.from_store_id)
      // }
    }
  }

  // ****** edit section //////
  const editTableData = async (itemId, operation) => {
    if (id != undefined && action === 'edit') {
      const getItems = editParams?.request_item_details?.filter(el => {
        return el?.request_item_medicine_id === itemId
      })
      var result
      if (operation === 'update') {
        result = await getUpdatedMedicineData(getItems[0]?.medicine_name)
      }
      setNestedRowMedicine({
        ...nestedRowMedicine,
        request_item_medicine_id: getItems[0]?.request_item_medicine_id,
        medicine_name: getItems[0]?.medicine_name,
        request_item_qty: getItems[0]?.request_item_qty,
        request_item_leaf_id: getItems[0]?.request_item_leaf_id,
        priority_item: getItems[0]?.priority_item,
        control_substance: getItems[0]?.control_substance,
        control_substance_file: getItems[0]?.control_substance_file,
        prescription_required: getItems[0]?.prescription_required,
        prescription_required_file: getItems[0]?.prescription_required_file,
        prescription_required_filename: getItems[0]?.prescription_required_filename,
        id: getItems[0]?.id,
        package: getItems[0]?.package,
        manufacture: getItems[0]?.manufacture,
        // unit_price: operation === 'update' ? result[0]?.unit_price : getItems[0]?.unit_price, change this after api getting undefined unit price
        unit_price: operation === 'update' && result?.[0]?.unit_price ? result[0].unit_price : getItems[0]?.unit_price,
        genericName: getItems[0]?.genericName,
        notes: getItems[0]?.notes
      })
      showDialog()
    } else {
      const getItems = editParams?.request_item_details?.filter(el => {
        return el?.request_item_medicine_id === itemId
      })

      setNestedRowMedicine({
        ...nestedRowMedicine,
        medicine_name: getItems[0]?.medicine_name,
        request_item_medicine_id: getItems[0]?.request_item_medicine_id,
        // id: getItems[0]?.id,
        request_item_qty: getItems[0]?.request_item_qty,
        priority_item: getItems[0]?.priority_item,
        control_substance_file: getItems[0]?.control_substance_file ? getItems[0]?.control_substance_file : '',
        control_substance: getItems[0]?.control_substance,
        prescription_required_file: getItems[0]?.prescription_required_file
          ? getItems[0]?.prescription_required_file
          : '',
        prescription_required_filename: getItems[0]?.prescription_required_filename || '',
        prescription_required: getItems[0]?.prescription_required,
        package: getItems[0]?.package,
        manufacture: getItems[0]?.manufacture,
        unit_price: getItems[0]?.unit_price,
        genericName: getItems[0]?.genericName,
        notes: getItems[0]?.notes
      })
      showDialog()
    }
  }

  useEffect(() => {
    if (id !== undefined && action === 'edit') {
      getListOfItemsById(id)
    }
  }, [id, action])

  const postItemsData = async () => {
    const updateData = { ...editParams }
    setSubmitLoader(true)

    // Update the request_item_details array
    const updatedRequestItemDetails = updateData?.request_item_details?.map(item => {
      // Ensure `priority_item` is explicitly set to `null` if missing
      return {
        ...item,
        priority_item: item?.priority_item ? item?.priority_item : '' // Set to null if undefined or missing
      }
    })

    // Construct the final payload
    const postData = {
      ...editParams,
      request_item_details: updatedRequestItemDetails,
      total_qty: totalQty
    }

    if (id) {
      try {
        const response = await updateRequestItems(id, postData)

        if (response?.success) {
          toast.success(response?.message)
          setSubmitLoader(false)
          getListOfItemsById(id)
          Router.push(`/pharmacy/request/${response?.data}`)
        } else {
          setSubmitLoader(false)
          toast.error(JSON.stringify(response?.message), { position: 'top-left' })
        }
      } catch (error) {
        toast.error(JSON.stringify(error), { position: 'top-left' })
      }
    } else {
      try {
        const response = await addRequestItems(postData)

        if (response?.success) {
          toast.success(response?.message)
          setEditParams(editParamsInitialState)
          setSubmitLoader(false)
          Router.push(`/pharmacy/request/${response?.data}`)
        } else {
          setSubmitLoader(false)
          toast.error(JSON.stringify(response), { position: 'top-left' })
        }
      } catch (error) {
        toast.error(JSON.stringify(error), { position: 'top-left' })
      }
    }
  }

  // const deleteLineItemFromDb = async lineItemId => {
  //
  //   console.log('lineItemId', lineItemId)
  //   if (lineItemId) {
  //     try {
  //       const result = await deleteLineItem(lineItemId)
  //       console.log('deleteLineItem result', result)
  //       if (result?.data?.success === true) {
  //         toast.success(result?.data?.data)
  //         setDeleteDialog(false)
  //         setDeleteItemId(null)
  //         getListOfItemsById(id)
  //       } else {
  //         toast.error(result.data)
  //       }
  //     } catch (error) {
  //       toast.error(error.data)
  //       console.log('error', error)
  //     }
  //   }
  // }

  const cancelRequest = async id => {
    if (id) {
      try {
        const result = await cancelRequestItems(id)
        if (result?.data?.success === true) {
          closeCancelDialog()
          toast.success(result?.data?.data)
          Router.push(`/pharmacy/request/`)
        } else {
          closeCancelDialog()
          toast.error(result?.data?.data)
        }
      } catch (error) {
        toast.error(error?.data)
        console.log('error', error)
      }
    }
  }

  const requestPendingProducts = async id => {
    try {
      const result = await getRequestPendingProductsList(id)

      if (result?.success === true) {
        setShowWarning(result.data)
      }
    } catch (error) {
      // toast.error(error.data)
      console.error('error', error)
    }
  }

  // useEffect(() => {
  //   if (nestedRowMedicine.request_item_medicine_id) {
  //     setShowWarning({})
  //     requestPendingProducts(nestedRowMedicine.request_item_medicine_id)
  //   }
  // }, [nestedRowMedicine])

  const handleFilePreview = (file, fileName) => {
    const ext = fileName?.split('.')?.pop()?.toLowerCase()
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
    const fileType = isImage ? 'image' : ext === 'pdf' ? 'pdf' : 'other'

    if (file instanceof File) {
      const fileURL = URL.createObjectURL(file)
      setFilePreview({ open: true, url: fileURL, name: fileName, type: fileType, isBlob: true })
    } else if (typeof file === 'string' && file !== '') {
      setFilePreview({ open: true, url: file, name: fileName, type: fileType, isBlob: false })
    }
  }

  const requestItemColumns = [
    {
      field: 'sno',
      headerName: 'S.No',
      width: 70,
      sortable: false,
      renderCell: params => `${params.api.getAllRowIds().indexOf(params.id) + 1}.`
    },
    {
      field: 'priority_item',
      headerName: 'Priority',
      width: 90,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => RenderUtility.getPriorityIcons(params.row?.priority_item)
    },
    {
      field: 'medicine_name',
      headerName: 'Product Names',
      flex: 1,
      minWidth: 250,
      sortable: false,
      renderCell: params => {
        const el = params.row

        return (
          <Box sx={{ py: 1, overflow: 'hidden', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {RenderUtility?.renderControlLabel(el.control_substance === true, 'CS')}
              {RenderUtility?.renderPrescriptionLabel(el.prescription_required === true, 'PR')}
              <Typography
                variant='body2'
                sx={{ color: 'customColors.OnPrimaryContainer', fontSize: '16px', fontWeight: 600 }}
              >
                {el.medicine_name}
              </Typography>
            </Box>
            <Typography
              variant='body2'
              sx={{ color: 'customColors.OnSurfaceVariant', mb: 0.5, fontSize: '14px', fontWeight: 400 }}
            >
              {el.package}
            </Typography>
            <Typography
              variant='body2'
              sx={{ color: 'customColors.OnSurfaceVariant', mb: 0.5, fontSize: '14px', fontWeight: 400 }}
            >
              {el.manufacture}
            </Typography>
            {el?.notes ? (
              <TextEllipsisWithModal
                text={el?.notes}
                limit={60}
                icon='material-symbols:description-outline'
                style={{
                  color: 'customColors.neutral_50',
                  fontStyle: 'italic',
                  fontSize: '14px',
                  fontWeight: 400
                }}
              />
            ) : null}
            {el?.prescription_required_file || el?.prescription_required_filename ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  maxWidth: '100%',
                  '&:hover': { opacity: 0.8 }
                }}
                onClick={e => {
                  e.stopPropagation()

                  const file = el.prescription_required_file

                  const fileName =
                    file instanceof File ? file.name : el.prescription_required_filename || 'Prescription'
                  handleFilePreview(file, fileName)
                }}
              >
                <Box sx={{ color: 'customColors.neutral_50', display: 'flex', alignItems: 'center' }}>
                  <Icon icon='material-symbols:attachment' width='1em' height='1em' />
                </Box>
                <Typography
                  variant='body2'
                  sx={{
                    color: 'customColors.neutral_50',
                    fontSize: '14px',
                    fontWeight: 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}
                >
                  {el.prescription_required_file instanceof File
                    ? el.prescription_required_file.name
                    : el.prescription_required_filename || 'Prescription'}
                </Typography>
              </Box>
            ) : null}
          </Box>
        )
      }
    },
    {
      field: 'request_item_qty',
      headerName: 'Request Qty',
      width: 140,
      sortable: false
    },
    {
      field: 'unit_price',
      headerName: 'Unit Price',
      width: 110,
      sortable: false,
      renderCell: params =>
        params.row.unit_price > 0 ? Utility?.formatAmountToReadableDigit(params.row.unit_price) : 'NA'
    },
    {
      field: 'value',
      headerName: 'Value',
      width: 110,
      sortable: false,
      renderCell: params => {
        const val = params.row?.unit_price * params.row?.request_item_qty

        return val > 0 ? Utility?.formatAmountToReadableDigit(val) : 'NA'
      }
    },
    {
      field: 'actions',
      headerName: 'Action',
      width: 120,
      sortable: false,
      renderCell: params => {
        const el = params.row

        // const isSavedInDb = Boolean(el?.request_item_detail_id)

        return (
          <Box>
            <>
              <IconButton
                size='small'
                sx={{ mr: 0.5 }}
                aria-label='Edit'
                onClick={() => {
                  setMedicineItemId(el?.request_item_medicine_id)
                  if (el.id) {
                    editTableData(el?.request_item_medicine_id, 'update')
                  } else {
                    editTableData(el?.request_item_medicine_id, 'new')
                  }
                }}
              >
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
              {/* {!isSavedInDb && ( */}
              <IconButton
                onClick={() => {
                  removeItemsFromTable(el.request_item_medicine_id)
                }}
                size='small'
                sx={{ mr: 0.5 }}
              >
                <Icon icon='mdi:delete-outline' />
              </IconButton>
              {/* )} */}
            </>
          </Box>
        )
      }
    }
  ]

  const requestItemRows =
    editParams?.request_item_details?.map((item, index) => ({
      ...item,
      id: item.request_item_medicine_id || index
    })) || []

  // Render the add/edit item form inside the dialog
  const renderItemForm = () => {
    return (
      <RequestItemsForm
        tabStatus={tabStatus}
        setTabStatus={setTabStatus}
        optionsMedicineList={optionsMedicineList}
        optionsGenericMedicineList={optionsGenericMedicineList}
        searchMedicineData={searchMedicineData}
        searchGenericMedicineData={searchGenericMedicineData}
        fetchMedicineData={fetchMedicineData}
        medicineSearchLoading={medicineSearchLoading}
        requestPendingProducts={requestPendingProducts}
        showWarning={showWarning}
        setShowWarning={setShowWarning}
        existingMedicineIds={editParams.request_item_details.map(item => item.request_item_medicine_id)}
        isEditMode={Boolean(medicineItemId)}
        initialData={medicineItemId ? nestedRowMedicine : null}
        onClose={closeDialog}
        onSubmit={handleAddItem}
        onUpdate={handleUpdateItem}
      />
    )
  }

  return (
    <PageCardLayout
      title={id ? 'Edit Request' : 'Add Request'}
      showIcon={true}
      onIconClick={() => {
        Router.push('/pharmacy/request/')
      }}
      titleStyles={{
        fontSize: '20px'
      }}
    >
      <Grid container>
        <CommonDialogBox
          title={medicineItemId ? 'Edit Request Item' : 'Add Request Item'}
          dialogBoxStatus={show}
          formComponent={renderItemForm()}
          close={closeDialog}
          show={showDialog}
          noWidth={true}
        />
      </Grid>
      <form>
        <Grid container spacing={5}>
          <Grid item size={{ xs: 12 }}>
            <Typography variant='subtitle2' sx={{ color: 'text.primary', letterSpacing: '.1px', fontSize: '16px' }}>
              Requested to :
            </Typography>
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }} sx={{ mb: 5 }}>
            <ControlledSelect
              name='from_store_id'
              control={storeControl}
              label='Store*'
              errors={errors}
              options={toStocks || []}
              getOptionLabel={option => option?.name}
              getOptionValue={option => option?.id}
              isOptionDisabled={option => option?.status === 'inactive'}
              disabled={id ? true : false}
              onChangeExtra={e => {
                setEditParams({
                  ...editParams,
                  from_store_id: e.target.value,
                  from_store_type: storesType[filteredStoreType(e.target.value)]
                })
              }}
            />
          </Grid>

          {/* </Grid> */}
          {/* <Grid item size={{ xs: 12, sm: 6 }}>
              <Grid item size={{ xs: 12, sm: 12 }} sx={{ mb: 5 }}>
                <Typography variant='subtitle2' sx={{ mb: 3, color: 'text.primary', letterSpacing: '.1px' }}>
                  &nbsp;
                </Typography>
              </Grid> */}

          {/* <Grid xs={12} sm={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <InputLabel error={Boolean(errors.to_store_id)}>Store*</InputLabel>
                  <Select
                    value={editParams.to_store_id}
                    error={Boolean(errors.to_store_id)}
                    label='Store*'
                    disabled={id ? true : false}
                    onChange={e => {
                      filterToStocks(e.target.value)
                      setEditParams({
                        ...editParams,
                        to_store_id: e.target.value,
                        to_store_type: storesType[filteredStoreType(e.target.value)]
                      })
                      setErrors({})
                    }}
                    // error={Boolean(errors?.state_id)}
                    // labelId='state_id'
                  >
                    {fromStocks?.map((item, index) => (
                      <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                        {item?.name}
                      </MenuItem>
                    ))}
                  </Select>

                  {errors.to_store_id && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid> */}
          {/* <Grid item xs={12} sm={12} lg={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <SingleDatePicker
                    disabled={true}
                    fullWidth
                    date={editParams.ro_date ? parseFormattedDate(editParams.ro_date) : null}
                    width={'100%'}
                    value={editParams.ro_date ? parseFormattedDate(editParams.ro_date) : null}
                    name={'Date*'}
                    onChangeHandler={date => {
                      // setStores({ ...stores, date: date })
                      setEditParams({ ...editParams, ro_date: formatDate(date) })
                      setErrors({})
                    }}
                    customInput={<CustomInput label='Date*' error={Boolean(errors.ro_date)} />}
                    isClearable={false}
                  />
                  {errors.ro_date && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid> */}
          {/* </Grid> */}
        </Grid>
      </form>
      {/* </CardContent> */}
      {/* <Grid
          container
          item
          sm={12}
          xs={12}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            mt: 2
          }}
        >
          <Box>
            Request Items
            <Box sx={{ display: 'flex', mr: 4 }}>
              <Box>Total Request Quantity: 567</Box>
              <Box>Total Value: ₹1,35,000</Box>
            </Box>
          </Box>

          <AddButton
            title='Add Request Item'
            action={() => {
              handleSubmit()
            }}
          />
        </Grid> */}
      {/* Left side content */}
      <Grid container spacing={3} sx={{ py: 5 }}>
        <Grid item size={{ xs: 'auto', sm: 'auto', lg: 8 }}>
          <Typography
            variant='body1'
            sx={{
              fontSize: '1rem',
              fontWeight: 500,
              color: 'customColors.customTextColorGray2',
              fontSize: '16px'
              // mb: 0.5
            }}
          >
            Request Items
          </Typography>
          <Stack direction='row' spacing={{ xs: 3, sm: 6 }} divider={<Divider orientation='vertical' flexItem />}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: 'customColors.neutralSecondary'
              }}
            >
              Total Request Quantity:{' '}
              <Typography
                component='span'
                sx={{ color: 'customColors.OnPrimaryContainer', fontSize: '14px', fontWeight: 400 }}
              >
                {totalQty}
              </Typography>
            </Typography>

            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: 'customColors.neutralSecondary'
              }}
            >
              Total Value:{' '}
              <Typography
                component='span'
                sx={{ color: 'customColors.OnPrimaryContainer', fontSize: '14px', fontWeight: 400 }}
              >
                {Utility?.formatAmountToReadableDigit(totalValue)}
              </Typography>
            </Typography>
          </Stack>

          {/* Right side button */}
        </Grid>
        <Box sx={{ display: 'flex', marginLeft: 'auto' }}>
          <AddButtonContained
            title='Add Request Item'
            action={() => {
              handleSubmit()
            }}
            styles={{
              mr: 0
            }}
          />
        </Box>
      </Grid>

      <CommonTable
        indexedRows={requestItemRows}
        columns={requestItemColumns}
        disablePagination
        hideFooter
        total={requestItemRows.length}
        getRowHeight={() => 'auto'}
        externalTableStyle={{
          my: 5,
          '& .MuiDataGrid-cell': { py: 1 }
        }}
      />

      <Grid item size={{ xs: 12 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            my: 4
          }}
        >
          {id && editParams?.request_item_details?.length > 0 ? (
            <>
              <RequestCancelButton
                title='Cancel Request'
                action={() => {
                  openCancelDialog()
                  // setEditParams(editParamsInitialState)
                }}
              />
            </>
          ) : null}
          {id ? null : (
            <Button
              disabled={editParams.request_item_details.length > 0 ? false : true}
              onClick={() => {
                setEditParams({
                  ...editParams,
                  total_qty: '',
                  request_item_details: []
                })
                // setEditParams(editParamsInitialState)
              }}
              size='large'
              variant='outlined'
              sx={{ marginRight: '8px' }}
            >
              Reset
            </Button>
          )}
          <LoadingButton
            disabled={editParams.request_item_details.length > 0 ? false : true}
            // sx={{ marginRight: '8px' }}
            size='large'
            onClick={() => {
              postItemsData()
            }}
            variant='contained'
            loading={submitLoader}
          >
            Save
          </LoadingButton>
        </Box>
      </Grid>
      {/* <ConfirmDialogBox
        open={deleteDialog}
        closeDialog={() => {
          setDeleteDialog(false)
          setDeleteItemId(null)
        }}
        action={() => {
          setDeleteDialog(false)
          setDeleteItemId(null)
        }}
        content={
          <Box>
            <>
              <DialogContent>
                <DialogContentText sx={{ mb: 1 }}>Are you sure you want to delete this item?</DialogContentText>
              </DialogContent>
              <DialogActions className='dialog-actions-dense'>
                <Button
                  variant='contained'
                  size='small'
                  color='primary'
                  onClick={() => {
                    setDeleteDialog(false)
                    setDeleteItemId(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size='small'
                  variant='contained'
                  color='error'
                  onClick={() => {
                    deleteLineItemFromDb(deleteItemId)
                  }}
                >
                  Confirm
                </Button>
              </DialogActions>
            </>
          </Box>
        }
      /> */}

      <ConfirmDialogBox
        open={cancelRequestDialog}
        closeDialog={() => {
          closeCancelDialog()
        }}
        action={() => {
          closeCancelDialog()
        }}
        title={'Cancel the request'}
        content={
          <Box>
            <>
              <DialogContent>
                <DialogContentText sx={{ mb: 1 }}>
                  Are you sure you want to Cancel this request? If you cancel this request it will be disabled you
                  cannot perform any operations for this request
                </DialogContentText>
              </DialogContent>
            </>
          </Box>
        }
        dialogActions={
          <>
            <Button
              variant='contained'
              size='small'
              color='primary'
              onClick={() => {
                closeCancelDialog()
              }}
            >
              Cancel
            </Button>
            <Button
              size='small'
              variant='contained'
              color='error'
              onClick={() => {
                cancelRequest(id)
              }}
            >
              Confirm
            </Button>
          </>
        }
      />

      <FileDialog
        open={filePreview.open}
        onClose={() => {
          if (filePreview.isBlob) {
            URL.revokeObjectURL(filePreview.url)
          }
          setFilePreview({ open: false, url: '', name: '', type: '' })
        }}
        src={filePreview.url}
        title={filePreview.name}
        type={filePreview.type}
      />
    </PageCardLayout>
  )
}

export default AddRequestForm
