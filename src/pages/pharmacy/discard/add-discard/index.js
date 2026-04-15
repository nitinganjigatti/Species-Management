// ** MUI Imports
import {
  Button,
  Drawer,
  Grid,
  Card,
  Table,
  Divider,
  TableRow,
  TableHead,
  TableBody,
  Typography,
  Box,
  TableContainer,
  TableCell,
  IconButton,
  FormHelperText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  styled
} from '@mui/material'
import { useTheme } from '@emotion/react'

import Router from 'next/router'
import { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import toast from 'react-hot-toast'

// ** React Imports
import { forwardRef, useState, useEffect, useCallback } from 'react'
import CustomChip from 'src/@core/components/mui/chip'

import { v4 as uuidv4 } from 'uuid'

import CommonDialogBox from 'src/components/CommonDialogBox'
import { debounce } from 'lodash'

import { getMedicineList } from 'src/lib/api/pharmacy/getMedicineList'

import { getAvailableMedicineByMedicineId } from 'src/lib/api/pharmacy/getRequestItemsList'

import { addDiscard, getDiscardItemsListById, getDiscardReasonsList } from 'src/lib/api/pharmacy/discard'
import Utility from 'src/utility'
import { AddItemsForm } from 'src/views/pages/pharmacy/discard/add-discard-form'
import Error404 from 'src/pages/404'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'
import SingleDatePicker from 'src/components/SingleDatePicker'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import { getSuppliers } from 'src/lib/api/pharmacy/getSupplierList'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'

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
import { AddButton, RequestCancelButton } from 'src/components/Buttons'
import RenderUtility from 'src/utility/render'
import { alpha, Stack } from '@mui/system'
import { AddButtonContained, ExcelExportButton } from 'src/components/ButtonContained'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import { ExportButton } from 'src/views/utility/render-snippets'

const editParamsInitialState = {
  supplier_id: '',
  discarded_date: Utility.formattedPresentDate(),
  items: []
}

const initialNestedRowMedicine = {
  stock_id: '',
  batch_no: '',
  quantity: '',
  comments: '',
  expiry_date: '',
  medicine_name: '',
  uuid: '',
  stock_type: '',
  reason: '',
  variant_id: '',
  multiplier: '',
  unit_price: ''
}

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
})

const AddDiscardProducts = () => {
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [optionsMedicineList, setOptionsMedicineList] = useState([])
  const [optionsBatchList, setOptionsBatchList] = useState([])
  const [totalBatchQuantity, setTotalBatchQuantity] = useState(0)
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [itemErrors, setItemErrors] = useState({})
  const [medicineItemId, setMedicineItemId] = useState('')
  const [submitLoader, setSubmitLoader] = useState(false)
  const [duplicateMedError, setDuplicateMedError] = useState(false)
  const [supplierList, setSupplierList] = useState([])
  const [excelLoader, setExcelLoader] = useState(false)

  const [nestedRowMedicine, setNestedRowMedicine] = useState(initialNestedRowMedicine)
  const [visibleExpiryField, setVisibleExpiryField] = useState(false)
  const [productLoading, setProductLoading] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  const [reasonsOptions, setReasonsOptions] = useState([])

  const router = useRouter()
  const { id, action } = router.query
  const theme = useTheme()

  const totalDispatchValue = editParams.items.reduce((total, item) => {
    return total + item.quantity * parseFloat(item.unit_price)
  }, 0)

  const { selectedPharmacy } = usePharmacyContext()

  const closeDialog = () => {
    setShow(false)
    setNestedRowMedicine(initialNestedRowMedicine)
    setMedicineItemId('')
    setDuplicateMedError(false)
    setOptionsBatchList([])
    setTotalBatchQuantity(0)
  }

  const showDialog = () => {
    setShow(true)
    setVisibleExpiryField(false)
  }

  const getOptionsList = async () => {
    try {
      const status = await getDiscardReasonsList()
      if (status?.success) {
        setReasonsOptions(status?.data?.reasons)
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  const getSupplierList = async () => {
    try {
      const response = await getSuppliers()

      let listWithId = response?.data?.data?.list_items
        ? response?.data?.data?.list_items.map((el, i) => {
            return { ...el, uid: i + 1 }
          })
        : []

      setSupplierList(listWithId)
    } catch (error) {}
  }

  const removeItemsFromTable = itemId => {
    const updatedItems = editParams?.items?.filter(el => {
      return el.uuid != itemId
    })
    setEditParams({ ...editParams, items: updatedItems })
    setMedicineItemId('')
  }

  const totalQty = editParams.items?.reduce((acc, row) => acc + parseInt(row.quantity), 0)

  const addItemsToTable = params => {
    const updatedNestedRows = [...editParams.items, params]
    setEditParams({
      ...editParams,
      items: updatedNestedRows
    })

    setNestedRowMedicine(initialNestedRowMedicine)
  }

  const validate = values => {
    const itemErrors = {}
    if (!values.medicine_name || values.medicine_name === '') {
      itemErrors.medicine_name = 'This field is required'
    }
    if (!values.quantity) {
      itemErrors.quantity = 'This field is required'
    }

    return itemErrors
  }

  const validateItems = values => {
    const errors = {}

    if (!values.supplier_id) {
      errors.supplier_id = 'This field is required'
    }

    return errors
  }

  const submitItems = (params, type) => {
    setDuplicateMedError(false)

    const isMedicineAlreadyExists = editParams?.items?.some(
      item => item.stock_id === params.stock_id && item.batch_no === params.batch_no && params.uuid !== item.uuid
    )

    if (isMedicineAlreadyExists) {
      setDuplicateMedError(true)

      return
    }

    setErrors({})
    var tempParams = params
    if (tempParams?.uuid === '') {
      tempParams.uuid = uuidv4()
      addItemsToTable(tempParams)
    } else {
      updateFormItems(params)
    }

    closeDialog()
  }

  const updateTableItems = params => {
    const itemId = medicineItemId
    const updatedState = { ...editParams }

    const updatedIndex = updatedState?.items?.findIndex(row => row.uuid === params.uuid)

    if (updatedIndex !== -1) {
      const updatedNestedRows = [...updatedState.items]
      updatedNestedRows[updatedIndex] = {
        ...updatedNestedRows[updatedIndex],
        ...params
      }
      updatedState.items = updatedNestedRows

      setEditParams(updatedState)
      setNestedRowMedicine(initialNestedRowMedicine)
      setMedicineItemId('')
    } else {
      console.error('updateTable Items error')
    }
  }

  const updateFormItems = params => {
    const HasErrors = !params.medicine_name || !params.quantity
    if (HasErrors) {
      setItemErrors(validate(params))

      return
    }

    setErrors({})
    updateTableItems(params)
  }

  const handleSubmit = () => {
    const formHasErrors = !editParams.supplier_id
    if (formHasErrors) {
      setErrors(validateItems(editParams))

      return
    }

    setErrors({})
    showDialog()
  }

  const fetchMedicineData = async searchText => {
    try {
      setProductLoading(true)

      const params = {
        sort: 'asc',
        q: searchText,
        limit: 20
      }

      const searchResults = await getMedicineList({ params: params })
      if (searchResults?.data?.list_items?.length > 0) {
        setOptionsMedicineList(
          searchResults?.data?.list_items?.map(item => ({
            value: item.id,
            label: item.name,
            status: item?.active === '0' ? 0 : 1,
            control_substance: item.controlled_substance === '1' ? true : false,
            stock_type: item.stock_type,
            packageDetails: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
            manufacture: item?.manufacturer_name,
            unit_price: item?.unit_price
          }))
        )
      }
      setProductLoading(false)
    } catch (e) {
      console.log('error', e)
      setProductLoading(false)
    }
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

  const fetchBatchData = async (id, productType) => {
    if (id !== '') {
      try {
        setBatchLoading(true)
        const data = { stock_item_id: id }
        const searchResults = await getAvailableMedicineByMedicineId(id, data, 'central', productType, { is_return: 1 })

        if (searchResults?.success) {
          if (searchResults?.data?.items?.length > 0) {
            // const data = searchResults?.data.map(item => ({
            //   value: item?.batch_no,
            //   label: item?.batch_no,
            //   expiry_date: item?.expiry_date
            // }))
            // console.log('searchResults', data)
            setOptionsBatchList(
              searchResults?.data?.items?.map(item => ({
                value: item?.batch_no,
                label: item?.batch_no,
                expiry_date: item?.expiry_date,
                available_item_qty: item?.qty,
                packageDetails: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
                manufacture: item?.manufacturer_name,
                variant_id: item?.variant_id,
                multiplier: item?.multiplier,
                stock_type: item?.stock_type,
                unit_price: item?.unit_price
              }))
            )
            setTotalBatchQuantity(searchResults?.data?.total_quantity)
          } else {
            setTotalBatchQuantity(0)
          }
        } else {
          setOptionsBatchList([])
          setTotalBatchQuantity(0)
        }
        setBatchLoading(false)
      } catch (e) {
        console.log('error', e)
        setOptionsBatchList([])
        setBatchLoading(false)
        setOptionsBatchList([])
        setTotalBatchQuantity(0)
      }
    }
  }

  useEffect(() => {
    getSupplierList()
    getOptionsList()
    fetchMedicineData()
  }, [])

  const searchBatchData = useCallback(
    debounce(async (id, productType) => {
      try {
        await fetchBatchData(id, productType)
      } catch (error) {
        console.error(error)
      }
    }, 500),
    []
  )

  const searchMedicineData = useCallback(
    debounce(async searchText => {
      try {
        // await fetchMedicineData(searchText)
        const params = {
          sort: 'asc',
          q: searchText
          // limit: 20
        }

        const searchResults = await getMedicineList({ params: params })
        if (searchResults?.data?.list_items?.length > 0) {
          setOptionsMedicineList(
            searchResults?.data?.list_items?.map(item => ({
              value: item.id,
              label: item.name,
              status: item?.active === '0' ? 0 : 1,
              control_substance: item.controlled_substance === '1' ? true : false,
              stock_type: item.stock_type,
              packageDetails: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
              manufacture: item?.manufacturer_name,
              unit_price: item?.unit_price
            }))
          )
        }
      } catch (error) {
        console.error(error)
      }
    }, 500),
    []
  )

  const getListOfItemsById = async id => {
    try {
      const result = await getDiscardItemsListById(id)
      if (result.success === true && result?.data?.item_details?.length > 0) {
        const lineItems = result?.data?.item_details?.map(el => {
          return {
            stock_id: el?.product_id,

            // medicine_name: el?.stock_name,
            medicine_name: el?.stock_name,
            quantity: el?.quantity,
            request_item_leaf_id: el?.stock_item_id,
            priority_item: el?.priority,
            control_substance: el?.control_substance === '1' ? true : false,
            control_substance_file: el?.control_substance_file !== '' ? el?.control_substance_file : '',
            id: el?.id,
            request_item_detail_id: el?.id,
            batch_no: el?.batch_no,
            expiry_date: el?.expiry_date,
            uuid: uuidv4(),
            available_item_qty: el?.batch_available_qty,
            dispatch_item_id: el?.dispatch_item_id,
            stock_type: el?.stock_type,
            packageDetails: `${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`,
            manufacture: el?.manufacturer_name,
            comments: el?.comments,
            reason: el?.reason,
            unit_price: el?.unit_price
          }
        })

        setEditParams({
          ...editParams,
          id: result.data.id,
          supplier_id: result?.data?.supplier_id,
          discarded_date: result?.data?.discarded_date,
          items: lineItems
        })
      }
    } catch (error) {
      console.log('direct dispatch items update', error)
    }
  }

  const editTableData = itemId => {
    const getItems = editParams?.items?.filter(el => {
      return el.uuid === itemId
    })

    setNestedRowMedicine({
      ...nestedRowMedicine,
      medicine_name: getItems[0].medicine_name,
      stock_id: getItems[0].stock_id,
      batch_no: getItems[0].batch_no,
      expiry_date: getItems[0].expiry_date,

      // id: getItems[0].id,
      quantity: getItems[0].quantity,
      control_substance_file: getItems[0].control_substance_file ? getItems[0].control_substance_file : '',
      priority_item: getItems[0].priority_item,
      control_substance: getItems[0].control_substance,
      uuid: getItems[0].uuid,
      available_item_qty: getItems[0]?.available_item_qty,
      stock_type: getItems[0]?.stock_type,
      packageDetails: getItems[0]?.packageDetails,
      manufacture: getItems[0]?.manufacture,
      comments: getItems[0]?.comments,
      reason: getItems[0]?.reason,
      unit_price: getItems[0]?.unit_price
    })
  }

  useEffect(() => {
    if (id != undefined && action === 'edit') {
      //
      getListOfItemsById(id)
    }
  }, [id, action])

  const postItemsData = async () => {
    setSubmitLoader(true)
    const postData = editParams

    // postData.total_qty = totalQty

    // if (id) {
    //   try {
    //     const response = await updateDirectDispatchItems(id, postData)

    //     if (response?.success) {
    //       toast.success(response?.msg)
    //       setSubmitLoader(false)
    //       getListOfItemsById(id)
    //       Router.push(`/pharmacy/discard/`)
    //     } else {
    //       setSubmitLoader(false)
    //       toast.error(response?.msg)
    //     }
    //   } catch (error) {
    //     console.log('error', error)
    //   }
    // } else {
    try {
      const response = await addDiscard(editParams)
      if (response?.success) {
        toast.success(response?.msg)
        setEditParams(editParamsInitialState)
        setSubmitLoader(false)
        Router.push(`/pharmacy/discard/`)
      } else {
        setSubmitLoader(false)
        toast.error(response?.message)
      }
    } catch (error) {
      console.log('error', error)
    }

    // }
  }

  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false)
  const [selectedComment, setSelectedComment] = useState({})

  const handleOpenCommentDrawer = comment => {
    setSelectedComment(comment)
    setCommentDrawerOpen(true)
  }

  const handleCloseCommentDrawer = () => {
    setCommentDrawerOpen(false)
    setSelectedComment('')
  }

  // const headerAction = (
  //   <ExcelExportButton
  //     disabled={total === 0}
  //     action={() => {
  //       getAddDiscardData()
  //     }}
  //     loader={excelLoader}
  //     title='Download'
  //     fullWidth='fullWidth'
  //   />
  // )

  const getAddDiscardData = async () => {
    try {
      setExcelLoader(true)
      const response = await getDiscardItemsListById(id)

      if (response?.success === true && response?.data?.item_details?.length > 0) {
        setExcelLoader(false)
        const supplierId = response?.data?.supplier_id || null

        const discardDate = response?.data?.discarded_date ? formatDate(response?.data?.discarded_date) : 'N/A'

        const supplierName = supplierList.find(supplier => supplier.id === supplierId)?.company_name || 'N/A'

        const data = response?.data?.item_details.map(el => ({
          ['Stock Name']: el?.stock_name,
          ['Manufacture Name']: el?.manufacturer_name,
          ['Batch No']: el?.batch_no,
          ['Expiry Date']: el?.expiry_date,
          ['Quantity']: el?.quantity,
          ['Supplier Name']: supplierName,
          ['Discard Date']: discardDate,
          ['Reason']: el?.reason,
          ['Stock Type']: el?.stock_type
        }))

        Utility.exportToCSV(data, 'Discarditems')
      } else {
        console.log('No data available for export.')
      }
    } catch (error) {
      console.log('Error >>', error)
    }
  }

  const getLabelColor = params => {
    const reasonTextColor =
      params === 'Product Expired'
        ? theme.palette.customColors.Error
        : params === 'Not Required'
        ? theme.palette.customColors.Antz_Body_Medium
        : params === 'About to Expired'
        ? theme.palette.customColors.Tertiary
        : theme.palette.customColors.neutralSecondary

    return reasonTextColor
  }

  return (
    <>
      {selectedPharmacy.type === 'central' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') ? (
        <PageCardLayout
          title='Return To Supplier'
          titleStyles={{
            fontSize: '20px'
          }}
          showIcon={true}
          onIconClick={() => Router.back()}
          action={
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              {id && action && <ExportButton loading={excelLoader} onClick={getAddDiscardData} disabled={''} />}
              {/* <ExcelExportButton
                    action={() => getAddDiscardData()}
                    title='Download'
                    loader={excelLoader}
                    sx={{ minWidth: 120 }} // Consistent button size
                  /> */}
            </Box>
          }
        >
          <Grid container>
            <CommonDialogBox
              title={'Add Return Items'}
              dialogBoxStatus={show}
              formComponent={
                <AddItemsForm
                  searchBatchData={searchBatchData}
                  searchMedicineData={searchMedicineData}
                  productList={optionsMedicineList}
                  productLoading={productLoading}
                  visibleExpiryField={visibleExpiryField}
                  batchLoading={batchLoading}
                  onSubmitData={submitItems}
                  batchList={optionsBatchList}
                  nestedMedicine={nestedRowMedicine}
                  error={duplicateMedError}
                  totalQuantity={totalBatchQuantity}
                  editParams={editParams}
                  reasonsOptions={reasonsOptions}
                  closeDialog={closeDialog}
                />
              }
              close={closeDialog}
              show={showDialog}
            />
          </Grid>

          <form>
            <Grid container spacing={5}>
              <Grid item size={{ xs: 12, sm: 12 }}>
                <Typography
                  variant='subtitle1'
                  sx={{ color: 'customColors.customTextColorGray2', fontSize: '16px', fontWeight: 500 }}
                >
                  Supplier Name:
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} sx={{ mb: 5 }}>
                <FormControl fullWidth>
                  <InputLabel error={Boolean(errors.supplier_id)}>Supplier*</InputLabel>

                  <Select
                    error={Boolean(errors.supplier_id)}
                    value={editParams.supplier_id}
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
                    {supplierList?.map((item, index) => (
                      <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                        {item?.company_name}
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
              <Grid item size={{ xs: 12, sm: 6, lg: 6 }} sx={{ mb: 5 }}>
                <FormControl fullWidth>
                  <SingleDatePicker
                    fullWidth
                    date={editParams.discarded_date ? parseFormattedDate(editParams.discarded_date) : null}
                    width={'100%'}
                    value={editParams.discarded_date ? parseFormattedDate(editParams.discarded_date) : null}
                    name={'Date*'}
                    disabled={id ? true : false}
                    onChangeHandler={date => {
                      setEditParams({ ...editParams, discarded_date: formatDate(date) })
                      setErrors({})
                    }}
                    maxDate={new Date()}
                    customInput={<CustomInput label='Date*' error={Boolean(errors.discarded_date)} />}
                    isClearable={false}
                  />
                  {errors.discarded_date && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </form>
          {/* <Grid
            container
            spacing={6}
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
              title='Add Return Items'
              action={() => {
                handleSubmit()
              }}
            />
          </Grid> */}

          <Grid container spacing={3} alignItems='center' sx={{ py: 5 }}>
            <Grid item size={{ xs: 12, sm: 'auto', md: 6.5, lg: 8 }}>
              <Typography sx={{ color: 'customColors.customTextColorGray2', fontSize: '16px', fontWeight: 500 }}>
                Return Products List
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 0, sm: 6 }}
                divider={<Divider orientation='vertical' flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
              >
                <Typography
                  variant='body2'
                  sx={{ color: 'customColors.neutralSecondary', fontSize: '14px', fontWeight: 400 }}
                >
                  Total Discard Quantity:{' '}
                  <Typography component='span' variant='body2' sx={{ color: 'primary.light' }}>
                    {totalQty ? totalQty : '0'}
                  </Typography>
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: 'customColors.neutralSecondary', fontSize: '14px', fontWeight: 400 }}
                >
                  Total Discard Value:{' '}
                  <Typography component='span' variant='body2' sx={{ color: 'primary.light' }}>
                    {Utility.formatAmountToReadableDigit(totalDispatchValue)}
                  </Typography>
                </Typography>
              </Stack>
            </Grid>

            {id ? null : (
              <Box sx={{ display: 'flex', marginLeft: 'auto' }}>
                <AddButtonContained
                  title='Add Return Items'
                  action={() => {
                    handleSubmit()
                  }}
                />
              </Box>
            )}
          </Grid>

          <Card
            sx={{
              my: 5,
              border: '1px solid',
              borderColor: 'customColors.customTableBorderBg',
              boxShadow: 'none'
            }}
          >
            <TableContainer>
              <Table>
                <TableHead sx={{ borderColor: 'customColors.customTableBorderBg' }}>
                  <TableRow sx={{ backgroundColor: 'customColors.customTableHeaderBg' }}>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Batch No</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Reason</TableCell>

                    {id ? null : <TableCell>Action</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody sx={{ borderColor: 'customColors.customTableBorderBg' }}>
                  {editParams?.items
                    ? editParams?.items?.map((el, index) => {
                        return (
                          <TableRow
                            key={index}
                            sx={{
                              '&:last-child td, &:last-child th': {
                                border: 0
                              }
                            }}
                          >
                            <TableCell>
                              <Typography
                                variant='body2'
                                sx={{ color: 'primary.light', fontSize: '16px', fontWeight: 600 }}
                              >
                                {RenderUtility?.renderControlLabel(el.control_substance === true, 'CS')}
                                {RenderUtility?.renderControlLabel(el.prescription_required === true, 'PR')}
                                {el.medicine_name}
                              </Typography>

                              <Typography
                                variant='body2'
                                sx={{ color: 'customColors.customHeadingTextColor', fontSize: '14px', fontWeight: 400 }}
                              >
                                {el.packageDetails}
                              </Typography>
                              <Typography
                                variant='body2'
                                sx={{ color: 'customColors.customHeadingTextColor', fontSize: '14px', fontWeight: 400 }}
                              >
                                {el.manufacture}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2' sx={{ color: 'text.primary' }}>
                                {el.batch_no}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2' sx={{ color: 'text.primary' }}>
                                {Utility?.formatDisplayDate(el?.expiry_date)}
                              </Typography>
                            </TableCell>
                            <TableCell>{el.quantity}</TableCell>
                            {/* <TableCell>{el.comments ? el.comments : 'NA'}</TableCell> */}
                            {/* <TableCell
                              sx={{ cursor: 'pointer' }}
                              onClick={() => el.comments && handleOpenCommentDrawer(el)}
                            >
                              <Typography variant='body2' sx={{ color: 'customColors.moderateRed' }}>
                                {el.reason ? el.reason : 'NA'}
                              </Typography>

                              <Typography variant='body2'>{el.comments ? el.comments : ''}</Typography>
                            </TableCell> */}
                            {/* <TableCell
                              sx={{ cursor: el.comments ? 'pointer' : 'default' }}
                              onClick={() => el.comments && handleOpenCommentDrawer(el)}
                            >
                              <Typography
                                variant='body2'
                                sx={{
                                  color: () => {
                                    if (el.reason === 'Expired') {
                                      return 'customColors.moderateRed'
                                    } else if (el.reason === 'About to expire') {
                                      return '#FA6140'
                                    } else {
                                      return '#E4B819'
                                    }
                                  }
                                }}
                              >
                                {el.reason}
                              </Typography>
                              <Typography variant='body2' mt={0.5}>
                                <Box
                                  display='flex'
                                  alignItems='center'
                                  gap={1}
                                  sx={{
                                    minWidth: 30,
                                    maxWidth: 80,
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical'
                                  }}
                                >
                                  <Icon icon='pepicons-pop:file' width='0.6em' height='0.6em' />
                                  {el.comments ? el.comments : ''}
                                </Box>
                              </Typography>
                            </TableCell> */}
                            <TableCell
                              sx={{ cursor: el.comments ? 'pointer' : 'default' }}
                              onClick={() => el.comments && handleOpenCommentDrawer(el)}
                            >
                              <Typography
                                variant='body2'
                                sx={{
                                  // color: () => {
                                  //   if (el?.reason === 'Product Expired') {
                                  //     return 'customColors.moderateTableRed'
                                  //   } else if (el.reason === 'About to expire') {
                                  //     return 'customColors.Tertiary'
                                  //   } else {
                                  //     return 'customColors.moderateSecondary'
                                  //   }
                                  // }
                                  fontWeight: 500,
                                  fontSize: '14px',
                                  color: getLabelColor(el?.reason)
                                }}
                              >
                                {el.reason}
                              </Typography>
                              <Typography
                                variant='body2'
                                sx={{
                                  mt: 0.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  overflow: 'hidden'
                                }}
                              >
                                {el.comments && <Icon icon='pepicons-pop:file' width='0.7em' height='0.7em' />}
                                <span
                                  style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 'calc(100% - 1em)' // Adjust based on icon width
                                  }}
                                >
                                  {el.comments
                                    ? el.comments.length > 20
                                      ? `${el.comments.substring(0, 20)}...`
                                      : el.comments
                                    : ''}
                                </span>
                              </Typography>
                            </TableCell>
                            {id ? null : (
                              <TableCell>
                                <IconButton
                                  size='small'
                                  sx={{ mr: 0.5 }}
                                  aria-label='Edit'
                                  onClick={() => {
                                    setMedicineItemId(el.stock_id)

                                    editTableData(el.uuid)
                                    showDialog()
                                  }}
                                >
                                  <Icon icon='mdi:pencil-outline' />
                                </IconButton>

                                <IconButton
                                  onClick={() => {
                                    removeItemsFromTable(el.uuid)
                                  }}
                                  size='small'
                                  sx={{ mr: 0.5 }}
                                >
                                  <Icon icon='mdi:delete-outline' />
                                </IconButton>
                              </TableCell>
                            )}
                          </TableRow>
                        )
                      })
                    : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
          {/* <CardContent sx={{ pt: 8 }}>
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
          </CardContent> */}
          <Grid item size={{ xs: 12 }}>
            <Box sx={{ float: 'right', my: 4, mx: 6 }}>
              {id ? null : (
                <>
                  <LoadingButton
                    disabled={editParams?.items?.length > 0 ? false : true}
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
                </>
              )}
            </Box>
          </Grid>
        </PageCardLayout>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
      <Drawer anchor='right' open={commentDrawerOpen} onClose={handleCloseCommentDrawer}>
        <Box
          sx={{
            width: 400,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',

            // backgroundColor: '#EFF5F2'
            backgroundColor: 'customColors.Background'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 5
            }}
          >
            <Typography
              variant='body1'
              sx={{ fontSize: '20px', fontWeight: 500, color: 'customColors.customHeadingTextColor' }}
            >
              Reason
            </Typography>
            <IconButton onClick={handleCloseCommentDrawer}>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>
          <Divider />

          <Box sx={{ p: 5, pb: 0 }}>
            <Box>
              <Typography
                variant='body2'
                sx={{ fontSize: '16px', fontWeight: 400, color: 'customColors.neutralSecondary' }}
              >
                Reason for Discard:
              </Typography>
            </Box>
            <Typography
              variant='body1'
              sx={{
                fontSize: '16px',
                fontWeight: 600,
                color: () => {
                  if (selectedComment?.reason === 'Expired') {
                    return 'customColors.Error'
                  } else if (selectedComment?.reason === 'About to expire') {
                    return 'customColors.Tertiary'
                  } else {
                    return 'customColors.moderateSecondary'
                  }
                }
              }}
            >
              {selectedComment?.reason}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: theme => alpha(theme.palette.customColors.Notes, 0.6),
              p: 4,
              m: 5,
              borderRadius: '8px'
            }}
          >
            <Typography
              variant='body1'
              sx={{ fontSize: '16px', fontWeight: 400, color: 'customColors.neutralSecondary' }}
            >
              Comments:
            </Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 400, color: 'customColors.OnSurfaceVariant' }}>
              {selectedComment?.comments}
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default AddDiscardProducts
