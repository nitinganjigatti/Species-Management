import React, { useState, useEffect, useCallback } from 'react'

import TableWithFilter from 'src/components/TableWithFilter'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import CardHeader from '@mui/material/CardHeader'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// import DeleteIcon from '@mui/icons-material/Delete'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import { Box, Button, Card, CardContent, Grid, TextField, debounce } from '@mui/material'

import {
  addNonExistingProductStatus,
  deleteNonExistingProduct,
  getNonExistingProductById,
  getNonExistingProductList
} from 'src/lib/api/pharmacy/newMedicine'
import { useRouter } from 'next/router'
import { AddButton } from 'src/components/Buttons'
import Utility from 'src/utility'
import CommonDialogBox from 'src/components/CommonDialogBox'
import { ProductDetail } from 'src/views/pages/pharmacy/product/product-details'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { useTheme } from '@emotion/react'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import toast from 'react-hot-toast'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'

export default function NewProductList() {
  const theme = useTheme()

  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [detailsData, setDetailsData] = useState([])
  const [productDetails, setProductDetails] = useState({})
  const [reasonText, setReasonText] = useState('')
  const [submitLoader, setSubmitLoader] = useState(false)
  const [prescriptionImages, setPrescriptionImages] = useState()
  const [statusCall, setStatusCall] = useState(false)
  const { selectedPharmacy } = usePharmacyContext()

  const handleRequestStatus = async (status, id, productDetails) => {
    const payload = {
      status: status,
      comments: productDetails?.comments ? productDetails?.comments : '',
      reject_reason: reasonText ? reasonText : ' '
    }

    try {
      const response = await addNonExistingProductStatus(payload, id)
      if (response?.success) {
        const toastMessage = id ? 'Product Status Updated Successfully' : 'Unable to Update the Product Status'
        toast.success(toastMessage)
        setShow(false)

        // Trigger table data refresh after status change
        // Call fetchTableData for 'Pending' tab if the new status is 'Cancelled'
        if (status === 'Cancelled' || 'Approved' || 'Rejected') {
          fetchTableData({ sort, q: searchValue, column: sortColumn, status: 'Pending' }) // Refresh pending tab
        } else {
          fetchTableData({ sort, q: searchValue, column: sortColumn, status: status })
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const columns = [
    {
      flex: 0.2,
      Width: 40,
      field: 'id',
      headerName: 'S.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      Width: 10,
      field: 'request_number',
      headerName: 'Request Number',
      renderCell: (params, rowId) => (
        <div>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter'
            }}
          >
            {params?.row?.request_number}
          </Typography>
        </div>
      )
    },
    selectedPharmacy?.type === 'central' && {
      flex: 0.2,
      Width: 20,
      field: 'from_store_name',
      headerName: 'From Store',
      renderCell: (params, rowId) => (
        <div>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter'
            }}
          >
            {params?.row?.from_store_name}
          </Typography>
        </div>
      )
    },
    {
      flex: 0.3,
      Width: 20,
      field: 'product_name',
      headerName: 'Product Name',
      renderCell: params => (
        <div>
          {params?.row.request_items?.map((item, index) => (
            <Typography
              key={index}
              sx={{
                color: theme.palette.customColors.customHeadingTextColor,
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'Inter'
              }}
            >
              {item?.product_name}
            </Typography>
          ))}
        </div>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'priority',
      headerName: 'Priority',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params?.row?.priority}
        </Typography>
      )
    },
    selectedPharmacy?.type === 'central' && {
      flex: 0.3,
      minWidth: 20,
      field: 'requested_by',
      headerName: 'Requested User',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params?.row?.requested_user_name}
        </Typography>
      )
    },
    {
      flex: selectedPharmacy.type === 'central' ? 0.2 : 0.3,
      minWidth: 20,
      field: 'quantity',
      headerName: 'Quantity',
      type: 'number',
      headerAlign: 'left',
      align: 'left',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row.request_items?.map((item, index) => (
            <Typography
              key={index}
              sx={{
                color: theme.palette.customColors.customHeadingTextColor,
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'Inter'
              }}
            >
              {item?.quantity}
            </Typography>
          ))}
        </Typography>
      )
    },

    {
      flex: 0.3,
      minWidth: 20,
      field: 'created_at',
      headerName: 'CREATED Date',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {Utility.formatDisplayDate(params?.row?.created_at)}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'status',
      headerName: 'Status',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params?.row?.status}
        </Typography>
      )
    }
  ]
  const router = useRouter()

  const [loading, setLoading] = useState(false)

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState(0)
  const [sortColumn, setSortColumn] = useState('id')
  const [sort, setSort] = useState('desc')
  const [itemId, setItemId] = useState()
  const [imgUrl, setImageUrl] = useState()
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('Approved')

  const handleChange = (event, newValue) => {
    setTotal(0)
    setSearchValue('')

    setStatus(newValue)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async ({ sort, q, column, status }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          type: status
        }

        await getNonExistingProductList({ params: params }).then(res => {
          if (res?.data?.length > 0) {
            setTotal(parseInt(res?.count))
            setRows(loadServerRows(paginationModel.page, res?.data))
          } else {
            setTotal(0)
            setRows([])
          }
        })
        setLoading(false)
      } catch (e) {
        setTotal(0)
        setRows([])
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field, status })
    } else {
    }
  }

  const headerAction = (
    <>
      {selectedPharmacy.type === 'local' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
          <AddButtonContained
            title='Add Product'
            action={() => router.push('/pharmacy/new-product-request/request-product/')}
          />
        )}
    </>
  )

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column, status }) => {
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, column, status })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = async value => {
    setSearchValue(value)
    if (value === '') {
      await searchTableData({ sort, q: value, column: 'id', status })
    } else {
      await searchTableData({ sort, q: value, column: 'request_number', status })
    }
  }

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn, status })
  }, [fetchTableData, selectedPharmacy.id, status])

  const handleEdit = id => {
    router.push({
      pathname: '/pharmacy/new-product-request/request-product/',
      query: { id: id }
    })
  }

  const onRowClick = async params => {
    console.log('Status', params)
    setShow(true)
    setItemId(params.id)
    await getNonExistingProductById(params.id)
      .then(res => {
        setProductDetails(res?.data)
        setPrescriptionImages(res?.data?.prescription_images)
        setDetailsData(res?.data?.request_item_details)
      })
      .catch(err => console.log(err))
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const title = (
    <>
      <Typography sx={{ fontSize: '24px', fontFamily: 'Inter', fontWeight: 500, ml: 1 }}>
        New Product Request List
      </Typography>
    </>
  )

  const tableData = () => {
    return (
      <>
        <Card sx={{ cursor: 'pointer' }}>
          <CardHeader title={title} action={headerAction} />

          <Box display='flex' justifyContent='space-between' alignItems='center'>
            {/* Left Box (Search Field) */}
            <Grid item xs={8}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #C3CEC7',
                  borderRadius: '8px',
                  padding: '0 8px',
                  ml: 5,
                  height: '40px',
                  width: '250px' // Set a fixed width for all status
                }}
              >
                <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                <TextField
                  variant='outlined'
                  placeholder='Search...'
                  value={searchValue}
                  onChange={e => handleSearch(e.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      border: 'none',
                      padding: '0',
                      '& fieldset': {
                        border: 'none'
                      }
                    }
                  }}
                />
              </Box>
            </Grid>

            {/* <Grid item xs={12} sm={7} md={7} sx={{ float: 'right', mr: 1 }}>
              {status === 'all' || status === 'completed' ? (
                <Box sx={{ float: 'right', mt: 1 }}>
                  <FormControlLabel
                    control={<Switch defaultChecked={filterSwitch} onChange={handleSwitchChange} />}
                    label='Completed'
                    labelPlacement='end'
                  />
                </Box>
              ) : null}
            </Grid> */}
          </Box>
          <Grid
            sx={{
              mx: 4
            }}
          >
            <CommonTable
              onRowClick={onRowClick}
              indexedRows={indexedRows}
              total={total}
              columns={columns}
              paginationModel={paginationModel}
              handleSortModel={handleSortModel}
              setPaginationModel={setPaginationModel}
              loading={loading}
              searchValue={searchValue}
            />
          </Grid>
        </Card>

        {show && (
          <>
            <CardContent>
              <Grid container>
                <CommonDialogBox
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>Product Details - {productDetails?.request_number}</div>
                      {selectedPharmacy.type === 'local' &&
                        (selectedPharmacy.permission.key === 'allow_full_access' ||
                          selectedPharmacy.permission.key === 'ADD') &&
                        productDetails.status === 'Pending' && (
                          <Grid sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                            <IconButton
                              size='small'
                              sx={{ mr: 0.5 }}
                              aria-label='Edit'
                              onClick={() => handleEdit(itemId)}
                            >
                              <Icon icon='mdi:pencil-outline' />
                            </IconButton>
                          </Grid>
                        )}
                    </div>
                  }
                  dialogBoxStatus={show}
                  formComponent={
                    <ProductDetail
                      setShow={setShow}
                      statusCall={statusCall}
                      submitLoader={submitLoader}
                      detailsData={detailsData}
                      handleRequestStatus={handleRequestStatus}
                      prescriptionImages={prescriptionImages}
                      reasonText={reasonText}
                      setReasonText={setReasonText}
                      imgUrl={imgUrl}
                      itemId={itemId}
                      handleEdit={handleEdit}
                      productDetails={productDetails}
                    />
                  }
                  close={() => {
                    setShow(false)
                    setProductDetails({})
                    setDetailsData([])
                  }}
                  show={() => setShow(true)}
                />
              </Grid>
            </CardContent>
          </>
        )}
      </>
    )
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <TabContext value={status}>
          <TabList onChange={handleChange}>
            <Tab
              sx={{ ml: 3 }}
              value='Approved'
              label={<TabBadge label='Approved' totalCount={status === 'Approved' ? total : null} />}
            />

            <Tab
              value='Pending'
              label={<TabBadge label='Pending' totalCount={status === 'Pending' ? total : null} />}
            />

            <Tab
              value='Cancelled'
              label={<TabBadge label='Cancelled' totalCount={status === 'Cancelled' ? total : null} />}
            />
            <Tab
              value='Rejected'
              label={<TabBadge label='Rejected' totalCount={status === 'Rejected' ? total : null} />}
            />
          </TabList>
          <TabPanel value='Approved'>{tableData()}</TabPanel>
          <TabPanel value='Pending'>{tableData()}</TabPanel>

          <TabPanel value='Cancelled'>{tableData()}</TabPanel>
          <TabPanel value='Rejected'>{tableData()}</TabPanel>
        </TabContext>
      )}
    </>
  )
}
