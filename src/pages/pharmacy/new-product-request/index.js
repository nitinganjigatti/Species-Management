import React, { useState, useEffect, useCallback } from 'react'

import TableWithFilter from 'src/components/TableWithFilter'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import CardHeader from '@mui/material/CardHeader'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// import DeleteIcon from '@mui/icons-material/Delete'

import { Card, CardContent, Grid, debounce } from '@mui/material'

import {
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

export default function NewProductList() {
  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [detailsData, setDetailsData] = useState([])
  const [productDetails, setProductDetails] = useState({})
  const [prescriptionImages, setPrescriptionImages] = useState()

  const { selectedPharmacy } = usePharmacyContext()

  const columns = [
    // {
    //   flex: 0.2,
    //   Width: 20,
    //   field: 'from_store_name',
    //   headerName: 'Store Name',
    //   renderCell: (params, rowId) => (
    //     <div onClick={() => handleRowClick(params.row.id)}>
    //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //         {console.log('params', params)}
    //         {params.row.from_store_name}
    //       </Typography>
    //     </div>
    //   )
    // },

    {
      flex: 0.2,
      Width: 20,
      field: 'request_number',
      headerName: 'Request Number',
      renderCell: (params, rowId) => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params?.row?.request_number}
          </Typography>
        </div>
      )
    },
    {
      flex: 0.2,
      Width: 20,
      field: 'product_name',
      headerName: 'Product Name',
      renderCell: params => (
        <div>
          {params?.row.request_items?.map((item, index) => (
            <Typography key={index} sx={{ color: 'text.primary' }}>
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
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row?.priority}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'requested_by',
      headerName: 'Requested By User',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row?.requested_user_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'status',
      headerName: 'Status',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row?.status}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'created_at',
      headerName: 'Created DateTime',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(params?.row?.created_at)}
        </Typography>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'Action',
    //   headerName: 'Action',
    //   renderCell: params => (
    //     // <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
    //     //   {/* <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => handleEdit(params.row.id)}>
    //     //     <Icon icon='mdi:pencil-outline' />
    //     //   </IconButton> */}
    //     //   <IconButton
    //     //     size='small'
    //     //     sx={{ mr: 0.5 }}
    //     //     onClick={() => {
    //     //       handleDelete(params.row.id)
    //     //     }}
    //     //   >
    //     //     {/* <DeleteIcon /> */}
    //     //   </IconButton>
    //     // </Box>
    //   )
    // }
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

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async ({ sort, q, column }) => {
      debugger
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getNonExistingProductList({ params: params }).then(res => {
          setTotal(parseInt(res?.count))
          setRows(loadServerRows(paginationModel.page, res?.data))
        })
        setLoading(false)
      } catch (e) {
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

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column }) => {
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, column })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = async value => {
    setSearchValue(value)
    if (value === '') {
      await searchTableData({ sort, q: value, column: 'id' })
    } else {
      await searchTableData({ sort, q: value, column: 'request_number' })
    }
  }

  // const getProductSearchLists = async () => {
  //   try {
  //     setLoader(true)
  //     const response = await getNonExistingProductList()
  //     if (response?.length > 0) {
  //       console.log('list', response)

  //       let listWithId = response
  //         ? response.map((el, i) => {
  //             return { ...el, uid: i + 1 }
  //           })
  //         : []
  //       setRows(listWithId)
  //       setLoader(false)
  //     } else {
  //       setLoader(false)
  //     }
  //   } catch (error) {
  //     setLoader(false)
  //     console.log('error', error)
  //   }
  // }

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn })
  }, [fetchTableData, selectedPharmacy.id])

  const handleEdit = id => {
    router.push({
      pathname: '/pharmacy/new-product-request/request-product/',
      query: { id: id }
    })
  }

  // const handleEditItems = id => {
  //   setShow(true)
  //   console.log(id, 'idd')
  // }

  // const handleView = () => {
  //   setShow(true)
  // }

  // const handleDelete = async id => {
  //   const response = await deleteNonExistingProduct(id)
  //     .then(res => {
  //       console.log('deleted Successfully', res)
  //     })
  //     .catch(err => console.log('err', err))

  //   return response
  // }

  const onRowClick = async params => {
    setShow(true)
    setItemId(params.id)
    await getNonExistingProductById(params.id)
      .then(res => {
        setProductDetails(res?.data)
        setPrescriptionImages(res?.data?.prescription_images)
        setDetailsData(res?.data?.request_item_details)
        setImageUrl(res?.base_path)
      })
      .catch(err => console.log(err))
  }

  // const handleHeaderAction = () => {
  //   console.log('Handle Header Action')
  // }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card>
            <CardHeader title='New Product Request List' action={headerAction} />
            <DataGrid
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
            <CardContent>
              <Grid container>
                <CommonDialogBox
                  title={`Product Details - ${productDetails?.request_number}`}
                  dialogBoxStatus={show}
                  formComponent={
                    <ProductDetail
                      setShow={setShow}
                      detailsData={detailsData}
                      prescriptionImages={prescriptionImages}
                      imgUrl={imgUrl}
                      itemId={itemId}
                      handleEdit={handleEdit}
                      productDetails={productDetails}
                    />
                  }
                  close={() => setShow(false)}
                  show={() => setShow(true)}
                />
              </Grid>
            </CardContent>
          )}
        </>
      )}
    </>
  )
}
