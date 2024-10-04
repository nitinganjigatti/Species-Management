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
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

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
import ExistingPurchaseForm from 'src/views/pages/pharmacy/purchase/purchaseItemForm/ExistingPurchaseForm'
import AddSupplier from 'src/pages/pharmacy/masters/supplier/add-supplier'
import { AuthContext } from 'src/context/AuthContext'
import { useContext } from 'react'

const CalcWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '&:not(:last-of-type)': {
    marginBottom: theme.spacing(2)
  }
}))

const editParamsInitialState = {
  is_price_limited: true,
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
  requested_by: ''
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
  purchase_cgst: 0,
  purchase_sgst: 0,
  purchase_igst: 0,
  purchase_cgst_amount: 0,
  purchase_sgst_amount: 0,
  purchase_igst_amount: 0,
  package_details: '',
  manufacturer: ''
}

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
})

const defaultValues = {
  po_date: Utility.formattedPresentDate()
}

const AddExistingPurchase = () => {
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

  const router = useRouter()
  const { id, action } = router.query

  const { selectedPharmacy } = usePharmacyContext()
  const authData = useContext(AuthContext)
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
    trigger
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

  const totalLineItemsAmount = editParams.purchase_details?.reduce(
    (acc, row) => acc + parseFloat(row.purchase_gross_amount ? row.purchase_gross_amount : 0),
    0
  )

  const totalLineItemsTaxableAmount = editParams.purchase_details?.reduce(
    (acc, row) => acc + parseFloat(row.purchase_taxable_amount ? row.purchase_taxable_amount : 0),
    0
  )

  const totalLineItemsPurchase = editParams.purchase_details?.reduce(
    (acc, row) => acc + parseFloat(row.purchase_net_amount ? row.purchase_net_amount : 0),
    0
  )

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
    const updatedNestedRows = [...editParams.purchase_details, payload]
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
      const isMedicineAlreadyExists = editParams.purchase_details.some(
        item =>
          item.purchase_unit_id === payload.purchase_unit_id && item.purchase_batch_no === payload.purchase_batch_no
      )

      if (isMedicineAlreadyExists) {
        setDuplicateMedError('Medicine already exists')

        return
      }
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
      row => row.purchase_unit_id === itemId && row.purchase_batch_no === nestedRowMedicine.purchase_batch_no
    )

    if (updatedIndex !== -1) {
      const updatedNestedRows = [...updatedState.purchase_details]
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
    postData.net_amount = totalLineItemsPurchase
    // postData.tax_amount = calculate_cgst_tax_amount + calculate_sgst_tax_amount
    postData.discount_amount = totalLineItemsDiscount
    postData.taxable_amount = totalLineItemsTaxableAmount
    // postData.discount_percentage = calculate_lineItem_discount_percentage

    // if (id) {
    //   postData.antz_pharmacy_purchase_id = id
    //   const response = await updatePurchase(id, postData)

    //   if (response?.success) {
    //     toast.success(response.message)
    //     setSubmitLoader(false)
    //     getListOfItemsById(id)
    //     Router.push('/pharmacy/purchase/purchase-list/')
    //   } else {
    //     setSubmitLoader(false)
    //     toast.error(response.message)
    //   }
    // } else {
    const response = await addPurchase(postData)
    if (response?.success) {
      toast.success(response.message)
      setEditParams(editParamsInitialState)
      setSubmitLoader(false)
      Router.push('/pharmacy/purchase/purchase-list/')
    } else {
      setSubmitLoader(false)
      if (response.data?.po_no) {
        toast.error('Purchase number already exist ')
      }
      if (response?.message) {
        toast.error(response.message)
      }
    }
    // }
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
    try {
      const response = await getSuppliers()

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
      setProductExpiryDate('')
      const response = await getBatchExpiry({ batch: batch, stock_id: product_id })
      if (response.success && response.data !== null) {
        setNestedRowMedicine(prevState => ({
          ...prevState,
          purchase_expiry_date: response.data.expiry_date
        }))
        setProductExpiryDate(response.data.expiry_date)
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

  // const getListOfItemsById = async id => {
  //   try {
  //     const result = await getPurchaseListById(id)
  //     if (result.success === true && result.data !== '') {
  //       const lineItems = result.data.purchase_detailss.map(el => {
  //         return {
  //           ...el,
  //           medicine_name: el?.stock_item_name,
  //           id: el?.id,
  //           stock_type: el?.stock_type
  //         }
  //       })
  //       setEditParams({
  //         ...editParams,
  //         id: result?.data?.id,
  //         po_no: result?.data?.po_no,
  //         purchase_batch_no: result?.data?.purchase_batch_no,
  //         po_date: result?.data?.po_date,
  //         store_id: result?.data?.store_id,
  //         supplier_id: result?.data?.supplier_id,
  //         description: result?.data?.description,
  //         type_of_store: result?.data?.type_of_store,
  //         purchase_details: lineItems,
  //         total_amount: result?.data?.total_amount,
  //         discount_type: result?.data?.discount_type ? result?.data?.discount_type : '',
  //         discount_amount: result?.data?.discount_amount,
  //         discount_percentage: result?.data?.discount_percentage,
  //         net_amount: result?.data?.net_amount,
  //         tax_amount: result?.data?.tax_amount,
  //         taxable_amount: result?.data?.taxable_amount
  //       })

  //       // setSuppliers([{ id: result?.data?.supplier_id, company_name: result?.data?.company_name }])
  //       // setValue('supplier_id', result?.data?.supplier_id)
  //       reset({
  //         supplier_id: result?.data?.supplier_id,
  //         po_date: result?.data?.po_date,
  //         po_no: result?.data?.po_no,
  //         description: result?.data?.description
  //       })
  //     }
  //   } catch (error) {
  //     console.log('purchase error', error)
  //   }
  // }

  // ****** edit section //////
  const editTableData = (itemId, index, purchase_batch_no) => {
    if (id != undefined && action === 'edit') {
      const getItems = editParams.purchase_details.filter(el => {
        return el.purchase_unit_id === itemId && el.purchase_batch_no === purchase_batch_no
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

      setNestedRowMedicine({
        ...nestedRowMedicine,
        id: getItems[0]?.id,
        index,
        medicine_name: getItems[0]?.medicine_name,
        stock_type: getItems[0]?.stock_type,
        purchase_unit_id: getItems[0]?.purchase_unit_id,
        purchase_stock_item_id: getItems[0].purchase_stock_item_id
          ? getItems[0].purchase_stock_item_id
          : getItems[0].purchase_unit_id,
        purchase_batch_no: getItems[0].purchase_batch_no,
        purchase_expiry_date: getItems[0].purchase_expiry_date,
        purchase_unit_price: getItems[0].purchase_unit_price,
        purchase_qty: getItems[0].purchase_qty,
        purchase_free_quantity: getItems[0].purchase_free_quantity,
        purchase_discount: getItems[0].purchase_discount,
        purchase_cgst: getItems[0].purchase_cgst,
        purchase_sgst: getItems[0].purchase_sgst,
        purchase_igst: getItems[0].purchase_igst,
        purchase_cgst_amount: getItems[0].purchase_cgst_amount,
        purchase_sgst_amount: getItems[0].purchase_sgst_amount,
        purchase_igst_amount: getItems[0].purchase_igst_amount,
        purchase_gross_amount: getItems[0].purchase_gross_amount,
        purchase_discount_amount: getItems[0].purchase_discount_amount,
        purchase_taxable_amount: getItems[0].purchase_taxable_amount,
        purchase_net_amount: getItems[0].purchase_net_amount,
        purchase_purchase_price: getItems[0].purchase_purchase_price,
        package_details: getItems[0]?.package_details,
        manufacture: getItems[0]?.manufacture

        // purchase_gst_type: getItems[0].purchase_gst_type,
        // purchase_tax_amount: getItems[0].purchase_tax_amount
      })
    } else {
      const getItems = editParams.purchase_details.filter(el => {
        return el.purchase_unit_id === itemId && el.purchase_batch_no === purchase_batch_no
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

      setNestedRowMedicine({
        ...nestedRowMedicine,
        medicine_name: getItems[0]?.medicine_name,
        stock_type: getItems[0]?.stock_type,
        index,
        purchase_unit_id: getItems[0].purchase_unit_id,
        purchase_stock_item_id: getItems[0].purchase_stock_item_id
          ? getItems[0].purchase_stock_item_id
          : getItems[0].purchase_unit_id,
        purchase_batch_no: getItems[0].purchase_batch_no,
        purchase_expiry_date: getItems[0].purchase_expiry_date,
        purchase_unit_price: getItems[0].purchase_unit_price,
        purchase_qty: getItems[0].purchase_qty,
        purchase_free_quantity: getItems[0].purchase_free_quantity,
        purchase_discount: getItems[0].purchase_discount,
        purchase_cgst: getItems[0].purchase_cgst,
        purchase_sgst: getItems[0].purchase_sgst,
        purchase_igst: getItems[0].purchase_igst,
        purchase_cgst_amount: getItems[0].purchase_cgst_amount,
        purchase_sgst_amount: getItems[0].purchase_sgst_amount,
        purchase_igst_amount: getItems[0].purchase_igst_amount,
        purchase_gross_amount: getItems[0].purchase_gross_amount,
        purchase_discount_amount: getItems[0].purchase_discount_amount,
        purchase_taxable_amount: getItems[0].purchase_taxable_amount,
        purchase_net_amount: getItems[0].purchase_net_amount,
        purchase_purchase_price: getItems[0].purchase_purchase_price,
        package_details: getItems[0]?.package_details,
        manufacture: getItems[0]?.manufacture
      })
    }
  }

  // useEffect(() => {
  //   if (id != undefined && action === 'edit') {
  //     getListOfItemsById(id)
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [id, action])

  // ****** edit section //////
  // data posting section

  const postItemsData = async () => {
    setSubmitLoader(true)

    const postData = editParams
    postData.total_amount = totalLineItemsPurchase + calculateTotalTaxAmount

    if (id) {
      postData.antz_pharmacy_purchase_id = id
      const response = await updatePurchase(id, postData)

      if (response?.success) {
        toast.success(response.message)
        setSubmitLoader(false)
        // getListOfItemsById(id)
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
        <ExistingPurchaseForm
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
        ></ExistingPurchaseForm>
      </CardContent>
    )
  }

  const closeSupplierDialog = () => {
    getSuppliersLists()
    setSupplierDialog(false)
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
                router.back()
                // Router.push('/pharmacy/purchase/purchase-list/')
              }}
              icon='ep:back'
            />
          }
          title={id ? 'Edit Inventory List' : 'Add Existing Inventory'}
        />
        {authData?.userData?.roles?.settings?.add_pharmacy && (
          <AddButton
            styles={{ marginRight: 20 }}
            title='Add Supplier'
            action={() => {
              setSupplierDialog(true)
            }}
          />
        )}
      </Grid>

      <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <Grid container spacing={6}>
            {/* <Grid item xs={12} sm={6}> */}
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6} lg={6}>
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
            <Grid item xs={12} sm={6} lg={6}>
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
            <Grid item xs={12} sm={6} lg={6} sx={{ mx: 'auto' }}>
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
            <Grid item xs={12} sm={6} lg={6}>
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
                      disabled={id ? true : false}
                      error={Boolean(errors.purchase_order_no)}
                      label='Purchase order number'
                    />
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} lg={6}>
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
                      disabled={id ? true : false}
                      error={Boolean(errors.po_no)}
                      label='Requested by'
                    />
                  )}
                />
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
        <CardContent>
          <Grid container>
            <Grid
              item
              sm={12}
              xs={12}
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
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F5F5F7' }}>
              <TableRow>
                <TableCell width='30%'>Product Name</TableCell>
                <TableCell width='20%'>Batch</TableCell>
                <TableCell width='20%'>Expiry Date</TableCell>
                <TableCell width='10%' align='right'>
                  Quantity
                </TableCell>
                {/* <TableCell align='right'>Free Quantity</TableCell> */}
                {/* <TableCell align='right'>Rate</TableCell>
                <TableCell align='right'>Discount in %</TableCell>
                <TableCell align='right'>GST in %</TableCell>
                <TableCell align='right'>Net Amount</TableCell> */}
                <TableCell width='20%' align='center'>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {editParams.purchase_details
                ? editParams.purchase_details.map((el, index) => {
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {el.medicine_name}
                          <Typography variant='body2'>{el.package_details}</Typography>
                          <Typography variant='body2'>{el.manufacture}</Typography>
                        </TableCell>
                        <TableCell>{el.purchase_batch_no}</TableCell>
                        <TableCell>
                          {el?.stock_type === 'non_medical' ? 'NA' : Utility.formatDisplayDate(el.purchase_expiry_date)}
                        </TableCell>
                        <TableCell align='right'>{el.purchase_qty}</TableCell>
                        {/* <TableCell align='right'>{el.purchase_free_quantity}</TableCell> */}
                        {/* <TableCell align='right'>{el.purchase_unit_price}</TableCell>
                        <TableCell align='right'>{el.purchase_discount}%</TableCell>

                        <TableCell align='right'>{el.purchase_igst}%</TableCell>
                        <TableCell align='right'>{el.purchase_net_amount}</TableCell> */}
                        <TableCell align='center'>
                          {el.id ? null : (
                            <IconButton
                              size='small'
                              sx={{ mr: 0.5 }}
                              aria-label='Edit'
                              onClick={() => {
                                setMedicineItemId(el.purchase_unit_id)
                                editTableData(el.purchase_unit_id, index, el.purchase_batch_no)
                                showDialog()
                              }}
                            >
                              <Icon icon='mdi:pencil-outline' />
                            </IconButton>
                          )}

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
        {/* <Grid container>
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

                <CalcWrapper>
                  <Typography variant='body2'>Grand Total :</Typography>
                  <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                    {totalLineItemsPurchase?.toFixed(2)}
                  </Typography>
                </CalcWrapper>
              </CardContent>
            </Card>
          </Grid>
        </Grid> */}
        <Grid item xs={12}>
          <Box sx={{ float: 'right', my: 4, mx: 6 }}>
            <LoadingButton
              disabled={editParams.purchase_details.length > 0 ? false : true}
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
      </CardContent>
    </Card>
  )
}

export default AddExistingPurchase
