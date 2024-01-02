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
import toast from 'react-hot-toast'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
// ** React Imports
import { forwardRef, useState, useEffect, useCallback } from 'react'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import CustomChip from 'src/@core/components/mui/chip'

import CommonDialogBox from 'src/components/CommonDialogBox'
import SingleDatePicker from 'src/components/SingleDatePicker'
import { debounce } from 'lodash'

import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { getMedicineList } from 'src/lib/api/pharmacy/getMedicineList'

import { getAvailableMedicineByMedicineId } from 'src/lib/api/pharmacy/getRequestItemsList'

import { addReturnItems, updateReturnItems, getReturnItemsListById } from 'src/lib/api/pharmacy/returnRequest'
import Utility from 'src/utility'
import { AddItemsForm } from 'src/views/pages/pharmacy/return/add-items-form'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'

const CalcWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '&:not(:last-of-type)': {
    marginBottom: theme.spacing(2)
  }
}))

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { boolean } from 'yup'

const editParamsInitialState = {
  // from_store_type: '',
  to_store_type: '',

  // from_store_id: '',
  to_store_id: '',
  // from_store_type: '',
  ro_date: Utility.formattedPresentDate(),
  total_qty: '',
  priority_item: 'Normal',
  request_item_details: []
}

const initialNestedRowMedicine = {
  request_item_medicine_id: '',
  medicine_name: '',
  request_item_qty: '',
  request_item_leaf_id: '',
  priority_item: 'Normal',
  control_substance: false,
  control_substance_file: ''
}

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
})

const AddReturnRequest = () => {
  // ** Hook
  const [toStocks, setToStocks] = useState([])
  const [fromStocks, setFromStocks] = useState([])
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [optionsMedicineList, setOptionsMedicineList] = useState([])
  const [optionsBatchList, setOptionsBatchList] = useState([])
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [itemErrors, setItemErrors] = useState({})
  const [medicineItemId, setMedicineItemId] = useState('')
  const [submitLoader, setSubmitLoader] = useState(false)
  const [duplicateMedError, setDuplicateMedError] = useState('')

  const [nestedRowMedicine, setNestedRowMedicine] = useState(initialNestedRowMedicine)

  const [productLoading, setProductLoading] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  const router = useRouter()
  const { id, action } = router.query

  const { selectedPharmacy } = usePharmacyContext()

  const storesType = {
    local: 1,
    central: 2
  }

  const filteredStoreType = value => {
    const storeType = fromStocks?.find(item => item.id == value)?.type

    return storeType
  }

  const closeDialog = () => {
    setShow(false)
    setNestedRowMedicine(initialNestedRowMedicine)
    setMedicineItemId('')
    setDuplicateMedError('')
  }

  const showDialog = () => {
    setShow(true)
  }

  // local nested items delete
  const removeItemsFroTable = itemId => {
    const updatedItems = editParams.request_item_details.filter(el => {
      return el.request_item_medicine_id != itemId
    })
    setEditParams({ ...editParams, request_item_details: updatedItems })
    setMedicineItemId('')
  }

  const totalQty = editParams.request_item_details?.reduce((acc, row) => acc + parseInt(row.request_item_qty), 0)

  const addItemsToTable = params => {
    // const newData = {
    //   medicine_name: nestedRowMedicine.medicine_name,
    //   request_item_medicine_id: nestedRowMedicine.request_item_medicine_id,
    //   // id: nestedRowMedicine.id,
    //   request_item_qty: nestedRowMedicine.request_item_qty,
    //   // dosageForm: nestedRowMedicine.dosageForm,
    //   priority_item: nestedRowMedicine.priority_item,
    //   control_substance: nestedRowMedicine.control_substance,
    //   control_substance_file: nestedRowMedicine.control_substance_file,
    //   request_item_leaf_id: ''
    // }

    const updatedNestedRows = [...editParams.request_item_details, params]
    setEditParams({
      ...editParams,
      request_item_details: updatedNestedRows
    })

    setNestedRowMedicine(initialNestedRowMedicine)
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
    if (!values.request_item_qty) {
      itemErrors.request_item_qty = 'This field is required'
    }
    if (!values.priority_item) {
      itemErrors.priority_item = 'This field is required'
    }
    if (!values.control_substance_file) {
      itemErrors.control_substance_file = 'This field is required'
    }
    // if (values.control_substance) {
    if (values.control_substance === true) {
      if (values.control_substance_file.length === 0) {
        itemErrors.control_substance_file = 'This field is required'
      }
    }
    // itemErrors.control_substance = 'This field is required'
    // }

    return itemErrors
  }

  const validateItems = values => {
    const errors = {}

    // if (!values.from_store_id) {
    //   errors.from_store_id = 'This field is required'
    // }
    if (!values.to_store_id) {
      errors.to_store_id = 'This field is required'
    }
    if (!values.ro_date) {
      errors.ro_date = 'This field is required'
    }

    return errors
  }

  const submitItems = params => {
    // const HasErrors =
    //   !nestedRowMedicine.medicine_name || !nestedRowMedicine.request_item_qty || !nestedRowMedicine.priority_item
    // // || !nestedRowMedicine.control_substance
    // if (HasErrors) {
    //   setItemErrors(validate(nestedRowMedicine))

    //   return
    // }
    // if (params.control_substance === true) {
    //   if (nestedRowMedicine.control_substance_file.length === 0) {
    //     setItemErrors(validate(nestedRowMedicine))

    //     return
    //   }
    // }
    debugger

    const isMedicineAlreadyExists = editParams.request_item_details.some(
      item =>
        item.request_item_medicine_id === params.request_item_medicine_id &&
        item.request_item_batch_no === params.request_item_batch_no
    )

    if (isMedicineAlreadyExists) {
      setDuplicateMedError('Batch already exists')
      console.log('Medicine already exists')

      return
    }
    setErrors({})
    addItemsToTable(params)
    closeDialog()
  }

  const updateTableItems = () => {
    const itemId = medicineItemId
    const updatedState = { ...editParams }

    const updatedIndex = updatedState.request_item_details.findIndex(row => row.request_item_medicine_id === itemId)

    if (updatedIndex !== -1) {
      const updatedNestedRows = [...updatedState.request_item_details]
      updatedNestedRows[updatedIndex] = {
        ...updatedNestedRows[updatedIndex],
        ...nestedRowMedicine
      }
      updatedState.request_item_details = updatedNestedRows

      setEditParams(updatedState)
      setNestedRowMedicine(initialNestedRowMedicine)
      setMedicineItemId('')
    } else {
      console.error('updateTableItems error')
    }
  }

  const updateFormItems = () => {
    const HasErrors =
      !nestedRowMedicine.medicine_name || !nestedRowMedicine.request_item_qty || !nestedRowMedicine.priority_item
    // ||!nestedRowMedicine.control_substance
    if (HasErrors) {
      setItemErrors(validate(nestedRowMedicine))

      return
    }
    if (nestedRowMedicine.control_substance === true) {
      if (nestedRowMedicine.control_substance_file.length === 0) {
        setItemErrors(validate(nestedRowMedicine))

        return
      }
    }
    setErrors({})
    updateTableItems()
  }

  const handleSubmit = () => {
    const formHasErrors = !editParams.to_store_id || !editParams.ro_date
    if (formHasErrors) {
      setErrors(validateItems(editParams))

      return
    }

    setErrors({})
    showDialog()
  }

  const filterToStocks = id => {
    const optionsForSelectB = fromStocks.filter(option => option.id !== id)
    setToStocks(optionsForSelectB)
  }

  const getStoresLists = async () => {
    // setLoader(true)
    try {
      const response = await getStoreList({ params: { q: 'central', column: 'type' } })

      if (response?.data?.list_items?.length > 0) {
        setFromStocks(response?.data?.list_items)
        setToStocks(response?.data?.list_items)
      }
    } catch (error) {
      console.log('err', error)
    }
  }

  useEffect(() => {
    getStoresLists()
  }, [])

  //  ****** debounce
  const fetchMedicineData = async searchText => {
    if (searchText !== '') {
      try {
        setProductLoading(true)

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
              control_substance: item.controlled_substance === '1' ? true : false
            }))
          )
        }
        setProductLoading(false)
      } catch (e) {
        console.log('error', e)
        setProductLoading(false)
      }
    }
  }

  const fetchBatchData = async id => {
    debugger
    if (id !== '') {
      try {
        setBatchLoading(true)
        const data = { stock_item_id: id }
        const searchResults = await getAvailableMedicineByMedicineId(id, data, 'all')
        debugger
        if (searchResults?.success) {
          debugger

          if (searchResults?.data?.length > 0) {
            debugger

            // const data = searchResults?.data.map(item => ({
            //   value: item?.batch_no,
            //   label: item?.batch_no,
            //   expiry_date: item?.expiry_date
            // }))
            // console.log('searchResults', data)
            setOptionsBatchList(
              searchResults?.data.map(item => ({
                value: item?.batch_no,
                label: item?.batch_no,
                expiry_date: item?.expiry_date
              }))
            )
          }
          debugger
          console.log('searchResults', optionsBatchList)
          // setOptionsBatchList()

          console.log('optionsBatchList', optionsBatchList)
        } else {
          setOptionsBatchList([])
        }
        setBatchLoading(false)
      } catch (e) {
        console.log('error', e)
        setBatchLoading(false)
        setOptionsBatchList([])
      }
    }
  }

  const searchBatchData = useCallback(
    debounce(async id => {
      debugger
      try {
        await fetchBatchData(id)
      } catch (error) {
        console.error(error)
      }
    }, 500),
    []
  )

  const searchMedicineData = useCallback(
    debounce(async searchText => {
      try {
        await fetchMedicineData(searchText)
      } catch (error) {
        console.error(error)
      }
    }, 500),
    []
  )
  //  ****** debounce

  const getListOfItemsById = async id => {
    const result = await getReturnItemsListById(id)

    if (result.success === true && result.data !== '') {
      const lineItems = result.data.request_item_details.map(el => {
        return {
          request_item_medicine_id: el.stock_item_id,
          medicine_name: el.stock_name,
          request_item_qty: el.qty,
          request_item_leaf_id: el.stock_item_id,
          priority_item: el.priority,
          control_substance: el.control_substance === '0' ? false : true,
          control_substance_file: el.control_substance_file !== '' ? el.control_substance_file : '',
          id: el.id,
          request_item_detail_id: el.id
        }
      })

      setEditParams({
        ...editParams,
        id: result.data.id,
        // from_store_id: result.data.from_store_id,
        to_store_id: result.data.to_store_id,
        ro_date: result.data.request_date,
        // from_store_type: result.data.from_store_type,
        to_store_type: result.data.to_store_type,
        request_item_details: lineItems
      })
      // }
    }
  }

  // ****** edit section //////
  const editTableData = itemId => {
    if (id != undefined && action === 'edit') {
      const getItems = editParams.request_item_details.filter(el => {
        return el.request_item_medicine_id === itemId
      })

      setNestedRowMedicine({
        ...nestedRowMedicine,
        request_item_medicine_id: getItems[0].request_item_medicine_id,
        medicine_name: getItems[0].medicine_name,
        request_item_qty: getItems[0].request_item_qty,
        request_item_batch_no: getItems[0].request_item_batch_no,
        expiry_date: getItems[0].expiry_date,
        request_item_leaf_id: getItems[0].request_item_leaf_id,
        priority_item: getItems[0].priority_item,
        control_substance: getItems[0].control_substance,
        control_substance_file: getItems[0].control_substance_file,
        id: getItems[0].id
      })
    } else {
      const getItems = editParams.request_item_details.filter(el => {
        return el.request_item_medicine_id === itemId
      })

      debugger

      setNestedRowMedicine({
        ...nestedRowMedicine,
        medicine_name: getItems[0].product_name,
        request_item_medicine_id: getItems[0].request_item_medicine_id,
        request_item_batch_no: getItems[0].request_item_batch_no,
        expiry_date: getItems[0].expiry_date,
        // id: getItems[0].id,
        request_item_qty: getItems[0].request_item_qty,
        control_substance_file: getItems[0].control_substance_file ? getItems[0].control_substance_file : '',
        priority_item: getItems[0].priority_item,
        control_substance: getItems[0].control_substance
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
    setSubmitLoader(true)
    const postData = editParams
    postData.total_qty = totalQty

    if (id) {
      try {
        const response = await updateReturnItems(id, postData)

        if (response?.success) {
          toast.success(response?.message)
          setSubmitLoader(false)
          getListOfItemsById(id)
          Router.push('/pharmacy/request/request-list/')
        } else {
          setSubmitLoader(false)
          toast.error(response?.message)
        }
      } catch (error) {
        console.log('error', error)
      }
    } else {
      try {
        const response = await addReturnItems(postData)
        if (response?.success) {
          toast.success(response?.message)
          setEditParams(editParamsInitialState)
          setSubmitLoader(false)
          Router.push('/pharmacy/request/request-list/')
        } else {
          setSubmitLoader(false)
          toast.error(response?.message)
        }
      } catch (error) {
        console.log('error', error)
      }
    }
  }

  // data posting section
  const createForm = () => {
    return (
      <AddItemsForm
        searchBatchData={searchBatchData}
        searchMedicineData={searchMedicineData}
        productList={optionsMedicineList}
        productLoading={productLoading}
        batchLoading={batchLoading}
        onSubmitData={submitItems}
        batchList={optionsBatchList}
        nestedMedicine={nestedRowMedicine}
        error={duplicateMedError}
      />
      // <CardContent>
      //   <form
      //   // addItemsToTable={addMultipleMedicine(addItemsToTable)}
      //   >
      //     <Grid container spacing={5}>
      //       <Grid item xs={12} sm={6}>
      //         <FormControl fullWidth>
      //           <Autocomplete
      //             inputProps={{ tabIndex: '6' }}
      //             disablePortal
      //             id='autocomplete-controlled'
      //             options={optionsMedicineList}
      //             value={nestedRowMedicine.medicine_name}
      //             onChange={(event, newValue) => {
      //               setNestedRowMedicine({
      //                 ...nestedRowMedicine,
      //                 medicine_name: newValue?.label,
      //                 request_item_medicine_id: newValue?.value,
      //                 control_substance: newValue?.control_substance
      //               })
      //               setDuplicateMedError('')
      //               setItemErrors({})
      //             }}
      //             onKeyUp={e => {
      //               searchMedicineData(e.target.value)
      //               setItemErrors({})
      //             }}
      //             renderInput={params => (
      //               <TextField {...params} label='Product Name*' error={Boolean(itemErrors.medicine_name)} />
      //             )}
      //           />
      //           {itemErrors.medicine_name && (
      //             <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
      //               This field is required
      //             </FormHelperText>
      //           )}
      //           {duplicateMedError && (
      //             <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
      //               {duplicateMedError}
      //             </FormHelperText>
      //           )}
      //         </FormControl>
      //       </Grid>

      //       <Grid item xs={12} sm={6}>
      //         <FormControl fullWidth>
      //           <TextField
      //             type='number'
      //             value={nestedRowMedicine.request_item_qty}
      //             error={Boolean(itemErrors.request_item_qty)}
      //             label='Quantity*'
      //             onChange={event => {
      //               setNestedRowMedicine({ ...nestedRowMedicine, request_item_qty: event.target.value })
      //               setItemErrors({})
      //             }}
      //           />
      //           {itemErrors.request_item_qty && (
      //             <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
      //               This field is required
      //             </FormHelperText>
      //           )}
      //         </FormControl>
      //       </Grid>

      //       <Grid item xs={12} sm={6}>
      //         <Typography sx={{ mb: 2 }}>Priority</Typography>

      //         <FormControl fullWidth>
      //           <ToggleButtonGroup
      //             exclusive
      //             color='primary'
      //             value={nestedRowMedicine.priority_item}
      //             onChange={event => {
      //               setNestedRowMedicine({ ...nestedRowMedicine, priority_item: event.target.value })
      //             }}
      //           >
      //             test
      //             <ToggleButton color='error' value='high'>
      //               High
      //             </ToggleButton>
      //             <ToggleButton color='primary' value='Normal'>
      //               Normal
      //             </ToggleButton>
      //           </ToggleButtonGroup>

      //           {itemErrors.priority_item && (
      //             <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
      //               This field is required
      //             </FormHelperText>
      //           )}
      //         </FormControl>
      //       </Grid>

      //       {/* // file uploader */}
      //       {nestedRowMedicine.control_substance === true ? (
      //         nestedRowMedicine.control_substance_file ? (
      //           <Grid item xs={12} sm={6}>
      //             {nestedRowMedicine.control_substance_file?.type === 'application/pdf' ? (
      //               <Chip
      //                 label={nestedRowMedicine.control_substance_file?.name}
      //                 color='secondary'
      //                 onDelete={() => {
      //                   setNestedRowMedicine({
      //                     ...nestedRowMedicine,
      //                     // control_substance: false,
      //                     control_substance_file: ''
      //                   })
      //                 }}
      //                 deleteIcon={<Icon icon='mdi:delete-outline' />}
      //               />
      //             ) : nestedRowMedicine.control_substance_file?.type === 'image/png' ||
      //               nestedRowMedicine.control_substance_file?.type === 'image/jpeg' ? (
      //               <>
      //                 <Chip
      //                   label={nestedRowMedicine.control_substance_file?.name}
      //                   avatar={
      //                     <Avatar
      //                       alt={nestedRowMedicine.control_substance_file?.name}
      //                       src={
      //                         nestedRowMedicine.control_substance_file
      //                           ? URL.createObjectURL(nestedRowMedicine.control_substance_file)
      //                           : ''
      //                       }
      //                     />
      //                   }
      //                   onDelete={() => {
      //                     setNestedRowMedicine({
      //                       ...nestedRowMedicine,
      //                       // control_substance: false,
      //                       control_substance_file: ''
      //                     })
      //                   }}
      //                 />
      //               </>
      //             ) : (
      //               <Chip
      //                 label={nestedRowMedicine.control_substance_file}
      //                 avatar={
      //                   <Avatar
      //                     alt='image'
      //                     src={`${process.env.NEXT_PUBLIC_IMAGES_BASE_URL}${nestedRowMedicine.control_substance_file}`}
      //                   />
      //                 }
      //                 onDelete={() => {
      //                   setNestedRowMedicine({
      //                     ...nestedRowMedicine,
      //                     // control_substance: false,
      //                     control_substance_file: ''
      //                   })
      //                 }}
      //               />
      //             )}
      //           </Grid>
      //         ) : (
      //           <Grid item xs={12} sm={6}>
      //             <Typography sx={{ mb: 2 }}>Attach prescription (Mandatory for controlled substances)</Typography>
      //             <FormControl fullWidth>
      //               <TextField
      //                 type='file'
      //                 accept='.pdf, .jpeg, .jpg, .png'
      //                 error={Boolean(itemErrors.control_substance_file)}
      //                 // label='Attach prescription'
      //                 onChange={e => {
      //                   const file = e.target.files[0]
      //                   setNestedRowMedicine({ ...nestedRowMedicine, control_substance_file: file })
      //                   setItemErrors({})
      //                 }}
      //               />
      //               {itemErrors.control_substance_file && (
      //                 <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
      //                   This field is required
      //                 </FormHelperText>
      //               )}
      //             </FormControl>
      //           </Grid>
      //         )
      //       ) : null}
      //       {/* // file uploader */}

      //       <Grid item xs={12}>
      //         <>
      //           {medicineItemId ? (
      //             <>
      //               <Button
      //                 onClick={() => {
      //                   closeDialog()
      //                 }}
      //                 size='large'
      //                 variant='outlined'
      //                 sx={{ mr: 2 }}
      //               >
      //                 Done
      //               </Button>
      //               <Button
      //                 onClick={() => {
      //                   updateFormItems()
      //                   closeDialog()
      //                   // submitItems()
      //                 }}
      //                 size='large'
      //                 variant='contained'
      //               >
      //                 update
      //               </Button>
      //             </>
      //           ) : (
      //             <>
      //               <Button
      //                 onClick={() => {
      //                   closeDialog()
      //                 }}
      //                 size='large'
      //                 variant='outlined'
      //                 sx={{ mr: 2 }}
      //               >
      //                 Done
      //               </Button>
      //               <Button
      //                 onClick={() => {
      //                   // updateFormItems()
      //                   submitItems()
      //                 }}
      //                 size='large'
      //                 variant='contained'
      //               >
      //                 Add
      //               </Button>
      //             </>
      //           )}
      //         </>
      //       </Grid>
      //     </Grid>
      //   </form>
      // </CardContent>
    )
  }

  return (
    <>
      {selectedPharmacy.type === 'local' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') ? (
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
            <CardHeader title='Return Request Item' />

            <Button
              sx={{
                mx: { sm: 6, xs: 'auto' }
              }}
              size='big'
              variant='contained'
              onClick={() => {
                Router.push('/pharmacy/return-product/request-list/')
              }}
            >
              Request Item List
            </Button>
          </Grid>
          <CardContent>
            <Grid container>
              <CommonDialogBox
                title={'Add Request Item'}
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
                    <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                      <Typography variant='subtitle2' sx={{ mb: 3, color: 'text.primary', letterSpacing: '.1px' }}>
                        Returned to :
                      </Typography>
                    </Grid>
                    <FormControl fullWidth>
                      <InputLabel id='state_id' error={Boolean(errors.to_store_id)}>
                        Store*
                      </InputLabel>

                      <Select
                        error={Boolean(errors.to_store_id)}
                        value={editParams.to_store_id}
                        label='Store*'
                        disabled={id ? true : false}
                        onChange={e => {
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
                        {toStocks?.map((item, index) => (
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
                  </Grid>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                    <Typography variant='subtitle2' sx={{ mb: 3, color: 'text.primary', letterSpacing: '.1px' }}>
                      &nbsp;
                    </Typography>
                  </Grid>
                  {/* <Grid xs={12} sm={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <InputLabel error={Boolean(errors.from_store_id)}>Store*</InputLabel>
                  <Select
                    value={editParams.from_store_id}
                    error={Boolean(errors.from_store_id)}
                    label='Store*'
                    disabled={id ? true : false}
                    onChange={e => {
                      filterToStocks(e.target.value)
                      setEditParams({
                        ...editParams,
                        from_store_id: e.target.value,
                        from_store_type: storesType[filteredStoreType(e.target.value)]
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

                  {errors.from_store_id && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid> */}
                  <Grid item xs={12} sm={12} lg={12} sx={{ mx: 'auto', mb: 5 }}>
                    <FormControl fullWidth>
                      <SingleDatePicker
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
                      />
                      {errors.ro_date && (
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
            sm={12}
            xs={12}
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              mb: 4
            }}
          >
            <Button
              sx={{
                mx: { sm: 6, xs: 'auto' }
              }}
              onClick={() => {
                handleSubmit()
              }}
              size='big'
              variant='contained'
            >
              Add Request Item
            </Button>
          </Grid>

          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#F5F5F7' }}>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Batch No</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editParams.request_item_details
                  ? editParams.request_item_details.map((el, index) => {
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant='body2' sx={{ color: 'text.primary' }}>
                              {el.product_name}
                              {console.log(el)}
                            </Typography>
                            {el.control_substance ? (
                              <CustomChip label='CS' skin='light' color='success' size='small' />
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' sx={{ color: 'text.primary' }}>
                              {el.request_item_batch_no}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' sx={{ color: 'text.primary' }}>
                              {el.expiry_date}
                            </Typography>
                          </TableCell>
                          <TableCell>{el.priority_item}</TableCell>

                          <TableCell>{el.request_item_qty}</TableCell>

                          <TableCell>
                            <IconButton
                              size='small'
                              sx={{ mr: 0.5 }}
                              aria-label='Edit'
                              onClick={() => {
                                setMedicineItemId(el.request_item_medicine_id)

                                editTableData(el.request_item_medicine_id)
                                showDialog()
                                // }
                              }}
                            >
                              <Icon icon='mdi:pencil-outline' />
                            </IconButton>
                            {id && el.request_item_detail_id ? null : (
                              <IconButton
                                onClick={() => {
                                  removeItemsFroTable(el.request_item_medicine_id)
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
          <CardContent sx={{ pt: 8 }}>
            {totalQty ? (
              <Grid container>
                <Grid
                  item
                  xs={12}
                  sm={2}
                  lg={2}
                  sx={{
                    mb: { sm: 0, xs: 4 },
                    order: { sm: 2, xs: 1 },
                    marginLeft: 'auto',
                    mr: { sm: 12, xs: 0 }
                  }}
                >
                  <CalcWrapper>
                    <Typography variant='body2'>Total Qty:</Typography>
                    <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                      {totalQty}
                    </Typography>
                  </CalcWrapper>

                  <Divider
                    sx={{
                      mt: theme => `${theme.spacing(5)} !important`,
                      mb: theme => `${theme.spacing(3)} !important`
                    }}
                  />
                </Grid>
              </Grid>
            ) : null}
          </CardContent>
          <LoadingButton
            disabled={editParams.request_item_details.length > 0 ? false : true}
            sx={{ float: 'right', my: 4, mx: 6 }}
            size='large'
            onClick={() => {
              postItemsData()
            }}
            variant='contained'
            loading={submitLoader}
          >
            Save
          </LoadingButton>
        </Card>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default AddReturnRequest
