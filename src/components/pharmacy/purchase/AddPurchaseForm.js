/* eslint-disable lines-around-comment */
// ** React Imports
import { forwardRef, useState, useEffect, useCallback, useRef, useMemo } from 'react'
// ** MUI Imports
import { styled, useTheme } from '@mui/material/styles'
import Router from 'next/router'
import {
  Grid,
  Card,
  Divider,
  Typography,
  Box,
  CardContent,
  Button,
  InputAdornment,
  alpha,
  IconButton,
  FormHelperText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import { debounce, flatMap } from 'lodash'

import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
// ** Icon Imports
import Icon from 'src/@core/components/icon'
// import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { getSuppliers, getSuppliersByParams } from 'src/lib/api/pharmacy/getSupplierList'
import { getMedicineList } from 'src/lib/api/pharmacy/getMedicineList'
import {
  addPurchase,
  getPurchaseListById,
  updatePurchase,
  updatePurchasePrice,
  getBatchExpiry,
  validatePurchaseProducts,
  postDeleteInvoiceById,
  productMappingForMlTraining,
  printPurchaseInvoice,
  createPurchase
} from 'src/lib/api/pharmacy/getPurchaseList'
import CommonDialogBox from 'src/components/CommonDialogBox'
import SingleDatePicker from '../../SingleDatePicker'
import Utility, { downloadPDF } from 'src/utility'
import { AddButton } from 'src/components/Buttons'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
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
import { getVariantFOrProduct, getVariants } from 'src/lib/api/pharmacy/variant'
import PurchaseInvoiceUpload from './PurchaseInvoiceUpload'
import { v4 as uuidv4 } from 'uuid'
import { ExportButton } from 'src/views/utility/render-snippets'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import PurchaseDetailsTable from './PurchaseDetailsTable'
import { tr } from 'date-fns/locale'
const CalcWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '&:not(:last-of-type)': {
    marginBottom: theme.spacing(2)
  }
}))

const CalcRow = ({ label, value, showRupee = true, prefix, valueSx = {} }) => (
  <CalcWrapper>
    <Typography variant='body2'>{label}</Typography>
    <Typography
      variant='body2'
      sx={{
        color: 'text.primary',
        letterSpacing: '.25px',
        fontWeight: 600,
        alignItems: 'center',
        display: 'flex',
        ...valueSx
      }}
    >
      {prefix && `${prefix} `}
      {showRupee && <Icon icon='mdi:rupee' width='15px' height='15px' />}
      {value}
    </Typography>
  </CalcWrapper>
)

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

  const freightVisibilitySx = {
    mt: showFreight ? '16px' : 0,
    height: showFreight ? 'auto' : 0,
    opacity: showFreight ? 1 : 0,
    visibility: showFreight ? 'visible' : 'hidden',
    transition: 'height 0.3s ease, opacity 0.3s ease, visibility 0.3s ease'
  }

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
  const [invoicePrintLoader, setInvoicePrintLoader] = useState(false)

  const resetFelids = () => {
    reset(editParamsInitialState)
    setEditParams(editParamsInitialState)
    setFileArr([])
    setInputValue('')
    setTotalFreightCharges(0)
    setAdditionalCharges(0)
    setFileSrc('')
    setRoundUpValue('')
  }

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
      roundUp = -parseFloat(roundUpValue) || 0
    } else {
      roundUp = parseFloat(roundUpValue) || 0
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

  const addItemsToTable = payload => {
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

  const submitItems = payload => {
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

    try {
      if (id) {
        postData.antz_pharmacy_purchase_id = id
        // const response = await updatePurchase(id, postData)
        var payloadData = { ...postData }
        payloadData.purchase_details = JSON.stringify(payloadData?.purchase_details)
        const response = await updatePurchasePrice(id, payloadData)

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
        var payloadData = { ...postData }
        payloadData.purchase_details = JSON.stringify(payloadData.purchase_details)
        // const response = await addPurchase(payloadData)
        const response = await createPurchase(payloadData)

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

            try {
              const mlResult = await productMappingForMlTraining(suggestionData)
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
          }
        }
      }
    } catch (error) {
      console.log('error', error)
    } finally {
      setSubmitLoader(false)
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
  }

  const getSuppliersLists = async () => {
    const params = { status: 1 }
    try {
      // const response = await getSuppliers({})
      const response = await getSuppliersByParams({ params: params })

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
          purchase_expiry_date:
            response?.data?.expiry_date && response?.data?.expiry_date !== '0000-00-00'
              ? Utility.formatDate(response.data.expiry_date)
              : null,
          purchase_variant_id: response?.data?.variant_id,
          purchase_variant_ratio: response?.data?.multiplier,
          isVariantIdPresent: response?.data?.variant_id && response?.data?.multiplier ? true : false
        }))

        setProductExpiryDate(
          response?.data?.expiry_date && response?.data?.expiry_date !== '0000-00-00' ? response.data.expiry_date : null
        )
      } else {
        setNestedRowMedicine(prevState => ({
          ...prevState,
          purchase_expiry_date: '',
          purchase_variant_id: '',
          purchase_variant_ratio: ''
        }))
        setProductExpiryDate('')
      }
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
    try {
      const productVariant = await getVariantFOrProduct(productId)

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
    } catch (error) {
      console.log('error', error)
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
            // purchase_expiry_date: el?.stock_type === 'non_medical' ? null : el?.purchase_expiry_date, // old code in new non-medical items also may have a expiry date
            purchase_expiry_date:
              el?.purchase_expiry_date && el?.purchase_expiry_date !== '0000-00-00' ? el?.purchase_expiry_date : null,
            purchase_variant_id: el?.purchase_variant_id,
            purchase_variant_ratio: el?.unit_multiplier,
            purchase_unit_qty: el?.purchase_total_qty ? el?.purchase_total_qty : el?.purchase_qty,
            isVariantIdPresent: el?.purchase_variant_id && el?.unit_multiplier ? true : false
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
        // purchase_expiry_date:
        //   getItems[0]?.stock_type === 'non_medical' ? null : moment(getItems[0]?.purchase_expiry_date),
        purchase_expiry_date: getItems[0]?.purchase_expiry_date ? moment(getItems[0]?.purchase_expiry_date) : null,
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
        // purchase_expiry_date:
        //   getItems[0]?.stock_type === 'non_medical' ? null : moment(getItems[0]?.purchase_expiry_date),
        purchase_expiry_date:
          getItems[0]?.purchase_expiry_date && getItems[0]?.purchase_expiry_date !== '0000-00-00'
            ? moment(getItems[0]?.purchase_expiry_date)
            : null,

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

  // Function to calculate total freight charges including GST
  const calculateFreightChargesWithGst = (freightCharges, gstPercent) => {
    const numericFreight = parseFloat(freightCharges) || 0
    const numericGst = parseFloat(gstPercent) || 0

    return numericFreight + (numericFreight * numericGst) / 100
  }

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

  // delete api function.

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

  const printInventory = async purchaseId => {
    try {
      setInvoicePrintLoader(true)
      await downloadPDF({
        apiCall: printPurchaseInvoice,
        params: purchaseId,
        fileName: `Purchase_Invoice${Date.now()}.pdf`
      })
    } catch (error) {
      toast.error(error?.message)
      setInvoicePrintLoader(false)
    } finally {
      setInvoicePrintLoader(false)
    }
  }

  return (
    <PageCardLayout
      showIcon={true}
      onIconClick={() => {
        if (navigatedFrom === 'stockReport') {
          Router.push('/pharmacy/stocks/stocksReport/')
        } else {
          Router.back()
        }
      }}
      title={id ? 'Edit Inventory ' : 'Add Inventory'}
      titleStyles={{
        fontSize: '20px'
      }}
      action={
        <Grid container spacing={{ xs: 3, sm: 0 }}>
          {authData?.userData?.roles?.settings?.add_pharmacy && !id && (
            <Grid size={{ xs: 12, sm: 'auto' }}>
              <AddButton
                title='Process Invoice'
                action={() => {
                  resetFelids()
                  setInvoiceUploadDialog(true)
                }}
                styles={{
                  margin: 0,
                  width: '100%'
                }}
              />
            </Grid>
          )}

          {authData?.userData?.roles?.settings?.add_pharmacy && (
            <>
              <Grid size={{ xs: 12, sm: 'auto' }} sx={{ ml: { xs: 0, sm: 3 } }}>
                <AddButton
                  title='Add Supplier'
                  action={() => {
                    setSupplierDialog(true)
                  }}
                  styles={{
                    margin: 0,
                    width: '100%'
                  }}
                />
              </Grid>
              <Grid>
                {id && (
                  <ExportButton
                    tooltip='Download  Invoice'
                    loading={invoicePrintLoader}
                    onClick={() => printInventory(id)}
                    sx={{ ml: 3 }}
                  />
                )}
              </Grid>
            </>
          )}
        </Grid>
      }
    >
      <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
        <Divider sx={{ mb: '16px', mt: -2 }} />
        <Typography sx={{ fontSize: '16px', fontWeight: 500, mb: '16px' }}>Supplier Details</Typography>
        <Grid container spacing={5}>
          <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
            <ControlledSelect
              control={control}
              name='supplier_id'
              errors={errors}
              label='Supplier*'
              options={suppliers}
              getOptionLabel={option => option.company_name}
              getOptionValue={option => option.id}
            />
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
                      console.log('date', date)
                      let formatted = formatDate(date)
                      console.log('formatted date', formatted)
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
            <ControlledTextField
              name='po_no'
              label='Purchase Invoice Number*'
              control={control}
              errors={errors}
              disabled={id ? true : false}
            />
          </Grid>

          <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
            <ControlledTextField
              name='purchase_order_no'
              label='Purchase order number'
              control={control}
              errors={errors}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
            <ControlledTextField name='requested_by' label='Requested by' control={control} errors={errors} />
          </Grid>

          {/* Upload Docs */}
          <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
            <Box sx={{ display: 'flex', gap: '12px' }}>
              <Box sx={{ width: '100%' }}>
                <input
                  type='file'
                  accept='.png,.jpg,.jpeg,.pdf,.xls,.xlsx'
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
              // margineTop={-2}
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

          <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }} sx={freightVisibilitySx}>
            <ControlledTextField
              name='freight_charges'
              label='Freight Charges'
              control={control}
              errors={errors}
              onChangeOverride={e => {
                const freightCharges = e.target.value
                const gstPercent = getValues('freight_gst')
                const total = calculateFreightChargesWithGst(freightCharges, gstPercent)
                setTotalFreightCharges(total)
              }}
            />
          </Grid>

          {/* GST Input */}
          <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }} sx={freightVisibilitySx}>
            <ControlledTextField
              name='freight_gst'
              label='GST %'
              control={control}
              errors={errors}
              onChangeOverride={e => {
                const gstPercent = e.target.value
                const freightCharges = getValues('freight_charges')
                const total = calculateFreightChargesWithGst(freightCharges, gstPercent)
                setTotalFreightCharges(total)
              }}
            />
          </Grid>

          <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }} sx={freightVisibilitySx}>
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
                      slotProps={{
                        input: {
                          sx: {
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0
                          }
                        }
                      }}
                    />
                  )}
                />
              </Box>
            </FormControl>
          </Grid>

          <Grid item size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
            <ControlledTextField name='description' label='Comment' control={control} errors={errors} />
          </Grid>
        </Grid>
        <Divider
          sx={{
            my: '20px'
          }}
        />
        <Grid container sx={{ display: 'flex', py: 5, justifyContent: 'flex-end' }}>
          <Grid item size={{ xs: 12, sm: 'auto' }}>
            <AddButton
              title='Add Inventory Item'
              action={() => {
                handlePurchaseSubmit()
              }}
              styles={{
                margin: 0,
                width: '100%'
              }}
            />
          </Grid>
        </Grid>

        {editParams.purchase_created_by === 'invoice_upload' && (
          <Typography sx={{ color: 'error.main', mx: 6, mb: 2 }}>
            Kindly review all invoice entries carefully before saving the purchase.
          </Typography>
        )}
        <Box
          sx={{
            // mx: '20px',
            borderRadius: '8px',
            border: '1px solid',
            borderColor: theme?.palette?.customColors?.lightBg
          }}
        >
          <PurchaseDetailsTable
            purchaseDetails={editParams?.purchase_details}
            isEditMode={!!id}
            onEdit={(el, index) => {
              // setMedicineItemId(el.purchase_unit_id || el?.uid)
              setMedicineItemId(el?.uid)
              // editTableData(el?.purchase_unit_id, index, el?.purchase_batch_no, el?.medicine_name)
              editTableData(el?.uid, index, el?.purchase_batch_no, el?.medicine_name)
              showDialog()
            }}
            onDelete={uid => {
              // removeItemsFroTable(el.purchase_unit_id)
              removeItemsFroTable(uid)
            }}
          />
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
                    <CalcRow
                      label='Total Amount :'
                      value={totalLineItemsAmount ? totalLineItemsAmount?.toFixed(2) : 0.0}
                    />
                    <Divider sx={{ mb: 1.5 }} />

                    <CalcRow
                      label='Total Fright Charges :'
                      value={totalFreightCharges ? totalFreightCharges?.toFixed(2) : 0.0}
                    />
                    <CalcRow
                      label='Additional Charges :'
                      value={additionalCharges ? Number(additionalCharges).toFixed(2) : 0.0}
                    />
                    <Divider sx={{ mb: 1.5 }} />
                    <CalcRow label='CGST :' value={calculate_cgst_tax_amount?.toFixed(2)} />
                    <CalcRow label='SGST :' value={calculate_sgst_tax_amount?.toFixed(2)} />
                    <CalcRow label='IGST :' value={calculate_igst_tax_amount?.toFixed(2)} />
                    <Divider sx={{ mb: 1.5 }} />

                    <CalcRow
                      label='Discount :'
                      value={totalLineItemsDiscount?.toFixed(2)}
                      showRupee={false}
                      prefix='-'
                      valueSx={{ color: theme?.palette?.customColors?.customDropdownColor }}
                    />
                    <CalcRow
                      label='Roundup Value :'
                      value={Number(roundUpValue)?.toFixed(2)}
                      showRupee={false}
                      prefix={roundup_select === '+' ? '+' : '-'}
                      valueSx={{
                        color:
                          roundup_select === '+'
                            ? theme?.palette?.primary?.main
                            : theme?.palette?.customColors?.customDropdownColor
                      }}
                    />
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
                        // Highlights the field in red if there's an error
                        error={isError}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position='start'>
                                <IconButton edge='start'>
                                  <Icon icon='mdi:rupee' width='15px' height='15px' color='#000' />
                                </IconButton>
                              </InputAdornment>
                            )
                          },

                          htmlInput: {
                            style: { textAlign: 'right' } // Aligns text and placeholder to the right
                          }
                        }}
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
          <Box
            sx={{
              float: 'right',
              my: 4
            }}
          >
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
              <Button onClick={resetFelids} size='large' variant='outlined'>
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
    </PageCardLayout>
  )
}

export default AddPurchaseForm
