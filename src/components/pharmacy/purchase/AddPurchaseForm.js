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
import { Button, CardHeader } from '@mui/material'
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
import { debounce } from 'lodash'

import toast from 'react-hot-toast'

// ** React Imports
import { forwardRef, useState, useEffect, useCallback } from 'react'
// ** Icon Imports
import Icon from 'src/@core/components/icon'

// import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { getSuppliers } from 'src/lib/api/pharmacy/getSupplierList'
import { getMedicineList } from 'src/lib/api/pharmacy/getMedicineList'
import { addPurchase, getPurchaseListById, updatePurchase, getBatchExpiry } from 'src/lib/api/pharmacy/getPurchaseList'
import CommonDialogBox from 'src/components/CommonDialogBox'
import SingleDatePicker from '../../SingleDatePicker'
import Utility from 'src/utility'
import { AddButton } from 'src/components/Buttons'
import { usePharmacyContext } from 'src/context/PharmacyContext'

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

  tax_amount: 0
}

const initialNestedRowMedicine = {
  medicine_name: '',
  purchase_unit_id: '',
  purchase_qty: 0,
  purchase_unit_price: 0,
  purchase_purchase_price: 0,
  purchase_batch_no: '',
  purchase_expiry_date: '',
  purchase_stock_item_id: '',
  purchase_gst_type: '',
  purchase_tax_amount: 0
}

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
})

const AddPurchaseForm = () => {
  // ** Hook
  const [stores, setStores] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [optionsMedicineList, setOptionsMedicineList] = useState([])
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [itemErrors, setItemErrors] = useState({})

  const [medicineItemId, setMedicineItemId] = useState('')
  const [submitLoader, setSubmitLoader] = useState(false)
  const [duplicateMedError, setDuplicateMedError] = useState('')
  const [validateDiscount, setValidateDiscount] = useState('')
  const [expiryDateLoader, setExpiryDateLoader] = useState(false)
  const [productExpiryDate, setProductExpiryDate] = useState('')

  const [nestedRowMedicine, setNestedRowMedicine] = useState(initialNestedRowMedicine)
  const router = useRouter()
  const { id, action } = router.query

  const { selectedPharmacy } = usePharmacyContext()

  const closeDialog = () => {
    setShow(false)
    setNestedRowMedicine(initialNestedRowMedicine)
    setMedicineItemId('')
    setErrors({})
    setItemErrors({})
    setDuplicateMedError('')
    setOptionsMedicineList([])
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
    const updatedItems = editParams.purchase_details.filter(el => {
      return el.purchase_unit_id != itemId
    })
    setEditParams({ ...editParams, purchase_details: updatedItems })
    setMedicineItemId('')
  }

  const totalLineItemsPurchase = editParams.purchase_details?.reduce(
    (acc, row) => acc + parseInt(row.purchase_purchase_price),
    0
  )

  const calculateTotalTaxAmount = editParams.purchase_details?.reduce(
    (acc, row) => acc + parseInt(row.purchase_tax_amount ? row.purchase_tax_amount : 0),
    0
  )
  function calculateTaxAmount(gst_name, totalAmount) {
    if (!gst_name || !totalAmount) {
      return 0
    }

    const gstPercentage = parseFloat(gst_name)

    const taxAmount = totalAmount * (gstPercentage / 100)

    // return taxAmount.toFixed(2)
    return taxAmount
  }

  const calculateFinalAmount = useCallback(
    discountValue => {
      let finalAmount = totalLineItemsPurchase
      let netAmountWithGST = totalLineItemsPurchase + calculateTotalTaxAmount
      let netAmount = 0
      setEditParams({
        ...editParams,
        total_amount: totalLineItemsPurchase ? totalLineItemsPurchase : 0,
        net_amount: netAmountWithGST ? netAmountWithGST : 0,
        tax_amount: calculateTotalTaxAmount ? calculateTotalTaxAmount : 0
      })
      if (editParams.discount_type === 'P') {
        netAmount = (netAmountWithGST * discountValue) / 100
        const discountValueAmount = netAmount
        const netValueAfterDiscount = netAmountWithGST - netAmount
        setEditParams({
          ...editParams,
          discount_percentage: discountValue,
          discount_amount: discountValueAmount,
          net_amount: netValueAfterDiscount,
          tax_amount: calculateTotalTaxAmount
        })
      } else if (editParams.discount_type === 'F') {
        const netValueAfterDiscount = netAmountWithGST - discountValue
        setEditParams({
          ...editParams,
          discount_amount: discountValue,
          discount_percentage: 0,
          net_amount: netValueAfterDiscount,
          tax_amount: calculateTotalTaxAmount
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalLineItemsPurchase, editParams]
  )
  useEffect(() => {
    calculateFinalAmount(editParams.discount_type === 'P' ? editParams.discount_percentage : editParams.discount_amount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalLineItemsPurchase])

  const addItemsToTable = () => {
    const newData = {
      medicine_name: nestedRowMedicine.medicine_name,
      purchase_unit_id: nestedRowMedicine.purchase_unit_id,
      purchase_qty: nestedRowMedicine.purchase_qty,
      purchase_unit_price: nestedRowMedicine.purchase_unit_price,
      purchase_purchase_price: nestedRowMedicine.purchase_purchase_price,
      purchase_batch_no: nestedRowMedicine.purchase_batch_no,
      purchase_expiry_date: nestedRowMedicine.purchase_expiry_date,
      purchase_stock_item_id: nestedRowMedicine.purchase_stock_item_id,
      purchase_gst_type: nestedRowMedicine.purchase_gst_type,
      purchase_tax_amount: nestedRowMedicine.purchase_tax_amount
    }

    const updatedNestedRows = [...editParams.purchase_details, newData]
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
      debugger
      itemErrors.purchase_unit_price = 'This field is required'
      if (parseInt(values.purchase_unit_price) === 0 || parseInt(values.purchase_unit_price) < 0) {
        itemErrors.purchase_unit_price = 'Enter valid Price'
      }
    }
    if (isNaN(parseInt(values.purchase_qty)) || parseInt(values.purchase_qty) <= 0) {
      debugger
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

    debugger

    return itemErrors
  }

  const validateItems = values => {
    const errors = {}

    if (!values.po_no) {
      errors.po_no = 'This field is required'
    }
    if (!values.store_id) {
      errors.store_id = 'This field is required'
    }
    if (!values.supplier_id) {
      errors.supplier_id = 'This field is required'
    }
    if (!values.po_date) {
      errors.po_date = 'This field is required'
    }

    return errors
  }

  const submitItems = () => {
    debugger

    const HasErrors =
      nestedRowMedicine.medicine_name !== '' &&
      nestedRowMedicine.purchase_qty !== '' &&
      !isNaN(parseInt(nestedRowMedicine.purchase_qty)) &&
      parseInt(nestedRowMedicine.purchase_qty) > 0 &&
      nestedRowMedicine.purchase_unit_price !== '' &&
      !isNaN(parseInt(nestedRowMedicine.purchase_unit_price)) &&
      parseInt(nestedRowMedicine.purchase_unit_price) > 0 &&
      nestedRowMedicine.purchase_batch_no !== '' &&
      nestedRowMedicine.purchase_expiry_date !== ''
    if (HasErrors === false) {
      debugger
      setItemErrors(validate(nestedRowMedicine))

      return
    }

    const isMedicineAlreadyExists = editParams.purchase_details.some(
      item => item.medicine_name === nestedRowMedicine.medicine_name
    )

    if (isMedicineAlreadyExists) {
      setDuplicateMedError('Medicine already exists')

      return
    }
    setErrors({})
    addItemsToTable()
  }

  const updateTableItems = () => {
    const itemId = medicineItemId
    const updatedState = { ...editParams }

    const updatedIndex = updatedState.purchase_details.findIndex(row => row.purchase_unit_id === itemId)

    if (updatedIndex !== -1) {
      const updatedNestedRows = [...updatedState.purchase_details]
      updatedNestedRows[updatedIndex] = {
        ...updatedNestedRows[updatedIndex],
        ...nestedRowMedicine
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

  const updateFormItems = () => {
    // const HasErrors =
    //   !nestedRowMedicine.medicine_name ||
    //   !nestedRowMedicine.purchase_unit_id ||
    //   !nestedRowMedicine.purchase_qty ||
    //   !nestedRowMedicine.purchase_unit_price ||
    //   !nestedRowMedicine.purchase_batch_no ||
    //   !nestedRowMedicine.purchase_purchase_price ||
    //   !nestedRowMedicine.purchase_expiry_date

    const HasErrors =
      nestedRowMedicine.medicine_name !== '' &&
      nestedRowMedicine.purchase_qty !== '' &&
      !isNaN(parseInt(nestedRowMedicine.purchase_qty)) &&
      parseInt(nestedRowMedicine.purchase_qty) > 0 &&
      nestedRowMedicine.purchase_unit_price !== '' &&
      !isNaN(parseInt(nestedRowMedicine.purchase_unit_price)) &&
      parseInt(nestedRowMedicine.purchase_unit_price) > 0 &&
      nestedRowMedicine.purchase_batch_no !== '' &&
      nestedRowMedicine.purchase_expiry_date !== ''

    debugger

    if (HasErrors === false) {
      setItemErrors(validate(nestedRowMedicine))

      return
    }
    if (nestedRowMedicine.control_substance === 'yes') {
      if (nestedRowMedicine.control_substance_file.length === 0) {
        setItemErrors(validate(nestedRowMedicine))

        return
      }
    }
    setErrors({})
    updateTableItems()
  }

  const handleSubmit = () => {
    const formHasErrors = !editParams.po_no || !editParams.po_date || !editParams.store_id || !editParams.supplier_id
    if (formHasErrors) {
      setErrors(validateItems(editParams))

      return
    }

    setErrors({})
    showDialog()
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
      const response = await getSuppliers()
      debugger
      if (response.data.data.list_items?.length > 0) {
        setSuppliers(response.data.data.list_items)
      }
    } catch (error) {
      console.log('supplier error', error)
    }
  }

  useEffect(() => {
    getStoresLists()
    getSuppliersLists()
  }, [])

  //  ******
  const fetchMedicineData = async searchText => {
    if (searchText !== '') {
      try {
        const params = {
          sort: 'asc',
          q: searchText,
          limit: 10
        }

        const searchResults = await getMedicineList({ params: params })
        if (searchResults?.data?.list_items.length > 0) {
          setOptionsMedicineList(
            searchResults?.data?.list_items?.map(item => ({
              value: item.id,
              label: item.name,
              purchase_unit_price: item?.price,
              tax_type: item.gst_value ? item.gst_value : ''
              // supplier_price: item.supplier_price
            }))
          )
        }
      } catch (e) {
        console.log('error', e)
      }
    }
  }

  const getMedicineExpiryDate = async (product_id, batch) => {
    try {
      setExpiryDateLoader(true)
      const response = await getBatchExpiry({ batch: batch, stock_id: product_id })
      console.log(parseFormattedDate(response.data.expiry_date))
      if (response.success && response.data !== null) {
        setNestedRowMedicine(prevState => ({
          ...prevState,
          purchase_expiry_date: response.data.expiry_date
        }))
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
      if (id.trim() !== '' && batch.trim() !== '') {
        debugger
        try {
          await getMedicineExpiryDate(id, batch)
        } catch (error) {
          console.error(error)
        }
      }
    }, 500),
    []
  )

  const getListOfItemsById = async id => {
    try {
      const result = await getPurchaseListById(id)
      if (result.success === true && result.data !== '') {
        const lineItems = result.data.purchase_detailss.map(el => {
          return {
            id: el?.id,
            medicine_name: el?.stock_item_name,
            purchase_unit_id: el?.unit_id,
            purchase_stock_item_id: el?.stock_item_id,
            // purchase_stock_item_id: el?.stock_item_id,
            purchase_qty: el?.qty,
            purchase_unit_price: el?.unit_price,
            purchase_purchase_price: el?.purchase_price,
            purchase_batch_no: el?.batch_no,
            purchase_expiry_date: el?.expiry_date,
            purchase_gst_type: el?.gst_type,
            purchase_tax_amount: el?.tax_amount
          }
        })
        setEditParams({
          ...editParams,
          id: result?.data?.id,
          po_no: result?.data?.po_no,
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
          tax_amount: result?.data?.tax_amount
        })
      }
    } catch (error) {
      console.log('purchase error', error)
    }
  }

  // ****** edit section //////
  const editTableData = itemId => {
    if (id != undefined && action === 'edit') {
      const getItems = editParams.purchase_details.filter(el => {
        return el.purchase_unit_id === itemId
      })

      setNestedRowMedicine({
        ...nestedRowMedicine,
        id: getItems[0]?.id,
        medicine_name: getItems[0]?.medicine_name,
        purchase_unit_id: getItems[0].purchase_unit_id,
        purchase_qty: getItems[0].purchase_qty,
        purchase_unit_price: getItems[0].purchase_unit_price,
        purchase_purchase_price: getItems[0].purchase_purchase_price,
        purchase_batch_no: getItems[0].purchase_batch_no,
        purchase_expiry_date: getItems[0].purchase_expiry_date,
        purchase_stock_item_id: getItems[0].purchase_stock_item_id
          ? getItems[0].purchase_stock_item_id
          : getItems[0].purchase_unit_id,
        purchase_gst_type: getItems[0].purchase_gst_type,
        purchase_tax_amount: getItems[0].purchase_tax_amount
      })
    } else {
      const getItems = editParams.purchase_details.filter(el => {
        return el.purchase_unit_id === itemId
      })

      setNestedRowMedicine({
        ...nestedRowMedicine,
        medicine_name: getItems[0]?.medicine_name,
        purchase_unit_id: getItems[0].purchase_unit_id,
        purchase_qty: getItems[0].purchase_qty,
        purchase_unit_price: getItems[0].purchase_unit_price,
        purchase_purchase_price: getItems[0].purchase_purchase_price,
        purchase_batch_no: getItems[0].purchase_batch_no,
        purchase_expiry_date: getItems[0].purchase_expiry_date,
        purchase_stock_item_id: getItems[0].purchase_stock_item_id
          ? getItems[0].purchase_stock_item_id
          : getItems[0].purchase_unit_id,
        purchase_gst_type: getItems[0].purchase_gst_type,
        purchase_tax_amount: getItems[0].purchase_tax_amount
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
    if (editParams.discount_type !== '') {
      if (editParams.discount_amount === '' || editParams.discount_percentage === '') {
        setValidateDiscount('Please enter discount value')

        return
      }
    }
    setSubmitLoader(true)

    const postData = editParams
    postData.total_amount = totalLineItemsPurchase

    if (id) {
      postData.antz_pharmacy_purchase_id = id
      const response = await updatePurchase(id, postData)

      if (response?.success) {
        toast.success(response.message)
        setSubmitLoader(false)
        getListOfItemsById(id)
        Router.push('/pharmacy/purchase/purchase-list/')
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
        Router.push('/pharmacy/purchase/purchase-list/')
      } else {
        setSubmitLoader(false)
        console.log('response catch purchase', response)
        if (response.data?.po_no) {
          toast.error('Purchase number already exist ')
        }
        if (response?.message) {
          toast.error(response.message)
        }
      }
    }
  }

  // data posting section
  const createForm = () => {
    return (
      <CardContent>
        <form
        // addItemsToTable={addMultipleMedicine(addItemsToTable)}
        >
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Autocomplete
                  inputProps={{ tabIndex: '6' }}
                  disablePortal
                  id='autocomplete-controlled'
                  options={optionsMedicineList}
                  value={nestedRowMedicine.medicine_name}
                  onChange={(event, newValue) => {
                    setNestedRowMedicine({
                      ...nestedRowMedicine,
                      medicine_name: newValue?.label,
                      purchase_unit_id: newValue?.value,
                      purchase_stock_item_id: newValue?.value,
                      purchase_unit_price: newValue?.purchase_unit_price,
                      purchase_qty: 0,
                      purchase_purchase_price: 0,
                      purchase_gst_type: newValue?.tax_type,
                      purchase_tax_amount: 0
                    })
                    setDuplicateMedError('')
                    setItemErrors({})
                  }}
                  onKeyUp={e => {
                    searchMedicineData(e.target.value)
                    setItemErrors({})
                  }}
                  renderInput={params => (
                    <TextField {...params} label='Product Name*' error={Boolean(itemErrors.medicine_name)} />
                  )}
                  // onBlur={e => {
                  //   debugger
                  //   checkMedicineExpiryDate(nestedRowMedicine.purchase_unit_id, nestedRowMedicine.purchase_batch_no)
                  // }}
                />
                {itemErrors.medicine_name && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
                {duplicateMedError && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    {duplicateMedError}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <TextField
                  type='text'
                  value={nestedRowMedicine.purchase_batch_no}
                  error={Boolean(itemErrors.purchase_batch_no)}
                  label='Batch*'
                  onChange={event => {
                    setNestedRowMedicine({ ...nestedRowMedicine, purchase_batch_no: event.target.value })
                    setItemErrors({})
                  }}
                  onBlur={e => {
                    checkMedicineExpiryDate(nestedRowMedicine.purchase_unit_id, e.target.value)
                  }}
                />
                {itemErrors.purchase_batch_no && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              {/* purchase_expiry_date */}
              <FormControl fullWidth>
                <SingleDatePicker
                  fullWidth
                  // disabled={expiryDateLoader}
                  date={
                    nestedRowMedicine.purchase_expiry_date
                      ? parseFormattedDate(nestedRowMedicine.purchase_expiry_date)
                      : null
                  }
                  width={'100%'}
                  value={
                    nestedRowMedicine.purchase_expiry_date
                      ? parseFormattedDate(nestedRowMedicine.purchase_expiry_date)
                      : null
                  }
                  name={'Expiry Date*'}
                  onChangeHandler={date => {
                    setNestedRowMedicine({
                      ...nestedRowMedicine,
                      purchase_expiry_date: formatDate(date)
                    })
                    setItemErrors({})
                  }}
                  customInput={<CustomInput label='Date' error={Boolean(errors.purchase_expiry_date)} />}
                />
                {itemErrors.purchase_expiry_date && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <TextField
                  type='Number'
                  // disabled={true}
                  value={nestedRowMedicine.purchase_unit_price}
                  error={Boolean(itemErrors.purchase_unit_price)}
                  label='Supplier Rate*'
                  onChange={event => {
                    setNestedRowMedicine({
                      ...nestedRowMedicine,
                      purchase_unit_price: event.target.value,
                      purchase_qty: '',
                      purchase_purchase_price: '',
                      purchase_tax_amount: ''
                    })
                    setItemErrors({})
                  }}
                />
                {itemErrors.purchase_unit_price && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    {itemErrors.purchase_unit_price}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                {console.log('nestedRowMedicine.purchase_qty', nestedRowMedicine.purchase_qty)}
                <TextField
                  type='number'
                  value={nestedRowMedicine.purchase_qty}
                  error={Boolean(itemErrors.purchase_qty)}
                  label='Quantity*'
                  onChange={event => {
                    const val = parseInt(event.target.value, 10)
                    const supplierPrice = nestedRowMedicine.purchase_unit_price
                    const totalPrice = val * supplierPrice
                    const taxAmount = calculateTaxAmount(nestedRowMedicine.purchase_gst_type, totalPrice)
                    setNestedRowMedicine({
                      ...nestedRowMedicine,
                      purchase_qty: val,
                      purchase_purchase_price: totalPrice,
                      purchase_tax_amount: taxAmount
                    })
                    setItemErrors({})
                  }}
                />
                {itemErrors.purchase_qty && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    {itemErrors.purchase_qty}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <TextField
                  type='Number'
                  disabled={true}
                  value={nestedRowMedicine.purchase_purchase_price}
                  error={Boolean(itemErrors.purchase_purchase_price)}
                  label='Total purchase price'
                  onChange={event => {
                    setNestedRowMedicine({
                      ...nestedRowMedicine,
                      purchase_purchase_price: event.target.value
                    })
                    setItemErrors({})
                  }}
                />
                {itemErrors.purchase_purchase_price && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            {nestedRowMedicine.purchase_gst_type ? (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <TextField
                      type='text'
                      disabled={true}
                      value={nestedRowMedicine.purchase_gst_type}
                      error={Boolean(itemErrors.purchase_gst_type)}
                      label='GST'
                      onChange={event => {
                        setNestedRowMedicine({ ...nestedRowMedicine, purchase_gst_type: event.target.value })
                        setItemErrors({})
                      }}
                    />
                    {itemErrors.purchase_gst_type && (
                      <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                        This field is required
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <TextField
                      type='number'
                      disabled={true}
                      value={nestedRowMedicine.purchase_tax_amount}
                      error={Boolean(itemErrors.purchase_tax_amount)}
                      label='Tax amount'
                      onChange={event => {
                        setNestedRowMedicine({ ...nestedRowMedicine, purchase_tax_amount: event.target.value })
                        setItemErrors({})
                      }}
                    />
                    {itemErrors.purchase_tax_amount && (
                      <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                        This field is required
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </>
            ) : null}

            <Box sx={{ height: '150px' }}></Box>

            {/* // file uploader */}
            <Grid item xs={12}>
              <Box sx={{ float: 'right' }}>
                {medicineItemId ? (
                  <>
                    <Button
                      sx={{ mr: 2 }}
                      onClick={() => {
                        updateFormItems()

                        // submitItems()
                      }}
                      size='large'
                      variant='contained'
                    >
                      update
                    </Button>
                    <Button
                      onClick={() => {
                        closeDialog()
                      }}
                      size='large'
                      variant='outlined'
                    >
                      Reset
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      sx={{ mr: 2 }}
                      onClick={() => {
                        // updateFormItems()
                        submitItems()
                      }}
                      size='large'
                      variant='contained'
                    >
                      save
                    </Button>
                    <Button
                      onClick={() => {
                        closeDialog()
                      }}
                      size='large'
                      variant='outlined'
                    >
                      Reset
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    )
  }

  return (
    <Card>
      <Grid
        container
        sm={12}
        xs={12}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <CardHeader
          avatar={
            <Icon
              style={{ cursor: 'pointer' }}
              onClick={() => {
                Router.push('/pharmacy/purchase/purchase-list/')
              }}
              icon='ep:back'
            />
          }
          title='Add Purchase'
        />
      </Grid>
      <CardContent>
        <Grid container>
          <CommonDialogBox
            title={'Add Purchase Item'}
            dialogBoxStatus={show}
            formComponent={createForm()}
            close={closeDialog}
            show={showDialog}
          />
        </Grid>
      </CardContent>
      <CardContent>
        <form>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                <Typography variant='subtitle2' sx={{ mb: 3, color: 'text.primary', letterSpacing: '.1px' }}>
                  Supplier :
                </Typography>
              </Grid>
              <Grid xs={12} sm={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <InputLabel error={Boolean(errors.supplier_id)}>Supplier*</InputLabel>
                  <Select
                    value={editParams.supplier_id}
                    error={Boolean(errors.supplier_id)}
                    label='Supplier*'
                    disabled={id ? true : false}
                    onChange={e => {
                      setEditParams({
                        ...editParams,
                        supplier_id: e.target.value
                      })
                      setErrors({})
                    }}
                  >
                    {suppliers?.map((item, index) => (
                      <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                        {item?.name}
                      </MenuItem>
                    ))}
                  </Select>

                  {errors.supplier_id && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <TextField
                    type='text'
                    disabled={id ? true : false}
                    value={editParams.po_no}
                    error={Boolean(errors.po_no)}
                    label='Purchase Invoice Number*'
                    onChange={e => {
                      setEditParams({
                        ...editParams,
                        po_no: e.target.value
                      })
                      setErrors({})
                    }}
                  />
                  {errors.po_no && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={6}>
              {/* <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                  <Typography variant='subtitle2' sx={{ mb: 3, color: 'text.primary', letterSpacing: '.1px' }}>
                    Store:
                  </Typography>
                </Grid>
                <FormControl fullWidth>
                  <InputLabel error={Boolean(errors.store_id)}>Stores*</InputLabel>

                  <Select
                    error={Boolean(errors.store_id)}
                    value={editParams.store_id}
                    label='Select'
                    disabled={id ? true : false}
                    onChange={e => {
                      getStoreType(e.target.value)
                      setErrors({})
                    }}
                  >
                    {stores?.map((item, index) => (
                      <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                        {item?.name}
                      </MenuItem>
                    ))}
                  </Select>

                  {errors.store_id && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid> */}
              <Grid item xs={12} sm={12} lg={12} sx={{ mx: 'auto', mt: 10, mb: 5 }}>
                <FormControl fullWidth>
                  <SingleDatePicker
                    fullWidth
                    date={editParams.po_date ? parseFormattedDate(editParams.po_date) : null}
                    width={'100%'}
                    value={editParams.po_date ? parseFormattedDate(editParams.po_date) : null}
                    name={'Date*'}
                    onChangeHandler={date => {
                      setEditParams({ ...editParams, po_date: formatDate(date) })
                      setErrors({})
                    }}
                    customInput={<CustomInput label='Date' error={Boolean(errors.po_date)} />}
                  />
                  {errors.po_date && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <TextField
                    type='text'
                    value={editParams.description}
                    error={Boolean(errors.description)}
                    label='Comments'
                    onChange={e => {
                      setEditParams({
                        ...editParams,
                        description: e.target.value
                      })
                      setErrors({})
                    }}
                  />
                  {errors.description && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
        </form>
      </CardContent>
      <Grid
        container
        spacing={2}
        sm={12}
        xs={12}
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mb: 4
        }}
      >
        <AddButton
          title='Add Purchase Item'
          action={() => {
            handleSubmit()
          }}
        />
      </Grid>

      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: '#F5F5F7' }}>
            <TableRow>
              <TableCell width='30%'>Product Name</TableCell>
              <TableCell width='10%'>Batch</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell align='right'>Quantity</TableCell>
              <TableCell align='right'>Rate</TableCell>
              <TableCell align='right'>Price</TableCell>
              <TableCell align='right'>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {editParams.purchase_details
              ? editParams.purchase_details.map((el, index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell>{el.medicine_name}</TableCell>
                      <TableCell>{el.purchase_batch_no}</TableCell>
                      <TableCell>{Utility.formatDisplayDate(el.purchase_expiry_date)}</TableCell>
                      <TableCell align='right'>{el.purchase_qty}</TableCell>
                      <TableCell align='right'>{el.purchase_unit_price}</TableCell>
                      <TableCell align='right'>{el.purchase_purchase_price}</TableCell>

                      <TableCell align='center'>
                        <IconButton
                          size='small'
                          sx={{ mr: 0.5 }}
                          aria-label='Edit'
                          onClick={() => {
                            setMedicineItemId(el.purchase_unit_id)

                            editTableData(el.purchase_unit_id)
                            showDialog()
                          }}
                        >
                          <Icon icon='mdi:pencil-outline' />
                        </IconButton>
                        {id && el.id ? null : (
                          <IconButton
                            onClick={() => {
                              removeItemsFroTable(el.purchase_unit_id)
                            }}
                            size='small'
                            sx={{ mr: 0.5 }}
                          >
                            <Icon icon='mdi:delete-outline' />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              : null}
          </TableBody>
        </Table>
      </TableContainer>
      <Grid item xs={6}>
        {/* {totalQty ? ( */}
        <Grid container>
          <Grid
            item
            xs={12}
            sm={4}
            lg={4}
            sx={{
              mb: { sm: 0, xs: 4 },
              mt: { xs: 4 },
              order: { sm: 2, xs: 1 },
              marginLeft: 'auto',
              mr: { sm: 12, xs: 0 }
            }}
          >
            <Card>
              <CardContent sx={{ pt: 8 }}>
                <CalcWrapper>
                  <Typography variant='body2'>Sub Total :</Typography>
                  <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                    {totalLineItemsPurchase ? totalLineItemsPurchase : editParams.total_amount}
                  </Typography>
                </CalcWrapper>
                <Divider
                  sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
                />
                <CalcWrapper>
                  <Typography variant='body2'>GST :</Typography>
                  <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                    {editParams.tax_amount ? editParams.tax_amount : calculateTotalTaxAmount}
                  </Typography>
                </CalcWrapper>
                <Divider
                  sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
                />
                <CalcWrapper>
                  <Grid container sx={{ display: 'flex', justifyContent: 'space-between' }} spacing={2}>
                    <Grid item xs={12} sm={6}>
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
                    <Grid item xs={12} sm={6}>
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
                    {editParams.net_amount ? editParams.net_amount : totalLineItemsPurchase}
                  </Typography>
                </CalcWrapper>

                <Divider
                  sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        {/* // ) : null} */}
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ float: 'right', my: 4, mx: 6 }}>
          <LoadingButton
            disabled={editParams.purchase_details.length > 0 ? false : true}
            sx={{ marginRight: '8px' }}
            size='large'
            onClick={() => {
              postItemsData()
            }}
            variant='contained'
            loading={submitLoader}
          >
            Save
          </LoadingButton>
          <Button
            onClick={() => {
              setEditParams(editParamsInitialState)
            }}
            size='large'
            variant='outlined'
          >
            Reset
          </Button>
        </Box>
      </Grid>
    </Card>
  )
}

export default AddPurchaseForm
