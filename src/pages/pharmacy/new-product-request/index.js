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
import { Button, Card, CardContent, Grid, debounce } from '@mui/material'

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

import { usePharmacyContext } from 'src/context/PharmacyContext'
import toast from 'react-hot-toast'

export default function NewProductList() {
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
        await fetchTableData({ sort, q: searchValue, column: sortColumn })
      }
    } catch (error) {
      console.log(error)
    }
  }

  const columns = [
    {
      flex: 0.2,
      Width: 10,
      field: 'request_number',
      headerName: 'Request Number',
      renderCell: (params, rowId) => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary', fontSize: '14px' }}>
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
          <Typography variant='body2' sx={{ color: 'text.primary', fontSize: '14px' }}>
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
            <Typography key={index} sx={{ color: 'text.primary', fontSize: '14px' }}>
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
        <Typography variant='body2' sx={{ color: 'text.primary', fontSize: '14px' }}>
          {params?.row?.priority}
        </Typography>
      )
    },
    selectedPharmacy?.type === 'central' && {
      flex: 0.2,
      minWidth: 20,
      field: 'requested_by',
      headerName: 'Requested User',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', fontSize: '14px' }}>
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
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row.request_items?.map((item, index) => (
            <Typography key={index} sx={{ color: 'text.primary', fontSize: '14px' }}>
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
        <Typography variant='body2' sx={{ color: 'text.primary', fontSize: '14px' }}>
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
        <Typography variant='body2' sx={{ color: 'text.primary', fontSize: '14px' }}>
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
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
    } else {
    }
  }

  const headerAction = (
    <>
      {selectedPharmacy.type === 'local' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
          <AddButton title='Add Product' action={() => router.push('/pharmacy/new-product-request/request-product/')} />
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

  const tableData = () => {
    return (
      <>
        <Card sx={{ cursor: 'pointer' }}>
          <CardHeader title='New Product Request List' action={headerAction} />
          <DataGrid
            sx={{ cursor: 'pointer' }}
            columnVisibilityModel={{
              id: false
            }}
            autoHeight
            pagination
            hideFooterSelectedRowCount
            disableColumnSelector={true}
            rows={indexedRows === undefined ? [] : indexedRows}
            rowCount={total}
            columns={columns}
            sortingMode='server'
            paginationMode='server'
            pageSizeOptions={[7, 10, 25, 50]}
            paginationModel={paginationModel}
            onSortModelChange={handleSortModel}
            slots={{ toolbar: ServerSideToolbar }}
            onPaginationModelChange={setPaginationModel}
            loading={loading}
            disableColumnMenu
            slotProps={{
              baseButton: {
                variant: 'outlined'
              },
              toolbar: {
                value: searchValue,
                clearSearch: () => handleSearch(''),
                onChange: event => handleSearch(event.target.value)
              }
            }}
            onRowClick={onRowClick}
          />
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
