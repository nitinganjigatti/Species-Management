/* eslint-disable lines-around-comment */
// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import Divider from '@mui/material/Divider'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import { styled, useTheme } from '@mui/material/styles'
import TableContainer from '@mui/material/TableContainer'
import TableCell from '@mui/material/TableCell'
import { Button, CardHeader, InputAdornment, alpha } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import FormHelperText from '@mui/material/FormHelperText'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import Router from 'next/router'
import { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import { debounce, flatMap } from 'lodash'

import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

// ** React Imports
import { forwardRef, useState, useEffect, useCallback, useRef, useMemo } from 'react'
// ** Icon Imports
import Icon from 'src/@core/components/icon'

// import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { getSuppliers } from 'src/lib/api/pharmacy/getSupplierList'
import { getMedicineList } from 'src/lib/api/pharmacy/getMedicineList'
import {
  addPurchase,
  getPurchaseListById,
  updatePurchase,
  updatePurchasePrice,
  getBatchExpiry,
  validatePurchaseProducts,
  postDeleteInvoiceById,
  productMappingForMlTraining
} from 'src/lib/api/pharmacy/getPurchaseList'
import CommonDialogBox from 'src/components/CommonDialogBox'
import SingleDatePicker from '../../SingleDatePicker'
import Utility from 'src/utility'
import { AddButton } from 'src/components/Buttons'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import PurchaseItemForm from 'src/views/pages/pharmacy/purchase/purchaseItemForm'
import AddSupplier from 'src/pages/pharmacy/masters/supplier/add-supplier'
import moment from 'moment'
import { AuthContext } from 'src/context/AuthContext'
import { useContext } from 'react'
import PurchaseDocsDrawer from 'src/views/pages/pharmacy/purchase/purchaseDocsDrawer'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import UploadIcon from 'public/images/upload_invoice_icon.png'
import TotalAmountIcon from 'public/images/amount_summary.png'
import { borderRadius, getValue } from '@mui/system'
import { getVariantFOrProduct, getVariants } from 'src/lib/api/pharmacy/variant'
import PurchaseInvoiceUpload from './PurchaseInvoiceUpload'
import { v4 as uuidv4 } from 'uuid'

const CalcWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '&:not(:last-of-type)': {
    marginBottom: theme.spacing(2)
  }
}))

const editParamsInitialState = {
  po_no: '',
  po_date: Utility.formattedPresentDate(),
  store_id: '',
  supplier_id: '',
  description: '',
  type_of_store: '',
  purchase_details: [],
  total_amount: 0,
  discount_type: '',
  discount_amount: 0,
  discount_percentage: 0,
  net_amount: 0,
  tax_amount: 0,
  purchase_order_no: '',
  requested_by: '',
  invoice_transcript: [],
  freight_charges: '',
  freight_gst: '',
  freight_total_charges: '',
  additional_charges: '',
  round_off: '',
  purchase_created_by: 'manually'
}

const initialNestedRowMedicine = {
  uid: '',
  medicine_name: '',
  purchase_unit_id: '',
  purchase_qty: 0,
  purchase_unit_price: 0,
  purchase_purchase_price: 0,
  purchase_batch_no: '',
  purchase_expiry_date: '',
  purchase_stock_item_id: '',
  purchase_gst_type: '',
  purchase_gst: 0,
  purchase_cgst: 0,
  purchase_sgst: 0,
  purchase_igst: 0,
  purchase_cgst_amount: 0,
  purchase_sgst_amount: 0,
  purchase_igst_amount: 0,
  package_details: '',
  manufacturer: '',
  purchase_variant_id: '',
  purchase_unit_qty: '',
  purchase_variant_ratio: '',
  isVariantIdPresent: false,
  purchase_created_by: 'form',
  medicine_name_by_ml: ''
}

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
})

const defaultValues = {
  po_date: Utility.formattedPresentDate()
}

const AddPurchaseForm = () => {
  // theme
  const theme = useTheme()
  // ** Hook
  const [stores, setStores] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [optionsMedicineList, setOptionsMedicineList] = useState([])
  const [show, setShow] = useState(false)
  const [error, setErrors] = useState({})
  const [itemErrors, setItemErrors] = useState({})

  const [medicineItemId, setMedicineItemId] = useState('')
  const [submitLoader, setSubmitLoader] = useState(false)
  const [duplicateMedError, setDuplicateMedError] = useState('')
  const [validateDiscount, setValidateDiscount] = useState('')
  const [expiryDateLoader, setExpiryDateLoader] = useState(false)
  const [productExpiryDate, setProductExpiryDate] = useState('')

  const [nestedRowMedicine, setNestedRowMedicine] = useState(initialNestedRowMedicine)

  const [supplierDialog, setSupplierDialog] = useState(false)

  const [productVariantOptions, setProductVariantOptions] = useState([])

  const [validatePurchaseDialog, setValidatePurchaseDialog] = useState(false)
  const [priceValidationError, setPriceValidationError] = useState(false)
  const [currentPayload, setCurrentPayload] = useState(null)

  const [showFreight, setShowFreight] = useState(false)

  const router = useRouter()
  const { id, action, navigatedFrom } = router.query

  const { selectedPharmacy } = usePharmacyContext()
  const authData = useContext(AuthContext)

  // upload invoice

  const fileInputRef = useRef(null)
  const [fileSrc, setFileSrc] = useState('')
  const [fileArr, setFileArr] = useState([])

  const [displayFile, setDisplayFile] = useState('')
  const [deleteId, setDeleteId] = useState('')
  const [deleteLoader, setDeleteLoader] = useState(false)
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false)
  //----------

  const [totalFreightCharges, setTotalFreightCharges] = useState(0)
  const [additionalCharges, setAdditionalCharges] = useState(0)

  // RoundUp value
  const [roundup_select, setRoundup_Select] = useState('+')
  const [roundUpValue, setRoundUpValue] = useState('')

  const [inputValue, setInputValue] = useState('')
  const [isError, setIsError] = useState(false)
  const [invoiceUploadDialog, setInvoiceUploadDialog] = useState(false)
  const [showAmount, setShowAmount] = useState(false)
  const [invoiceSubmitLoader, setInvoiceSubmitLoader] = useState(false)
  const [variantLists, setVariantLists] = useState([])

  const schema = yup.object().shape({
    // product: yup.string().required('Product name is required'),
    supplier_id: yup.string().required('Supplier is required'),
    po_no: yup.string().required('Purchase invoice number is required'),
    po_date: yup.string().required('Purchase date is required'),
    description: yup.string()
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues,
    trigger,
    clearErrors
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const closeDialog = () => {
    setShow(false)
    setNestedRowMedicine(initialNestedRowMedicine)
    setMedicineItemId('')
    setErrors({})
    setItemErrors({})
    setDuplicateMedError('')
    setOptionsMedicineList([])

    setValidatePurchaseDialog(false)
    setPriceValidationError(false)
    setCurrentPayload(null)
    setProductVariantOptions([])
  }

  const showDialog = () => {
    setShow(true)
  }

  // const getStoreType = id => {
  //   const foundOStores = stores.find(item => item.id === id)
  //   if (foundOStores) {
  //     const storeType = foundOStores?.type
  //     setEditParams({ ...editParams, store_id: id, type_of_store: storeType })
  //   }
  // }

  // local nested items delete
  const removeItemsFroTable = itemId => {
    // const updatedItems = editParams.purchase_details.filter(el => {
    //   return el.purchase_unit_id != itemId
    // })
    const updatedItems = editParams?.purchase_details.filter(el => {
      return el?.uid != itemId
    })
    setEditParams({ ...editParams, purchase_details: updatedItems })
    setMedicineItemId('')
  }

  const totalLineItemsAmount = editParams?.purchase_details?.reduce(
    (acc, row) => acc + parseFloat(row.purchase_gross_amount ? row.purchase_gross_amount : 0),
    0
  )

  const totalLineItemsTaxableAmount = editParams?.purchase_details?.reduce(
    (acc, row) => acc + parseFloat(row.purchase_taxable_amount ? row.purchase_taxable_amount : 0),
    0
  )

  const totalLineItemsPurchase = editParams.purchase_details?.reduce(
    (acc, row) => acc + parseFloat(row.purchase_net_amount ? row.purchase_net_amount : 0),
    0
  )

  const grandTotalAmount = useMemo(() => {
    let roundUp = 0
    if (roundup_select === '-') {
      roundUp = -parseFloat(roundUpValue) || 0 // Subtract the exact value when '-' is selected
    } else {
      roundUp = parseFloat(roundUpValue) || 0 // Add the exact value when '+' is selected
    }

    const totalFreight = parseFloat(totalFreightCharges) || 0
    const additional = parseFloat(additionalCharges) || 0
    const totalItems = parseFloat(totalLineItemsPurchase) || 0
    // console.log('additional', additional)
    // console.log('totalItems', totalItems)
    // console.log('totalFreight', totalFreight)
    const result = totalItems + totalFreight + additional + roundUp

    return result
  }, [totalLineItemsPurchase, totalFreightCharges, additionalCharges, roundUpValue, roundup_select])

  // console.log('grandTotalAmount', grandTotalAmount)

  // const totalLineItemsDiscount = editParams.purchase_details?.reduce(
  //   (acc, row) => acc + parseFloat(row.purchase_discount_amount ? row.purchase_discount_amount : 0),
  //   0
  // )

  const totalLineItemsDiscount = editParams.purchase_details?.reduce(
    (acc, row) => acc + parseFloat(row.purchase_discount_amount ? row.purchase_discount_amount : 0),
    0
  )

  const calculate_cgst_tax_amount = editParams.purchase_details?.reduce(
    (acc, row) => acc + parseFloat(row.purchase_cgst_amount ? row.purchase_cgst_amount : 0),
    0
  )

  const calculate_sgst_tax_amount = editParams.purchase_details?.reduce(
    (acc, row) => acc + parseFloat(row.purchase_sgst_amount ? row.purchase_sgst_amount : 0),
    0
  )

  const calculate_igst_tax_amount = editParams.purchase_details?.reduce(
    (acc, row) => acc + parseFloat(row.purchase_igst_amount ? row.purchase_igst_amount : 0),
    0
  )

  // const calculate_cgst_tax = editParams.purchase_details?.reduce(
  //   (acc, row) => acc + parseFloat(row.purchase_cgst ? row.purchase_cgst : 0),
  //   0
  // )

  // const calculate_sgst_tax = editParams.purchase_details?.reduce(
  //   (acc, row) => acc + parseFloat(row.purchase_sgst ? row.purchase_sgst : 0),
  //   0
  // )

  // const calculate_lineItem_discount_percentage = editParams.purchase_details?.reduce(
  //   (acc, row) => acc + parseFloat(row.purchase_discount ? row.purchase_discount : 0),
  //   0
  // )

  // function calculateTaxAmount(gst_name, totalAmount) {
  //   if (!gst_name || !totalAmount) {
  //     return 0
  //   }

  //   const gstPercentage = parseFloat(gst_name)

  //   const taxAmount = totalAmount * (gstPercentage / 100)

  //   // return taxAmount.toFixed(2)
  //   return taxAmount
  // }

  // const calculateFinalAmount = useCallback(
  //   discountValue => {
  //
  //     let finalAmount = totalLineItemsPurchase
  //     let netAmountWithGST = totalLineItemsPurchase + calculateTotalTaxAmount
  //     let netAmount = 0
  //     setEditParams({
  //       ...editParams,
  //       total_amount: totalLineItemsPurchase ? totalLineItemsPurchase : 0,
  //       net_amount: netAmountWithGST ? netAmountWithGST : 0,
  //       tax_amount: calculateTotalTaxAmount ? calculateTotalTaxAmount : 0
  //     })
  //     if (editParams.discount_type === 'P') {
  //       netAmount = (netAmountWithGST * discountValue) / 100
  //       const discountValueAmount = netAmount
  //       const netValueAfterDiscount = netAmountWithGST - netAmount
  //       setEditParams({
  //         ...editParams,
  //         discount_percentage: discountValue,
  //         discount_amount: discountValueAmount,
  //         net_amount: netValueAfterDiscount,
  //         tax_amount: calculateTotalTaxAmount
  //       })
  //     } else if (editParams.discount_type === 'F') {
  //       const netValueAfterDiscount = netAmountWithGST - discountValue
  //       setEditParams({
  //         ...editParams,
  //         discount_amount: discountValue,
  //         discount_percentage: 0,
  //         net_amount: netValueAfterDiscount,
  //         tax_amount: calculateTotalTaxAmount
  //       })
  //     }
  //   },
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [totalLineItemsPurchase, editParams]
  // )
  // useEffect(() => {
  // calculateFinalAmount(editParams.discount_type === 'P' ? editParams.discount_percentage : editParams.discount_amount)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [totalLineItemsPurchase])

  const addItemsToTable = payload => {
    // const newData = {
    //   medicine_name: payload.medicine_name,
    //   purchase_unit_id: payload.purchase_unit_id,
    //   purchase_qty: payload.purchase_qty,
    //   purchase_unit_price: payload.purchase_unit_price,
    //   purchase_purchase_price: payload.purchase_purchase_price,
    //   purchase_batch_no: payload.purchase_batch_no,
    //   purchase_expiry_date: payload.purchase_expiry_date,
    //   purchase_stock_item_id: payload.purchase_stock_item_id,
    //   purchase_gst_type: payload.purchase_gst_type,
    //   purchase_tax_amount: payload.purchase_tax_amount
    // }
    const updatedPayload = { ...payload, uid: uuidv4() } // Add a unique ID to payload

    const updatedNestedRows = [...editParams.purchase_details, updatedPayload]
    // const updatedNestedRows = [...editParams.purchase_details, payload]

    setEditParams({
      ...editParams,
      purchase_details: updatedNestedRows
    })

    setNestedRowMedicine(initialNestedRowMedicine)
    setShow(false)
  }
  function formatDate(dateString) {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }
  function parseFormattedDate(formattedDate) {
    const parts = formattedDate.split('-')
    const year = parts[0]
    const month = Number(parts[1]) - 1
    const day = parts[2]

    return new Date(year, month, day)
  }

  const validate = values => {
    const itemErrors = {}
    if (!values.medicine_name || values.medicine_name === '') {
      itemErrors.medicine_name = 'This field is required'
    }
    if (isNaN(parseInt(values.purchase_unit_price)) || parseInt(values.purchase_unit_price) <= 0) {
      itemErrors.purchase_unit_price = 'This field is required'
      if (parseInt(values.purchase_unit_price) === 0 || parseInt(values.purchase_unit_price) < 0) {
        itemErrors.purchase_unit_price = 'Enter valid Price'
      }
    }
    if (isNaN(parseInt(values.purchase_qty)) || parseInt(values.purchase_qty) <= 0) {
      itemErrors.purchase_qty = 'This field is required'
      if (parseInt(values.purchase_qty) === 0 || parseInt(values.purchase_qty) < 0) {
        itemErrors.purchase_qty = 'Enter valid Quantity'
      }
    }

    if (!values.purchase_batch_no) {
      itemErrors.purchase_batch_no = 'This field is required'
    }
    if (!values.purchase_expiry_date) {
      itemErrors.purchase_expiry_date = 'This field is required'
    }

    return itemErrors
  }

  // const validateItems = values => {
  //   const errors = {}

  //   if (!values.po_no) {
  //     errors.po_no = 'This field is required'
  //   }
  //   if (!values.store_id) {
  //     errors.store_id = 'This field is required'
  //   }
  //   if (!values.supplier_id) {
  //     errors.supplier_id = 'This field is required'
  //   }
  //   if (!values.po_date) {
  //     errors.po_date = 'This field is required'
  //   }

  //   return errors
  // }

  const submitItems = payload => {
    // const HasErrors =
    //   payload.medicine_name !== '' &&
    //   payload.purchase_qty !== '' &&
    //   !isNaN(parseInt(payload.purchase_qty)) &&
    //   parseInt(payload.purchase_qty) > 0 &&
    //   payload.purchase_unit_price !== '' &&
    //   !isNaN(parseInt(payload.purchase_unit_price)) &&
    //   parseInt(payload.purchase_unit_price) > 0 &&
    //   payload.purchase_batch_no !== '' &&
    //   payload.purchase_expiry_date !== ''
    // if (HasErrors === false) {
    //
    //   setItemErrors(validate(payload))

    //   return
    // }

    if (!medicineItemId) {
      // const isMedicineAlreadyExists = editParams.purchase_details.some(
      //   item =>
      //     item.purchase_unit_id === payload.purchase_unit_id && item.purchase_batch_no === payload.purchase_batch_no
      // )

      // if (isMedicineAlreadyExists) {
      //   setDuplicateMedError('Medicine already exists')

      //   return
      // }
      setErrors({})
      addItemsToTable(payload)
    } else {
      updateFormItems(payload)
    }
  }

  const updateTableItems = payload => {
    const itemId = medicineItemId
    const updatedState = { ...editParams }

    const updatedIndex = updatedState.purchase_details.findIndex(
      // row => row.purchase_unit_id === itemId && row.purchase_batch_no === nestedRowMedicine.purchase_batch_no
      row => row?.uid === itemId && row.purchase_batch_no === nestedRowMedicine.purchase_batch_no
    )

    if (updatedIndex !== -1) {
      const updatedNestedRows = [...updatedState?.purchase_details]
      updatedNestedRows[updatedIndex] = {
        ...updatedNestedRows[updatedIndex],
        ...payload
      }
      updatedState.purchase_details = updatedNestedRows

      setEditParams(updatedState)
      setNestedRowMedicine(initialNestedRowMedicine)
      setMedicineItemId('')
      closeDialog()
    } else {
      console.error('updateTableItems error')
    }
  }

  const updateFormItems = payload => {
    // const HasErrors =
    //   !nestedRowMedicine.medicine_name ||
    //   !nestedRowMedicine.purchase_unit_id ||
    //   !nestedRowMedicine.purchase_qty ||
    //   !nestedRowMedicine.purchase_unit_price ||
    //   !nestedRowMedicine.purchase_batch_no ||
    //   !nestedRowMedicine.purchase_purchase_price ||
    //   !nestedRowMedicine.purchase_expiry_date

    // const HasErrors =
    //   nestedRowMedicine.medicine_name !== '' &&
    //   nestedRowMedicine.purchase_qty !== '' &&
    //   !isNaN(parseInt(nestedRowMedicine.purchase_qty)) &&
    //   parseInt(nestedRowMedicine.purchase_qty) > 0 &&
    //   nestedRowMedicine.purchase_unit_price !== '' &&
    //   !isNaN(parseInt(nestedRowMedicine.purchase_unit_price)) &&
    //   parseInt(nestedRowMedicine.purchase_unit_price) > 0 &&
    //   nestedRowMedicine.purchase_batch_no !== '' &&
    //   nestedRowMedicine.purchase_expiry_date !== ''

    // if (HasErrors === false) {
    //   setItemErrors(validate(nestedRowMedicine))

    //   return
    // }
    if (nestedRowMedicine.control_substance === 'yes') {
      if (nestedRowMedicine.control_substance_file.length === 0) {
        setItemErrors(validate(nestedRowMedicine))

        return
      }
    }
    setErrors({})
    updateTableItems(payload)
  }

  const onSubmit = async data => {
    setSubmitLoader(true)
    // console.log('data', data)

    const postData = editParams
    postData.description = data.description
    postData.po_date = data.po_date
    postData.supplier_id = data.supplier_id
    postData.po_no = data.po_no
    postData.purchase_order_no = data.purchase_order_no
    postData.requested_by = data.requested_by

    postData.cgst = calculate_cgst_tax_amount
    postData.sgst = calculate_sgst_tax_amount
    // postData.igst = calculate_cgst_tax_amount + calculate_sgst_tax_amount
    postData.igst = calculate_igst_tax_amount

    postData.total_amount = totalLineItemsAmount

    // postData.tax_amount = calculate_cgst_tax_amount + calculate_sgst_tax_amount
    postData.discount_amount = totalLineItemsDiscount
    postData.taxable_amount = totalLineItemsTaxableAmount
    // postData.discount_percentage = calculate_lineItem_discount_percentage

    // new Changes
    postData.invoice_transcript = fileArr
    postData.freight_charges = data.freight_charges
    postData.freight_gst = data.freight_gst
    postData.freight_total_charges = String(totalFreightCharges)
    postData.additional_charges = data.additional_charges
    postData.round_off = roundup_select == '-' ? roundup_select + roundUpValue : roundUpValue

    // postData.net_amount =
    //   totalLineItemsPurchase +
    //   totalFreightCharges +
    //   parseFloat(data.additional_charges) +
    //   parseFloat(roundup_select == '-' ? roundup_select + roundUpValue : roundUpValue)
    postData.net_amount = grandTotalAmount
    // added grand total amount
    console.log('postData', postData)
    // debugger
    try {
      if (id) {
        postData.antz_pharmacy_purchase_id = id
        // const response = await updatePurchase(id, postData)

        const response = await updatePurchasePrice(id, postData)

        if (response?.success) {
          toast.success(response.message)
          setSubmitLoader(false)
          getListOfItemsById(id)
          if (navigatedFrom === 'stockReport') {
            Router.push('/pharmacy/stocks/stocksReport/')
          } else {
            Router.push('/pharmacy/purchase/')
          }
        } else {
          setSubmitLoader(false)
          toast.error(response.message)
          console.log('error', response.message)
        }
      } else {
        const response = await addPurchase(postData)

        if (response?.success) {
          toast.success(response.message)
          if (postData?.purchase_created_by === 'invoice_upload') {
            const suggestionData = postData?.purchase_details?.map(el => {
              return {
                ml_product_name: el?.medicine_name_by_ml,
                stock_name: el?.medicine_name,
                stock_id: el?.purchase_stock_item_id
              }
            })

            console.log('ml trained triggered')
            console.log('suggestionData', suggestionData)

            try {
              const mlResult = await productMappingForMlTraining(suggestionData)
              console.log('ML training completed successfully', mlResult)
              toast.success(mlResult?.data)

              setEditParams(editParamsInitialState)
              setSubmitLoader(false)
              Router.push('/pharmacy/purchase/')
            } catch (error) {
              console.error('ML training error:', error)
              toast.success('ML not trained successfully')
              setEditParams(editParamsInitialState)
              setSubmitLoader(false)
              Router.push('/pharmacy/purchase/')
            }
          } else {
            setEditParams(editParamsInitialState)
            setSubmitLoader(false)
            Router.push('/pharmacy/purchase/')
          }
        } else {
          setSubmitLoader(false)
          if (response.data?.po_no) {
            toast.error('Purchase number already exist ')
          }
          if (response?.message) {
            toast.error(response.message)
            console.log('error', response.message)
          }
        }
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handlePurchaseSubmit = async () => {
    try {
      const errors = await trigger()
      if (errors) {
        showDialog()
      } else {
        scrollToTop()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const getStoresLists = async () => {
    if (selectedPharmacy) {
      setEditParams({
        ...editParams,
        store_id: selectedPharmacy.id,
        type_of_store: selectedPharmacy.type
      })
    }
    // const params = {
    //   q: 'central',
    //   column: 'type'
    // }
    // try {
    //   const response = await getStoreList({ params })
    //   if (response?.success && response?.data?.list_items?.length > 0) {
    //     setStores(response?.data?.list_items)
    //     if (response?.data?.list_items?.length === 1) {
    //       setEditParams({
    //         ...editParams,
    //         store_id: response?.data?.list_items[0].id,
    //         type_of_store: response?.data?.list_items[0].type
    //       })
    //     }
    //   }
    // } catch (error) {
    //   console.log('store error', error)
    // }
  }

  const getSuppliersLists = async () => {
    try {
      const response = await getSuppliers({})

      if (response.data.data.list_items?.length > 0) {
        setSuppliers(response.data.data.list_items)
      }
    } catch (error) {
      console.log('supplier error', error)
    }
  }

  //  ******
  const fetchMedicineData = async searchText => {
    try {
      const params = {
        sort: 'asc',
        q: searchText,
        limit: 20
      }

      const searchResults = await getMedicineList({ params: params })
      if (searchResults?.data?.list_items.length > 0) {
        setOptionsMedicineList(
          searchResults?.data?.list_items?.map(item => ({
            value: item.id,
            label: item.name,
            status: item?.active === '0' ? 0 : 1,

            purchase_unit_price: item?.price,
            tax_type: item.gst_value ? item.gst_value : '',
            stock_type: item.stock_type,
            package_details: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
            manufacture: item.manufacturer_name
            // supplier_price: item.supplier_price
          }))
        )
      }
    } catch (e) {
      console.log('error', e)
    }
    // }
  }

  const getMedicineExpiryDate = async (product_id, batch) => {
    try {
      setExpiryDateLoader(true)
      // setProductExpiryDate('')
      const response = await getBatchExpiry({ batch: batch, stock_id: product_id })

      if (response?.success && response?.data !== null) {
        setNestedRowMedicine(prevState => ({
          ...prevState,
          purchase_expiry_date: response?.data?.expiry_date,
          purchase_variant_id: response?.data?.variant_id,
          purchase_variant_ratio: response?.data?.multiplier,
          isVariantIdPresent: response?.data?.variant_id && response?.data?.multiplier ? true : false
        }))

        setProductExpiryDate(response.data.expiry_date)
      }
      //  else {
      //   setNestedRowMedicine(prevState => ({
      //     ...prevState,
      //     purchase_expiry_date: '',
      //     purchase_variant_id: '',
      //     purchase_variant_ratio: ''
      //   }))
      //   setProductExpiryDate('')
      // }
    } catch (error) {
      console.log('supplier error', error)
    } finally {
      setExpiryDateLoader(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchMedicineData = useCallback(
    debounce(async searchText => {
      try {
        await fetchMedicineData(searchText)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const checkMedicineExpiryDate = useCallback(
    debounce(async (id, batch) => {
      if (id?.trim() !== '' && batch?.trim() !== '') {
        try {
          await getMedicineExpiryDate(id, batch)
        } catch (error) {
          console.error(error)
        }
      }
    }, 500),
    []
  )

  const getProductVariantByproductId = async productId => {
    const productVariant = await getVariantFOrProduct(productId)

    // if (editParams.purchase_created_by === 'invoice_upload') {
    //   const data = {
    //     value: 16,
    //     label: 1,
    //     description: '',
    //     is_default: ''
    //   }
    //   setProductVariantOptions([data])
    // } else {
    if (productVariant?.success && productVariant?.data?.length > 0) {
      const data = productVariant?.data?.map(el => {
        return {
          value: Number(el?.variant_id),
          label: el?.unit_multiplier,
          description: el?.description,
          is_default: el?.is_default
          // variantId: el?.variant_id
        }
      })
      // console.log('data', data)
      setProductVariantOptions(data)
    }
    // }
  }

  const getListOfItemsById = async id => {
    try {
      const result = await getPurchaseListById(id)
      if (result.success === true && result.data !== '') {
        const lineItems = result?.data?.purchase_detailss?.map(el => {
          return {
            ...el,
            uid: uuidv4(),
            medicine_name: el?.stock_item_name,
            id: el?.id,
            stock_type: el?.stock_type,
            package_details: `${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`,
            manufacture: el?.manufacturer,
            purchase_expiry_date: el?.stock_type === 'non_medical' ? null : el?.purchase_expiry_date,
            purchase_variant_id: el?.purchase_variant_id,
            purchase_variant_ratio: el?.unit_multiplier,
            purchase_unit_qty: el?.purchase_total_qty ? el?.purchase_total_qty : el?.purchase_qty,
            isVariantIdPresent: el?.purchase_variant_id && el?.unit_multiplier ? true : false
            // medicine_name: el?.stock_item_name,
            // stock_type: el?.stock_type,
            // purchase_batch_no: el?.purchase_batch_no,
            // purchase_expiry_date: el?.purchase_expiry_date,
            // purchase_unit_price: el?.purchase_unit_price,
            // purchase_qty: el?.purchase_qty,
            // purchase_free_quantity: el?.purchase_free_quantity,
            // purchase_discount: el?.purchase_discount,
            // purchase_gst: el?.purchase_gst,
            // purchase_tax_amount: el?.purchase_tax_amount,
            // purchase_gross_amount: el?.purchase_gross_amount,
            // purchase_discount_amount: el?.purchase_discount_amount,
            // purchase_taxable_amount: el?.purchase_taxable_amount,
            // purchase_net_amount: el?.purchase_net_amount,
            // purchase_unit_id: el?.purchase_unit_id

            // medicine_name: el?.stock_item_name,
            // purchase_unit_id: el?.unit_id,
            // purchase_stock_item_id: el?.stock_item_id,
            // // purchase_stock_item_id: el?.stock_item_id,
            // purchase_qty: el?.purchase_qty,
            // purchase_unit_price: el?.purchase_unit_price,
            // purchase_purchase_price: el?.purchase_price,
            // purchase_batch_no: el?.purchase_batch_no,
            // purchase_expiry_date: el?.purchase_expiry_date,
            // purchase_gst_type: el?.gst_type,
            // purchase_tax_amount: el?.tax_amount
          }
        })
        // console.log('getVariantRatioById', getVariantRatioById('15'))
        setEditParams({
          ...editParams,
          id: result?.data?.id,
          po_no: result?.data?.po_no,
          purchase_batch_no: result?.data?.purchase_batch_no,
          po_date: result?.data?.po_date,
          store_id: result?.data?.store_id,
          supplier_id: result?.data?.supplier_id,
          description: result?.data?.description,
          type_of_store: result?.data?.type_of_store,
          purchase_details: lineItems,
          total_amount: result?.data?.total_amount,
          discount_type: result?.data?.discount_type ? result?.data?.discount_type : '',
          discount_amount: result?.data?.discount_amount,
          discount_percentage: result?.data?.discount_percentage,
          net_amount: result?.data?.net_amount,
          tax_amount: result?.data?.tax_amount,
          taxable_amount: result?.data?.taxable_amount,
          purchase_order_no: result?.data?.purchase_order_no,
          requested_by: result?.data?.requested_by,

          // new added values
          invoice_transcript: result?.data?.invoice_transcript,
          freight_charges: result?.data?.freight_charges,
          freight_gst: result?.data?.freight_gst,
          freight_total_charges: result?.data?.freight_total_charges,
          additional_charges: result?.data?.additional_charges,
          round_off: result?.data?.round_off
        })

        //

        // setSuppliers([{ id: result?.data?.supplier_id, company_name: result?.data?.company_name }])
        // setValue('supplier_id', result?.data?.supplier_id)
        result?.data?.freight_charges && setShowFreight(true)
        result?.data?.freight_total_charges && setTotalFreightCharges(Number(result?.data?.freight_total_charges))
        // result?.data?.freight_total_charges && setInputValue(Number(result?.data?.freight_total_charges))

        result?.data?.additional_charges && setAdditionalCharges(Number(result?.data?.additional_charges))
        result?.data?.round_off && setRoundUpValue(Number(result?.data?.round_off?.replace('-', '')))
        result?.data?.invoice_transcript && setFileArr(result?.data?.invoice_transcript)
        result?.data?.invoice_transcript && setFileSrc(result?.data?.invoice_transcript)
        result?.data?.round_off < 0 && setRoundup_Select('-')

        reset({
          supplier_id: result?.data?.supplier_id,
          po_date: result?.data?.po_date,
          po_no: result?.data?.po_no,
          description: result?.data?.description,
          purchase_order_no: result?.data?.purchase_order_no,
          requested_by: result?.data?.requested_by,
          freight_charges: result?.data?.freight_charges,
          freight_gst: result?.data?.freight_gst,
          freight_total_charges: result?.data?.freight_total_charges,
          additional_charges: result?.data?.additional_charges,
          round_off: result?.data?.round_off?.replace('-', '')
        })
      }
    } catch (error) {
      console.log('purchase error', error)
    }
  }

  // ****** edit section //////
  const editTableData = (itemId, index, purchase_batch_no, medicineName) => {
    if (id != undefined && action === 'edit') {
      const getItems = editParams.purchase_details.filter(el => {
        // return el.purchase_unit_id === itemId && el.purchase_batch_no === purchase_batch_no
        return el.uid === itemId && el.medicine_name === medicineName && el.purchase_batch_no === purchase_batch_no
      })

      setOptionsMedicineList([
        {
          value: getItems[0].purchase_unit_id,
          label: getItems[0]?.medicine_name,
          stock_type: getItems[0]?.stock_type,
          package_details: getItems[0]?.package_details,
          manufacture: getItems[0]?.manufacture
        }
      ])
      getProductVariantByproductId(getItems[0]?.purchase_stock_item_id)

      setNestedRowMedicine({
        ...nestedRowMedicine,
        id: getItems[0]?.id,
        index,
        uid: getItems[0]?.uid,
        medicine_name: getItems[0]?.medicine_name,
        stock_type: getItems[0]?.stock_type,
        purchase_unit_id: getItems[0]?.purchase_unit_id,
        purchase_stock_item_id: getItems[0]?.purchase_stock_item_id
          ? getItems[0]?.purchase_stock_item_id
          : getItems[0]?.purchase_unit_id,
        purchase_batch_no: getItems[0]?.purchase_batch_no,
        purchase_expiry_date:
          getItems[0]?.stock_type === 'non_medical' ? null : moment(getItems[0]?.purchase_expiry_date),
        purchase_unit_price: getItems[0]?.purchase_unit_price,
        purchase_qty: getItems[0]?.purchase_qty,
        purchase_free_quantity: getItems[0]?.purchase_free_quantity,
        purchase_discount: getItems[0]?.purchase_discount,
        purchase_cgst: getItems[0]?.purchase_cgst,
        purchase_gst: getItems[0]?.purchase_gst,
        purchase_sgst: getItems[0]?.purchase_sgst,
        purchase_igst: getItems[0]?.purchase_igst,
        purchase_cgst_amount: getItems[0]?.purchase_cgst_amount,
        purchase_sgst_amount: getItems[0]?.purchase_sgst_amount,
        purchase_igst_amount: getItems[0]?.purchase_igst_amount,
        purchase_gross_amount: getItems[0]?.purchase_gross_amount,
        purchase_discount_amount: getItems[0]?.purchase_discount_amount,
        purchase_taxable_amount: getItems[0]?.purchase_taxable_amount,
        purchase_net_amount: getItems[0]?.purchase_net_amount,
        purchase_purchase_price: getItems[0]?.purchase_purchase_price,
        package_details: getItems[0]?.package_details,
        manufacture: getItems[0]?.manufacture,
        purchase_variant_id: getItems[0]?.purchase_variant_id,
        purchase_unit_qty: getItems[0]?.purchase_unit_qty,
        purchase_variant_ratio: getItems[0]?.purchase_variant_ratio,
        isVariantIdPresent: getItems[0]?.isVariantIdPresent,
        purchase_created_by: getItems[0]?.purchase_created_by,
        medicine_name_by_ml: getItems[0]?.medicine_name_by_ml

        // purchase_gst_type: getItems[0].purchase_gst_type,
        // purchase_tax_amount: getItems[0].purchase_tax_amount
      })
    } else {
      const getItems = editParams.purchase_details.filter(el => {
        return el.uid === itemId && el.medicine_name === medicineName && el.purchase_batch_no === purchase_batch_no
      })

      setOptionsMedicineList([
        {
          value: getItems[0]?.purchase_unit_id,
          label: getItems[0]?.medicine_name,
          stock_type: getItems[0]?.stock_type,
          package_details: getItems[0]?.package_details,
          manufacture: getItems[0]?.manufacture
        }
      ])
      getProductVariantByproductId(getItems[0]?.purchase_stock_item_id)

      setNestedRowMedicine({
        ...nestedRowMedicine,
        id: getItems[0]?.id,

        medicine_name: getItems[0]?.medicine_name,
        stock_type: getItems[0]?.stock_type,
        index,
        uid: getItems[0]?.uid,
        purchase_unit_id: getItems[0]?.purchase_unit_id,
        purchase_stock_item_id: getItems[0]?.purchase_stock_item_id
          ? getItems[0]?.purchase_stock_item_id
          : getItems[0]?.purchase_unit_id,
        purchase_batch_no: getItems[0]?.purchase_batch_no,
        purchase_expiry_date:
          getItems[0]?.stock_type === 'non_medical' ? null : moment(getItems[0]?.purchase_expiry_date),
        purchase_unit_price: getItems[0]?.purchase_unit_price,
        purchase_qty: getItems[0]?.purchase_qty,
        purchase_free_quantity: getItems[0]?.purchase_free_quantity,
        purchase_discount: getItems[0]?.purchase_discount,
        purchase_cgst: getItems[0]?.purchase_cgst,
        purchase_gst: getItems[0]?.purchase_gst,
        purchase_sgst: getItems[0]?.purchase_sgst,
        purchase_igst: getItems[0]?.purchase_igst,

        purchase_cgst_amount: getItems[0]?.purchase_cgst_amount,
        purchase_sgst_amount: getItems[0]?.purchase_sgst_amount,
        purchase_igst_amount: getItems[0]?.purchase_igst_amount,
        purchase_gross_amount: getItems[0]?.purchase_gross_amount,
        purchase_discount_amount: getItems[0]?.purchase_discount_amount,
        purchase_taxable_amount: getItems[0]?.purchase_taxable_amount,
        purchase_net_amount: getItems[0]?.purchase_net_amount,
        purchase_purchase_price: getItems[0]?.purchase_purchase_price,
        package_details: getItems[0]?.package_details,
        manufacture: getItems[0]?.manufacture,
        purchase_variant_id: getItems[0]?.purchase_variant_id,
        purchase_unit_qty: getItems[0]?.purchase_unit_qty,
        purchase_variant_ratio: getItems[0]?.purchase_variant_ratio,
        isVariantIdPresent: getItems[0]?.isVariantIdPresent,
        purchase_created_by: getItems[0]?.purchase_created_by,
        medicine_name_by_ml: getItems[0]?.medicine_name_by_ml
      })
    }
  }

  useEffect(() => {
    if (id != undefined && action === 'edit') {
      getListOfItemsById(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, action])

  // ****** edit section //////
  // data posting section

  const postItemsData = async () => {
    // if (editParams.discount_type !== '') {
    //   if (editParams.discount_amount === '' || editParams.discount_percentage === '') {
    //     setValidateDiscount('Please enter discount value')

    //     return
    //   }
    // }
    setSubmitLoader(true)

    const postData = editParams
    postData.total_amount = totalLineItemsPurchase + calculateTotalTaxAmount

    if (id) {
      postData.antz_pharmacy_purchase_id = id
      const response = await updatePurchase(id, postData)

      if (response?.success) {
        toast.success(response.message)
        setSubmitLoader(false)
        getListOfItemsById(id)
        Router.push('/pharmacy/purchase/')
      } else {
        setSubmitLoader(false)
        toast.error(response.message)
      }
    } else {
      const response = await addPurchase(postData)
      if (response?.success) {
        toast.success(response.message)
        setEditParams(editParamsInitialState)
        setSubmitLoader(false)
        Router.push('/pharmacy/purchase/')
      } else {
        setSubmitLoader(false)
        if (response.data?.po_no) {
          toast.error('Purchase number already exist ')
        }
        if (response?.message) {
          toast.error(response.message)
        }
      }
    }
  }

  // validatePurchaseProducts

  const getRecentPurchasePriceOfProduct = useCallback(
    debounce(async productDetails => {
      if (productDetails) {
        try {
          const response = await validatePurchaseProducts(productDetails)

          if (response?.success === false) {
            setPriceValidationError(true)
          } else {
            setPriceValidationError(false)
          }
        } catch (error) {
          console.log('supplier error', error)
        }
      }
    }, 500), // 500ms debounce delay
    []
  )

  // data posting section
  const createForm = () => {
    return (
      <CardContent>
        <PurchaseItemForm
          medicineItemId={medicineItemId}
          optionsMedicineList={optionsMedicineList}
          searchMedicineData={searchMedicineData}
          submitItems={submitItems}
          nestedRowMedicine={nestedRowMedicine}
          updateFormItems={updateFormItems}
          purchase_details={editParams.purchase_details}
          checkMedicineExpiryDate={checkMedicineExpiryDate}
          productExpiryDate={productExpiryDate}
          expiryDateLoader={expiryDateLoader}
          getRecentPurchasePriceOfProduct={getRecentPurchasePriceOfProduct}
          validatePurchaseDialog={validatePurchaseDialog}
          setValidatePurchaseDialog={setValidatePurchaseDialog}
          priceValidationError={priceValidationError}
          setPriceValidationError={setPriceValidationError}
          currentPayload={currentPayload}
          setCurrentPayload={setCurrentPayload}
          getProductVariantByproductId={getProductVariantByproductId}
          productVariantOptions={productVariantOptions}
          setProductVariantOptions={setProductVariantOptions}
        ></PurchaseItemForm>
      </CardContent>
    )
  }

  const closeSupplierDialog = () => {
    getSuppliersLists()
    setSupplierDialog(false)
  }

  // total Freight Charges

  // console.log('additionalCharges', additionalCharges)
  // console.log('totalFreightCharges', totalFreightCharges)

  // Function to calculate total freight charges including GST
  const calculateFreightChargesWithGst = (freightCharges, gstPercent) => {
    const numericFreight = parseFloat(freightCharges) || 0
    const numericGst = parseFloat(gstPercent) || 0

    return numericFreight + (numericFreight * numericGst) / 100
  }

  // Watch values and update total charges
  // useEffect(() => {
  //   debugger
  //   const freightCharges = getValues('freight_charges')
  //   const gstPercent = getValues('freight_gst')
  //   const total = calculateFreightChargesWithGst(freightCharges, gstPercent)
  //   setTotalFreightCharges(total)
  // }, [control])

  // round off value

  const handleRoundupChange = event => {
    setRoundup_Select(event.target.value)
  }

  // drawer Fun
  const [openDocsDrawer, setOpenDocsDrawer] = useState(false)

  const [defaultIcon, setDefaultIcon] = useState(authData?.userData?.settings?.DEFAULT_IMAGE_MASTER)

  // Upload invoice

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: {
      '.png,.jpg,.jpeg,.pdf': []
    },
    onDrop: acceptedFiles => {
      const newFileSrc = []
      const newFileArr = []

      acceptedFiles.forEach(file => {
        const reader = new FileReader()
        reader.onload = () => {
          // Push the file data URL to newFileSrc
          newFileSrc.push(reader.result)

          // Update state after the file has been read
          if (newFileSrc.length === acceptedFiles.length) {
            // Update the state once for all files
            setFileSrc(prev => [...prev, ...newFileSrc])
          }
        }
        reader.readAsDataURL(file)
        newFileArr.push(file)
      })

      // Append the files to the state
      setFileArr(prev => [...prev, ...newFileArr])
      setDisplayFile(newFileArr.length > 1 ? `${newFileArr.length} files selected` : newFileArr[0]?.name)

      // Update the form value
      setValue('invoice_transcript', prev => [...prev, ...newFileSrc])
      clearErrors('invoice_transcript')
    }
  })

  const handleAddImageClick = () => {
    fileInputRef?.current?.click()
  }

  // const handleInputImageChange = event => {
  //   const { files } = event.target
  //   if (files && files.length !== 0) {
  //     const newFileSrc = []
  //     const newFileArr = []

  //     for (let i = 0; i < files.length; i++) {
  //       const currentFile = files[i]

  //       // Generate object URL for the new file
  //       newFileSrc.push(URL.createObjectURL(currentFile))
  //       newFileArr.push(currentFile)
  //     }

  //     // Append the new files to the existing state
  //     setFileSrc(prev => [...prev, ...newFileSrc])
  //     setFileArr(prev => [...prev, ...newFileArr])

  //     // Update file display and set form values
  //     setDisplayFile(files.length > 1 ? `${files.length} files selected` : files[0]?.name)
  //     setValue('invoice_transcript', prev => [...prev, ...newFileSrc]) // Append new files to the form value
  //     clearErrors('invoice_transcript')
  //   }
  // }
  const handleInputImageChange = eventOrFiles => {
    // this function is modified to use in invoice upload form
    let files = []

    // Check if the function is called with an event or directly with a file list
    if (eventOrFiles?.target) {
      files = eventOrFiles?.target.files
    } else if (Array?.isArray(eventOrFiles)) {
      files = eventOrFiles
    } else {
      files = [eventOrFiles] // Single file case
    }

    if (files && files.length !== 0) {
      const newFileSrc = []
      const newFileArr = []

      for (let i = 0; i < files.length; i++) {
        const currentFile = files[i]

        // Generate object URL for preview
        newFileSrc.push(URL.createObjectURL(currentFile))
        newFileArr.push(currentFile)
      }

      // Append the new files to state
      setFileSrc(prev => [...prev, ...newFileSrc])
      setFileArr(prev => [...prev, ...newFileArr])

      // Update display text
      setDisplayFile(files.length > 1 ? `${files.length} files selected` : files[0]?.name)

      // Update form values
      setValue('invoice_transcript', prev => [...prev, ...newFileSrc])
      clearErrors('invoice_transcript')
    }
  }

  // delete api fun.

  const deleteInvoiceById = async (id, deleteId) => {
    const params = { transcript_id: deleteId }
    setDeleteLoader(true)
    try {
      const res = await postDeleteInvoiceById(id, params)
      if (res?.success) {
        if (id != undefined && action === 'edit') {
          getListOfItemsById(id)
        }
        toast.success(res?.data)
      } else {
        toast.success(res?.data)
      }
    } catch (error) {
      console.log('purchase error', error)
    } finally {
      setDeleteLoader(false)
      setConfirmDeleteDialog(false)
    }
  }

  const fetchAllVariantsList = async (sort, q, column) => {
    try {
      const params = {
        sort,
        q,
        column
      }
      await getVariants({ params: params }).then(res => {
        setVariantLists(res?.data?.list_items)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const removeSelectedImage = (e, deleteId, index) => {
    e.stopPropagation()

    if (deleteId && action === 'edit' && !index) {
      deleteInvoiceById(id, deleteId)
    } else {
      setFileSrc(prevFiles => {
        const updatedFiles = prevFiles.filter((_, i) => i !== index)
        setValue('invoice_transcript', updatedFiles.length === 0 ? '' : updatedFiles)

        return updatedFiles
      })

      setFileArr(prevFiles => {
        const updatedFiles = prevFiles.filter((_, i) => i !== index)
        // Only set value once
        setValue('invoice_transcript', updatedFiles.length === 0 ? '' : updatedFiles)

        return updatedFiles
      })

      setConfirmDeleteDialog(false)
    }
  }

  // ---------------

  useEffect(() => {
    if (Number(inputValue).toFixed(2) !== Number(grandTotalAmount).toFixed(2)) {
      setIsError(true)
    } else {
      setIsError(false)
    }
  }, [inputValue, grandTotalAmount])

  // const handleInputChange = e => {
  //   const value = e.target.value
  //   setInputValue(value)

  //   // Validate the input value against grandTotalAmount
  //   if (parseFloat(value) !== grandTotalAmount) {
  //     setIsError(true)
  //   } else {
  //     setIsError(false)
  //   }
  // }

  useEffect(() => {
    getStoresLists()
    getSuppliersLists()
    fetchAllVariantsList()
  }, [])

  // useEffect(() => {
  //   if (grandTotalAmount && id) {
  //     setInputValue(Number(grandTotalAmount).toFixed(2))
  //   }
  // }, [grandTotalAmount])

  const validateErrorForItemId = () => {
    const error = editParams?.purchase_details?.some(
      el =>
        el?.purchase_stock_item_id === '' ||
        el?.purchase_stock_item_id === null ||
        el?.purchase_unit_id === '' ||
        el?.purchase_unit_id === null ||
        !el?.purchase_unit_id
    )
    console.log('error', error)

    return error
  }

  const validateAndShowAmount = () => {
    const numericInputValue = parseFloat(inputValue)
    const numericGrandTotal = parseFloat(grandTotalAmount)

    if (isNaN(numericInputValue) || isNaN(numericGrandTotal)) {
      setShowAmount(false)

      return
    }
    if (numericInputValue > numericGrandTotal * 0.5) {
      setShowAmount(true)
    } else {
      setShowAmount(false)
    }
  }

  return (
    <Card>
      <Grid container sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Grid item size={{ xs: 12, sm: 4 }}>
          <CardHeader
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%'
            }}
            avatar={
              <Icon
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  if (navigatedFrom === 'stockReport') {
                    Router.push('/pharmacy/stocks/stocksReport/')
                  } else {
                    Router.back()
                  }
                }}
                icon='ep:back'
              />
            }
            title={id ? 'Edit Inventory List' : 'Add Inventory'}
          />
        </Grid>
        <Grid
          item
          size={{ xs: 12, sm: 7 }}
          sx={{
            display: 'flex',
            flexDirection: { lg: 'row', md: 'row', xl: 'row', sm: 'row', xs: 'column' },
            justifyContent: 'flex-end',
            alignItems: { lg: 'center', md: 'center', xl: 'center', sm: 'center', xs: 'start' },
            columnGap: 2,
            mx: { xs: 2, lg: 3, md: 3, xl: 3, sm: 3 },
            mb: { xs: 2, lg: 0, md: 0, xl: 0, sm: 0 },
            mr: 2,
            rowGap: { xs: 3, lg: 0, md: 0, xl: 0, sm: 0 }
          }}
        >
          {authData?.userData?.roles?.settings?.add_pharmacy && !id && (
            <AddButton
              title='Upload Invoice '
              action={() => {
                setInvoiceUploadDialog(true)
              }}
            />
          )}
          {authData?.userData?.roles?.settings?.add_pharmacy && (
            <AddButton
              title='Add Supplier'
              action={() => {
                setSupplierDialog(true)
              }}
            />
          )}
        </Grid>
      </Grid>
      <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <Divider sx={{ mb: '16px', mt: -2 }} />
          <Typography sx={{ fontSize: '16px', fontWeight: 500, mb: '16px' }}>Supplier Details</Typography>
          <Grid container spacing={5}>
            {/* <Grid item xs={12} sm={6}> */}
            <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
              <FormControl fullWidth>
                <InputLabel error={Boolean(errors.supplier_id)}>Supplier*</InputLabel>
                <Controller
                  name='supplier_id'
                  control={control}
                  rules={{ required: true }}
                  defaultValue=''
                  render={({ field }) => (
                    <Select
                      {...field}
                      // name='supplier_id'
                      // value={value}
                      // onChange={(e, val) => {
                      //   onChange(e.target.value)
                      // }}
                      label='Supplier*'
                      // disabled={!!id}
                      error={Boolean(errors.supplier_id)}
                    >
                      {suppliers?.map(item => (
                        <MenuItem key={item.id} disabled={item.status === 'inactive'} value={item.id}>
                          {item.company_name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors?.supplier_id && <FormHelperText error>{errors.supplier_id.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
              <FormControl fullWidth>
                <Controller
                  name='po_date'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <SingleDatePicker
                      name='Purchase Date*'
                      fullWidth
                      maxDate={new Date()}
                      date={value ? parseFormattedDate(value) : null}
                      width={'100%'}
                      onChangeHandler={date => {
                        let formatted = formatDate(date)
                        onChange(formatted)
                      }}
                      customInput={<CustomInput label='Purchase Date*' error={Boolean(errors.po_date)} />}
                      isClearable={false}
                    />
                  )}
                />
                {errors.po_date && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    {errors.po_date.message}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
              <FormControl fullWidth>
                <Controller
                  name='po_no'
                  control={control}
                  rules={{ required: true }}
                  defaultValue=''
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type='text'
                      name='po_no'
                      disabled={id ? true : false}
                      error={Boolean(errors.po_no)}
                      label='Purchase Invoice Number*'
                    />
                  )}
                />
                {errors.po_no && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    {errors.po_no.message}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* <Grid item size={{xs: 12, sm: 6}}>
              <FormControl fullWidth>
                <InputLabel error={Boolean(errors.supplier_id)}>Byy*</InputLabel>
                <Controller
                  name='supplier_id'
                  control={control}
                  rules={{ required: true }}
                  defaultValue=''
                  render={({ field }) => (
                    <Select
                      {...field}
                      // name='supplier_id'
                      // value={value}
                      // onChange={(e, val) => {
                      //   onChange(e.target.value)
                      // }}
                      label='Supplier*'
                      // disabled={!!id}
                      error={Boolean(errors.supplier_id)}
                    >
                      {suppliers?.map(item => (
                        <MenuItem key={item.id} disabled={item.status === 'inactive'} value={item.id}>
                          {item.company_name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors?.supplier_id && <FormHelperText error>{errors.supplier_id.message}</FormHelperText>}
              </FormControl>
            </Grid> */}
            <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
              <FormControl fullWidth>
                <Controller
                  name='purchase_order_no'
                  control={control}
                  rules={{ required: true }}
                  defaultValue=''
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type='text'
                      name='purchase_order_no'
                      // disabled={id ? true : false}
                      error={Boolean(errors.purchase_order_no)}
                      label='Purchase order number'
                    />
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
              <FormControl fullWidth>
                <Controller
                  name='requested_by'
                  control={control}
                  rules={{ required: true }}
                  defaultValue=''
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type='text'
                      name='requested_by'
                      // disabled={id ? true : false}
                      error={Boolean(errors.requested_by)}
                      label='Requested by'
                    />
                  )}
                />
              </FormControl>
            </Grid>

            {/* Upload Docs */}
            <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
              <Box sx={{ display: 'flex', gap: '12px' }}>
                <Box sx={{ width: '100%' }}>
                  <input
                    type='file'
                    accept='.png,.jpg,.jpeg,.pdf'
                    onChange={e => handleInputImageChange(e)}
                    style={{ display: 'none' }}
                    name='invoice_transcript'
                    ref={fileInputRef}
                    multiple={true}
                  />

                  <Box
                    {...getRootProps({ className: 'dropzone' })}
                    onClick={handleAddImageClick}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      height: 56,

                      border: `1px dashed `,
                      borderColor: theme?.palette?.primary?.dark,
                      borderRadius: 1,

                      padding: '10px'
                    }}
                  >
                    <Image alt={'filename'} src={UploadIcon} width={24} height={24} />

                    <Typography sx={{ color: theme?.palette?.primary?.dark, fontSize: '16px', fontWeight: 500 }}>
                      Upload invoice
                    </Typography>
                  </Box>
                </Box>
                {fileArr?.length > 0 ? (
                  <Box
                    onClick={() => setOpenDocsDrawer(true)}
                    sx={{
                      bgcolor: theme.palette.customColors.displaybgPrimary,
                      p: 1,
                      width: '65px',

                      borderRadius: '8px',
                      alignItems: 'center',
                      display: 'flex',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    {fileArr?.length == 1 ? (
                      <>
                        {/* <Box
                          size='small'
                          onClick={e => removeSelectedImage(e, 0)}
                          sx={{
                            position: 'absolute',
                            top: -1,
                            right: -1,
                            zIndex: 1

                            // borderColor: '#7A8684'
                          }}
                        >
                          <Icon icon='solar:close-square-bold' width='20px' height='20px' color={'#7A8684'} />
                        </Box> */}
                        <Box sx={{ width: '38px', height: '38px', mt: 1 }}>
                          <img
                            src={defaultIcon?.document?.image_path ? defaultIcon?.document?.image_path : null}
                            alt={'Docs ICon'}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </Box>
                      </>
                    ) : (
                      <Box
                        sx={{
                          px: fileArr?.length >= 10 ? 2 : 2.6,
                          py: 1,
                          borderRadius: '50%',
                          bgcolor: theme.palette.customColors.OnPrimarycontainer10
                        }}
                      >
                        <Typography sx={{ color: theme.palette.primary.main }}> {fileArr?.length}</Typography>
                      </Box>
                    )}
                  </Box>
                ) : null}
              </Box>

              {/* <Grid item md={12} sm={12} xs={12}>
                  {fileSrc && fileSrc.length > 0 && (
                    <Box sx={{ display: 'flex', mt: 2 }}>
                      {fileSrc.map((src, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: 'relative',
                            backgroundColor: theme.palette.customColors.tableHeaderBg,
                            borderRadius: '10px',
                            height: 121,
                            padding: '10.5px',
                            boxSizing: 'border-box',
                            marginRight: '10px' // Add margin for spacing between images
                          }}
                        >
                          <img
                            style={{
                              aspectRatio: 2 / 2,
                              height: '100%',
                              borderRadius: '5%',
                              objectFit: 'cover'
                            }}
                            alt={`Uploaded image ${index}`}
                            src={typeof src === 'string' ? src : src}
                          />
                          <Box
                            sx={{
                              cursor: 'pointer',
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              zIndex: 1,
                              height: '24px',
                              borderRadius: 0.4,
                              backgroundColor: theme.palette.customColors.secondaryBg
                            }}
                          >
                            <Icon
                              icon='material-symbols-light:close'
                              color='#fff'
                              onClick={() => removeSelectedImage(index)} // Pass the index here
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Grid> */}
            </Grid>
          </Grid>
          {/* Freight Charge */}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', mt: '16px' }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>Freight Charges</Typography>
            {showFreight ? (
              <Icon
                icon='fluent:subtract-circle-48-regular'
                width='20px'
                height='20px'
                margineTop={-2}
                color={theme.palette.customColors.addPrimary}
                onClick={() => setShowFreight(false)}
              />
            ) : (
              <Icon
                icon='lets-icons:add-ring'
                width='20px'
                height='20px'
                color={theme.palette.primary.main}
                onClick={() => setShowFreight(true)}
              />
            )}
          </Box>
          <Grid container spacing={5}>
            {/* Freight Charges Input */}

            <Grid
              item
              size={{ xs: 12, sm: 4, md: 4, lg: 4 }}
              sx={{
                mt: showFreight ? '16px' : 0,
                height: showFreight ? 'auto' : 0,
                opacity: showFreight ? 1 : 0,
                visibility: showFreight ? 'visible' : 'hidden',
                transition: 'height 0.3s ease, opacity 0.3s ease, visibility 0.3s ease'
              }}
            >
              <FormControl fullWidth>
                <Controller
                  name='freight_charges'
                  control={control}
                  rules={{ required: true }}
                  defaultValue=''
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type='text'
                      name='freight_charges'
                      // disabled={id ? true : false}
                      label='Freight Charges'
                      onChange={e => {
                        field.onChange(e) // Update form state
                        const freightCharges = e.target.value
                        const gstPercent = getValues('freight_gst')
                        const total = calculateFreightChargesWithGst(freightCharges, gstPercent)
                        setTotalFreightCharges(total)
                      }}
                    />
                  )}
                />
              </FormControl>
            </Grid>

            {/* GST Input */}
            <Grid
              item
              size={{ xs: 12, sm: 4, md: 4, lg: 4 }}
              sx={{
                mt: showFreight ? '16px' : 0,
                height: showFreight ? 'auto' : 0,
                opacity: showFreight ? 1 : 0,
                visibility: showFreight ? 'visible' : 'hidden',
                transition: 'height 0.3s ease, opacity 0.3s ease, visibility 0.3s ease'
              }}
            >
              <FormControl fullWidth>
                <Controller
                  name='freight_gst'
                  control={control}
                  rules={{ required: true }}
                  defaultValue=''
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type='text'
                      name='freight_gst'
                      // disabled={id ? true : false}
                      label='GST %'
                      onChange={e => {
                        field.onChange(e) // Update form state
                        const gstPercent = e.target.value
                        const freightCharges = getValues('freight_charges')
                        const total = calculateFreightChargesWithGst(freightCharges, gstPercent)
                        setTotalFreightCharges(total)
                      }}
                    />
                  )}
                />
              </FormControl>
            </Grid>

            <Grid
              item
              size={{ xs: 12, sm: 4, md: 4, lg: 4 }}
              sx={{
                mt: showFreight ? '16px' : 0,
                height: showFreight ? 'auto' : 0,
                opacity: showFreight ? 1 : 0,
                visibility: showFreight ? 'visible' : 'hidden',
                transition: 'height 0.3s ease, opacity 0.3s ease, visibility 0.3s ease'
              }}
            >
              <Box
                sx={{
                  bgcolor: theme.palette.neutral05,
                  p: '16px',
                  bgcolor: theme.palette.customColors.neutral05,
                  borderRadius: '8px'
                }}
              >
                <Typography sx={{ fontSize: '16px', fontWeight: 400 }}>
                  Total fright charge - {totalFreightCharges?.toFixed(2)}
                </Typography>
              </Box>
            </Grid>

            <Grid item size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
              <Divider />
            </Grid>

            <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
              <FormControl fullWidth>
                <Controller
                  name='additional_charges'
                  control={control}
                  rules={{ required: true }}
                  defaultValue=''
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type='text'
                      name='additional_charges'
                      // disabled={id ? true : false}
                      // error={Boolean(errors.additional_charges)}
                      label='Additional Charges'
                      onChange={e => {
                        const value = e.target.value

                        // Check if the value is numeric
                        if (/^\d*\.?\d*$/.test(value)) {
                          field.onChange(e) // Update form state with react-hook-form
                          setAdditionalCharges(value) // Update local state with numeric value
                        }
                      }}
                    />
                  )}
                />
              </FormControl>
            </Grid>

            <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
              <FormControl fullWidth>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* Dropdown for "+" or "-" */}
                  <FormControl size='small' sx={{ width: '70px', height: '56px' }}>
                    <Select
                      labelId='roundup_select'
                      value={roundup_select}
                      sx={{
                        width: '100%',
                        height: '56px',
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        bgcolor: theme.palette.customColors.neutral05,
                        color: theme.palette.customColors.OnPrimaryContainer, // Text value color
                        '& .MuiSelect-icon': {
                          color: theme.palette.customColors.OnPrimaryContainer // Dropdown icon color
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderRight: '0' // Default: no right border
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderRight: '1px solid', // Show right border on hover
                          borderColor: theme.palette.primary.main // Color of the border
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderRight: '2px solid', // Show right border on focus
                          borderColor: theme.palette.primary.main // Color of the border when focused
                        }
                      }}
                      onChange={handleRoundupChange}
                    >
                      <MenuItem value='+'>
                        <Typography
                          sx={{
                            fontSize: '24px',
                            // fontWeight: 500,
                            mt: -1,
                            color: theme.palette.customColors.OnPrimaryContainer
                          }}
                        >
                          +
                        </Typography>
                      </MenuItem>
                      <MenuItem value='-'>
                        <Typography
                          sx={{
                            fontSize: '24px',
                            // fontWeight: 500,
                            mt: -1,
                            color: theme.palette.customColors.OnPrimaryContainer
                          }}
                        >
                          -
                        </Typography>
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {/* TextField for Roundup Value */}
                  <Controller
                    name='round_off'
                    control={control}
                    rules={{ required: true }}
                    defaultValue=''
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type='text'
                        name='round_off'
                        label='Roundup Value'
                        fullWidth
                        onChange={e => {
                          const value = e.target.value

                          // Check if the value is numeric
                          if (/^\d*\.?\d*$/.test(value)) {
                            field.onChange(e) // Update form state with react-hook-form
                            setRoundUpValue(e.target.value) // Update local state with numeric value
                          }
                        }}
                        InputProps={{
                          sx: {
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0
                          }
                        }}
                      />
                    )}
                  />
                </Box>
              </FormControl>
            </Grid>

            <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
              <FormControl fullWidth>
                <Controller
                  name='description'
                  control={control}
                  defaultValue=''
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Comment'
                      // onChange={e => {
                      //   setEditParams({
                      //     ...editParams,
                      //     description: e.target.value
                      //   })
                      //   setErrors({})
                      // }}
                    />
                  )}
                />
                {errors.description && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
        <Divider sx={{ mx: '20px' }} />
        <CardContent>
          <Grid container>
            <Grid
              item
              size={{ xs: 12, sm: 12 }}
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center'
              }}
            >
              <AddButton
                title='Add Inventory Item'
                action={() => {
                  handlePurchaseSubmit()
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
        {validateErrorForItemId() && (
          <Typography sx={{ color: 'error.main', mx: 6, mb: 2 }}>
            Kindly review all invoice entries carefully before saving the purchase.
          </Typography>
        )}
        <Box
          sx={{
            mx: '20px',
            borderRadius: '8px',
            border: '1px solid',
            borderColor: theme?.palette?.customColors?.lightBg
          }}
        >
          <TableContainer sx={{ borderRadius: '8px' }}>
            <Table
              stickyHeader
              sx={{
                minWidth: 650,
                overflowX: 'scroll',
                '& .MuiTableHead-root': {
                  '& th:first-of-type': {
                    borderTopLeftRadius: '8px' // Top-left corner for the first column
                  },
                  '& th:last-of-type': {
                    borderTopRightRadius: '8px' // Top-right corner for the last column
                  }
                },
                '& .MuiTableCell-root': {
                  borderBottom: 'none' // Remove cell borders for a clean look
                }
              }}
              aria-label='simple table'
            >
              <TableHead sx={{ backgroundColor: '#F5F5F7' }}>
                <TableRow>
                  <TableCell
                    sx={{
                      minWidth: 20
                    }}
                  >
                    S.No
                  </TableCell>
                  <TableCell
                    sx={{
                      minWidth: 300
                    }}
                  >
                    Product Name
                  </TableCell>

                  <TableCell>Batch</TableCell>
                  <TableCell
                    sx={{
                      minWidth: 130,
                      textAlign: 'center'
                    }}
                  >
                    Expiry Date
                  </TableCell>
                  <TableCell align='right'>Quantity</TableCell>
                  {/* <TableCell align='right'>Free Quantity</TableCell> */}
                  <TableCell align='right'>Rate</TableCell>
                  <TableCell
                    align='right'
                    sx={{
                      minWidth: 130
                    }}
                  >
                    Discount in %
                  </TableCell>
                  {/* <TableCell align='right'>GST in %</TableCell> */}
                  <TableCell
                    align='right'
                    sx={{
                      minWidth: 130
                    }}
                  >
                    Net Amount
                  </TableCell>
                  <TableCell
                    align='right'
                    sx={{
                      minWidth: 130,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Gross Amount
                  </TableCell>
                  <TableCell
                    sx={{
                      minWidth: 130,
                      textAlign: 'center'
                    }}
                  >
                    CGST
                    <Grid container>
                      <Grid item size={{ xs: 6 }}>
                        Rate
                      </Grid>
                      <Grid item size={{ xs: 6 }}>
                        Amount
                      </Grid>
                    </Grid>
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: 'center',
                      minWidth: 130
                    }}
                  >
                    SGST
                    <Grid container>
                      <Grid item size={{ xs: 6 }}>
                        Rate
                      </Grid>
                      <Grid item size={{ xs: 6 }}>
                        Amount
                      </Grid>
                    </Grid>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', minWidth: 130 }}>
                    IGST
                    <Grid container>
                      <Grid item size={{ xs: 6 }}>
                        Rate
                      </Grid>
                      <Grid item size={{ xs: 6 }}>
                        Amount
                      </Grid>
                    </Grid>
                  </TableCell>
                  <TableCell align='right'>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editParams?.purchase_details
                  ? editParams?.purchase_details.map((el, index) => {
                      return (
                        <TableRow key={index} sx={{ overflowX: 'scroll' }}>
                          <TableCell>
                            <Typography variant='body2'>{index + 1}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              sx={{ color: (!el?.purchase_stock_item_id || !el?.medicine_name) && 'error.main' }}
                            >
                              {el?.medicine_name}
                            </Typography>

                            <Typography variant='body2'>{el?.package_details}</Typography>

                            <Typography variant='body2'>{el?.manufacture}</Typography>
                            {/* {(!el?.purchase_stock_item_id || !el?.medicine_name) && (
                              <Typography sx={{ color: 'error.main', fontSize: '12px' }}>
                                Some product information appears to be missing. Kindly update the details.
                              </Typography>
                            )} */}
                          </TableCell>
                          <TableCell>{el?.purchase_batch_no}</TableCell>
                          <TableCell>
                            {el?.stock_type === 'non_medical'
                              ? 'NA'
                              : Utility.formatDisplayDate(el?.purchase_expiry_date)}
                          </TableCell>
                          <TableCell align='right'>{el?.purchase_qty}</TableCell>
                          {/* <TableCell align='right'>{el.purchase_free_quantity}</TableCell> */}
                          <TableCell align='right'>{el?.purchase_unit_price}</TableCell>
                          <TableCell align='right'>{el?.purchase_discount}%</TableCell>
                          {/* <TableCell align='right'>{el.purchase_igst}%</TableCell> */}
                          <TableCell align='right'>{el?.purchase_net_amount}</TableCell>
                          <TableCell align='right'>{el?.purchase_gross_amount}</TableCell>
                          <TableCell>
                            <TableCell sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}>
                              {el?.purchase_cgst}%
                            </TableCell>
                            <TableCell sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}>
                              {el?.purchase_cgst_amount}
                            </TableCell>
                          </TableCell>
                          <TableCell>
                            <TableCell sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}>
                              {el?.purchase_sgst}%
                            </TableCell>
                            <TableCell sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}>
                              {el?.purchase_sgst_amount}
                            </TableCell>
                          </TableCell>{' '}
                          <TableCell>
                            <TableCell sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}>
                              {el?.purchase_igst}%
                            </TableCell>
                            <TableCell sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}>
                              {el?.purchase_igst_amount}
                            </TableCell>
                          </TableCell>
                          <TableCell align='center'>
                            <Box sx={{ display: 'flex' }}>
                              <IconButton
                                size='small'
                                sx={{ mr: 0.5 }}
                                aria-label='Edit'
                                onClick={() => {
                                  // setMedicineItemId(el.purchase_unit_id || el?.uid)
                                  setMedicineItemId(el?.uid)
                                  // editTableData(el?.purchase_unit_id, index, el?.purchase_batch_no, el?.medicine_name)
                                  editTableData(el?.uid, index, el?.purchase_batch_no, el?.medicine_name)
                                  showDialog()
                                }}
                              >
                                <Icon icon='mdi:pencil-outline' />
                              </IconButton>

                              {id && el.id ? null : (
                                <IconButton
                                  onClick={() => {
                                    // removeItemsFroTable(el.purchase_unit_id)
                                    removeItemsFroTable(el?.uid)
                                  }}
                                  size='small'
                                  sx={{ mr: 0.5 }}
                                >
                                  <Icon icon='mdi:delete-outline' />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Grid item size={{ xs: 6 }}>
          {/* {totalQty ? ( */}
          <Grid container>
            <Grid
              item
              size={{ xs: 12, sm: 7, lg: 4, md: 5 }}
              sx={{
                mb: { sm: 0, xs: 4 },
                mt: { xs: 4 },
                order: { sm: 2, xs: 1 },
                marginLeft: 'auto',
                mr: { sm: 12, xs: 0 }
              }}
            >
              {/* <Card>
                <CardContent sx={{ pt: 8 }}>
                  <CalcWrapper>
                    <Typography variant='body2'>Total Amount :</Typography>
                    <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                      {totalLineItemsAmount ? totalLineItemsAmount?.toFixed(2) : 0.0}
                    </Typography>
                  </CalcWrapper>
                  <Divider
                    sx={{
                      mt: theme => `${theme.spacing(5)} !important`,
                      mb: theme => `${theme.spacing(3)} !important`
                    }}
                  />
                  <CalcWrapper>
                    <Typography variant='body2'>Discount :</Typography>
                    <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                      {totalLineItemsDiscount?.toFixed(2)}
                    </Typography>
                  </CalcWrapper>
                  <Divider
                    sx={{
                      mt: theme => `${theme.spacing(5)} !important`,
                      mb: theme => `${theme.spacing(3)} !important`
                    }}
                  />
                  <CalcWrapper>
                    <Typography variant='body2'>CGST :</Typography>
                    <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                      {calculate_cgst_tax_amount?.toFixed(2)}
                    </Typography>
                  </CalcWrapper>
                  <CalcWrapper>
                    <Typography variant='body2'>SGST :</Typography>
                    <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                      {calculate_sgst_tax_amount?.toFixed(2)}
                    </Typography>
                  </CalcWrapper>
                  <CalcWrapper>
                    <Typography variant='body2'>IGST :</Typography>
                    <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                      {calculate_igst_tax_amount?.toFixed(2)}
                    </Typography>
                  </CalcWrapper>
                  <Divider
                    sx={{
                      mt: theme => `${theme.spacing(5)} !important`,
                      mb: theme => `${theme.spacing(3)} !important`
                    }}
                  />

                  {/* <CalcWrapper>
                  <Grid container sx={{ display: 'flex', justifyContent: 'space-between' }} spacing={2}>
                    <Grid item size={{xs: 12, sm: 6}}>
                      <FormControl fullWidth>
                        <InputLabel>Discount</InputLabel>
                        <Select
                          label='Discount'
                          value={editParams.discount_type}
                          onChange={event => {
                            setEditParams({ ...editParams, discount_type: event.target.value, discount_amount: '' })
                            setErrors({})
                          }}
                        >
                          <MenuItem value='P'>%</MenuItem>
                          <MenuItem value='F'>₹</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item size={{xs: 12, sm: 6}}>
                      <FormControl fullWidth>
                        <TextField
                          type='text'
                          value={
                            editParams.discount_type === 'P'
                              ? editParams.discount_percentage
                              : editParams.discount_amount
                          }
                          label='Discount'
                          onChange={event => {
                            const val = event.target.value

                            calculateFinalAmount(val)
                            setErrors({})
                            setValidateDiscount('')
                          }}
                        />
                      </FormControl>
                      {validateDiscount && (
                        <FormHelperText sx={{ color: 'error.main', mx: 2 }} id='validation-basic-first-name'>
                          This is required
                        </FormHelperText>
                      )}
                    </Grid>
                  </Grid>
                </CalcWrapper>
                <Divider
                  sx={{ mt: theme => `${theme.spacing(3)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
                />
                  <CalcWrapper>
                    <Typography variant='body2'>Grand Total :</Typography>
                    <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                      {totalLineItemsPurchase?.toFixed(2)}
                    </Typography>
                  </CalcWrapper>

                  {/* <Divider
                  sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
                />
                </CardContent>
              </Card> */}

              <Card sx={{ padding: '20px', m: '20px' }}>
                <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Image src={TotalAmountIcon} alt='Icon' style={{ width: 18, height: 18 }} />
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 500, color: theme?.palette?.customColors?.OnSurfaceVariant }}
                  >
                    Amount Summary
                  </Typography>
                </Box>
                <Divider sx={{ py: 1 }} />
                <Box
                  sx={{
                    border: '0.1px solid #C3CEC7',
                    borderColor: theme?.palette?.customColors?.OutlineVariant,
                    borderRadius: '8px',
                    mt: 3
                  }}
                >
                  <Box
                    sx={{
                      p: '12px',

                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1px'
                    }}
                  >
                    <CalcWrapper>
                      <Typography variant='body2'>Total Amount :</Typography>
                      <Typography
                        variant='body2'
                        sx={{
                          color: 'text.primary',
                          letterSpacing: '.25px',
                          fontWeight: 600,
                          alignItems: 'center',
                          display: ' flex'
                        }}
                      >
                        <Icon icon='mdi:rupee' width='15px' height='15px' />
                        {totalLineItemsAmount ? totalLineItemsAmount?.toFixed(2) : 0.0}
                      </Typography>
                    </CalcWrapper>
                    <Divider sx={{ mb: 1.5 }} />

                    <CalcWrapper>
                      <Typography variant='body2'>Total Fright Charges :</Typography>
                      <Typography
                        variant='body2'
                        sx={{
                          color: 'text.primary',
                          letterSpacing: '.25px',
                          fontWeight: 600,
                          alignItems: 'center',
                          display: ' flex'
                        }}
                      >
                        <Icon icon='mdi:rupee' width='15px' height='15px' />
                        {totalFreightCharges ? totalFreightCharges?.toFixed(2) : 0.0}
                      </Typography>
                    </CalcWrapper>
                    <CalcWrapper>
                      <Typography variant='body2'>Additional Charges :</Typography>
                      <Typography
                        variant='body2'
                        sx={{
                          color: 'text.primary',
                          letterSpacing: '.25px',
                          fontWeight: 600,
                          alignItems: 'center',
                          display: ' flex'
                        }}
                      >
                        <Icon icon='mdi:rupee' width='15px' height='15px' />
                        {additionalCharges ? Number(additionalCharges).toFixed(2) : 0.0}
                      </Typography>
                    </CalcWrapper>
                    <Divider sx={{ mb: 1.5 }} />
                    <CalcWrapper>
                      <Typography variant='body2'>CGST :</Typography>
                      <Typography
                        variant='body2'
                        sx={{
                          color: 'text.primary',
                          letterSpacing: '.25px',
                          fontWeight: 600,
                          alignItems: 'center',
                          display: ' flex'
                        }}
                      >
                        <Icon icon='mdi:rupee' width='15px' height='15px' />
                        {calculate_cgst_tax_amount?.toFixed(2)}
                      </Typography>
                    </CalcWrapper>
                    <CalcWrapper>
                      <Typography variant='body2'>SGST :</Typography>
                      <Typography
                        variant='body2'
                        sx={{
                          color: 'text.primary',
                          letterSpacing: '.25px',
                          fontWeight: 600,
                          alignItems: 'center',
                          display: ' flex'
                        }}
                      >
                        <Icon icon='mdi:rupee' width='15px' height='15px' />
                        {calculate_sgst_tax_amount?.toFixed(2)}
                      </Typography>
                    </CalcWrapper>
                    <CalcWrapper>
                      <Typography variant='body2'>IGST :</Typography>
                      <Typography
                        variant='body2'
                        sx={{
                          color: 'text.primary',
                          letterSpacing: '.25px',
                          fontWeight: 600,
                          alignItems: 'center',
                          display: ' flex'
                        }}
                      >
                        <Icon icon='mdi:rupee' width='15px' height='15px' />
                        {calculate_igst_tax_amount?.toFixed(2)}
                      </Typography>
                    </CalcWrapper>
                    <Divider sx={{ mb: 1.5 }} />

                    <CalcWrapper>
                      <Typography variant='body2'>Discount :</Typography>
                      <Typography
                        variant='body2'
                        sx={{
                          color: theme?.palette?.customColors?.customDropdownColor,
                          letterSpacing: '.25px',
                          fontWeight: 600
                        }}
                      >
                        - {totalLineItemsDiscount?.toFixed(2)}
                      </Typography>
                    </CalcWrapper>
                    <CalcWrapper>
                      <Typography variant='body2'>Roundup Value :</Typography>

                      {roundup_select === '+' ? (
                        <Typography
                          variant='body2'
                          sx={{
                            color: theme?.palette?.primary?.main,
                            letterSpacing: '.25px',
                            fontWeight: 600
                          }}
                        >
                          + {Number(roundUpValue)?.toFixed(2)}
                        </Typography>
                      ) : (
                        <Typography
                          variant='body2'
                          sx={{
                            color: theme?.palette?.customColors?.customDropdownColor,
                            letterSpacing: '.25px',
                            fontWeight: 600
                          }}
                        >
                          - {Number(roundUpValue)?.toFixed(2)}
                        </Typography>
                      )}
                    </CalcWrapper>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: theme?.palette?.customColors?.neutral05,
                      borderBottomLeftRadius: '7px',
                      borderBottomRightRadius: '7px',
                      borderTop: '0.2px solid',
                      borderColor: theme?.palette?.customColors?.OutlineVariant,
                      p: '12px'
                    }}
                  >
                    <CalcWrapper>
                      <Typography
                        variant='body2'
                        sx={{
                          color: theme?.palette?.customColors?.OnSurfaceVariant,
                          letterSpacing: '.25px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          mr: 2
                        }}
                      >
                        Grand Total :
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{
                          color: theme?.palette?.customColors?.OnSurfaceVariant,
                          letterSpacing: '.25px',
                          fontWeight: 600
                        }}
                      >
                        {/* {totalLineItemsPurchase?.toFixed(2)} */}
                        {/* {grandTotalAmount ? grandTotalAmount?.toFixed(2) : 0.0} */}
                        {showAmount && grandTotalAmount?.toFixed(2)}
                      </Typography>
                      {/* {/* Input Box with Icon */}

                      {/* <TextField
                        variant='outlined'
                        fullWidth
                        size='small'
                        placeholder='Enter value'
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'white',
                            borderRadius: '4px',
                            '& fieldset': {
                              borderColor: isError ? 'red' : 'grey.300'
                            },
                            '&:hover fieldset': {
                              borderColor: isError ? 'red' : 'grey.500'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: isError ? 'red' : 'primary.main'
                            }
                          }
                        }}
                        inputProps={{
                          style: { textAlign: 'right' } // Aligns text and placeholder to the right
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <IconButton edge='start'>
                                <Icon icon='mdi:rupee' width='15px' height='15px' color='#000' />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                        error={isError} // Highlights the field in red if there's an error
                      /> */}
                    </CalcWrapper>
                    <CalcWrapper>
                      <Typography
                        variant='body2'
                        sx={{
                          color: theme?.palette?.customColors?.OnSurfaceVariant,
                          letterSpacing: '.25px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          mr: 2
                        }}
                      >
                        Invoice Total :
                      </Typography>
                      {/* <Typography
                        variant='body2'
                        sx={{
                          color: theme?.palette?.customColors?.OnSurfaceVariant,
                          letterSpacing: '.25px',
                          fontWeight: 600
                        }}
                      >
                        // {/* {totalLineItemsPurchase?.toFixed(2)}
                        {grandTotalAmount ? grandTotalAmount?.toFixed(2) : 0.0}
                      </Typography> */}
                      {/* Input Box with Icon */}

                      <TextField
                        variant='outlined'
                        fullWidth
                        size='small'
                        placeholder='Enter value'
                        value={inputValue}
                        onBlur={validateAndShowAmount}
                        onChange={e => {
                          // Restrict non-numeric inputs and update value
                          const value = e.target.value
                          if (/^\d*\.?\d*$/.test(value)) {
                            setInputValue(value)
                          }
                        }}
                        sx={{
                          maxWidth: '150px',
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'white',
                            borderRadius: '4px',
                            '& fieldset': {
                              borderColor: isError ? 'red' : 'grey.300'
                            },
                            '&:hover fieldset': {
                              borderColor: isError ? 'red' : 'grey.500'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: isError ? 'red' : 'primary.main'
                            }
                          }
                        }}
                        inputProps={{
                          style: { textAlign: 'right' } // Aligns text and placeholder to the right
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <IconButton edge='start'>
                                <Icon icon='mdi:rupee' width='15px' height='15px' color='#000' />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                        error={isError} // Highlights the field in red if there's an error
                      />
                    </CalcWrapper>
                  </Box>
                </Box>
                <Box sx={{ mt: 1 }}>
                  {isError && (
                    <Typography variant='caption' sx={{ fontSize: '12px', fontWeight: 400 }} color='error'>
                      Invoice value does not match system calculated total. Kindly check your entries.
                    </Typography>
                  )}
                  <Typography sx={{ mt: 1 }}>
                    *Grand Total, inclusive of the total amount for all products, along with applicable GST.
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
          {/* // ) : null} */}
        </Grid>

        <Grid item size={{ xs: 12 }}>
          <Box sx={{ float: 'right', my: 4, mx: 6 }}>
            <LoadingButton
              // disabled={editParams.purchase_details.length > 0 && inputValue ? false : true}
              disabled={
                editParams?.purchase_details?.length > 0 && inputValue && !isError && !validateErrorForItemId()
                  ? false
                  : true
              }
              sx={{ marginRight: '8px' }}
              size='large'
              type='submit'
              // onClick={() => {
              //   postItemsData()
              // }}
              variant='contained'
              loading={submitLoader}
            >
              Save
            </LoadingButton>
            {id ? null : (
              <Button
                onClick={() => {
                  reset(editParamsInitialState)
                  setEditParams(editParamsInitialState)
                }}
                size='large'
                variant='outlined'
              >
                Reset
              </Button>
            )}
          </Box>
        </Grid>
      </form>
      <CardContent>
        <Grid container>
          <CommonDialogBox
            title={'Add Inventory Item'}
            dialogBoxStatus={show}
            formComponent={createForm()}
            close={closeDialog}
            show={showDialog}
          />
        </Grid>
        <CommonDialogBox
          title={'Add Supplier'}
          dialogBoxStatus={supplierDialog}
          formComponent={
            <AddSupplier
              closeSupplierDialog={() => {
                closeSupplierDialog()
              }}
              supplierDialog={supplierDialog}
            />
          }
          close={() => {
            setSupplierDialog(false)
          }}
          show={() => {
            setSupplierDialog(true)
          }}
        />
        {/* Docs drawer */}
      </CardContent>
      {openDocsDrawer && (
        <PurchaseDocsDrawer
          openDocsDrawer={openDocsDrawer}
          invoiceFile={fileSrc}
          fileArr={fileArr}
          confirmDeleteDialog={confirmDeleteDialog}
          setConfirmDeleteDialog={setConfirmDeleteDialog}
          removeSelectedImage={removeSelectedImage}
          setOpenDocsDrawer={setOpenDocsDrawer}
          deleteId={deleteId}
          setDeleteId={setDeleteId}
          setDeleteLoader={setDeleteLoader}
          deleteLoader={deleteLoader}
        />
      )}
      <CommonDialogBox
        loader={invoiceSubmitLoader}
        // dialogWithMaxWidth={true}
        title={
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '20px',
              margin: '0px',
              padding: '0px',
              color: 'customColors.OnSurfaceVariant',
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              py: 2,
              borderBottom: '1px solid',
              borderColor: theme => alpha(theme.palette.customColors.neutral05, 0.05)
            }}
          >
            Attach Invoice
          </Typography>
        }
        dialogBoxStatus={invoiceUploadDialog}
        formComponent={
          <PurchaseInvoiceUpload
            variantLists={variantLists}
            setPurchaseItems={setEditParams}
            reset={reset}
            closeDialog={() => {
              setInvoiceUploadDialog(false)
            }}
            handleInputImageChange={handleInputImageChange}
            invoiceSubmitLoader={invoiceSubmitLoader}
            setInvoiceSubmitLoader={setInvoiceSubmitLoader}
          />
        }
        close={() => {
          setInvoiceUploadDialog(false)
        }}
        show={() => {
          setInvoiceUploadDialog(true)
        }}
      />
    </Card>
  )
}

export default AddPurchaseForm
