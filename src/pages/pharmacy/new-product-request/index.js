import React, { useState, useEffect, useCallback } from 'react'

import TableWithFilter from 'src/components/TableWithFilter'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// import DeleteIcon from '@mui/icons-material/Delete'

import { CardContent, Grid } from '@mui/material'

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

export default function NewProductList() {
  const router = useRouter()
  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [detailsData, setDetailsData] = useState([])
  const [prescriptionImages, setPrescriptionImages] = useState()
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [total, setTotal] = useState(0)
  const [sortColumn, setSortColumn] = useState('label')
  const [sort, setSort] = useState('desc')
  const [itemId, setItemId] = useState()
  const [imgUrl, setImageUrl] = useState()
  const [rows, setRows] = useState([])

  const getProductList = async () => {
    const response = await getNonExistingProductList()
    console.log('response???', response)
    if (response) {
      setRows(response?.data)
      setLoader(false)
    } else {
      setLoader(true)
    }
  }

  useEffect(() => {
    getProductList()
  }, [])

  const fetchTableData = useCallback(
    async (sort, q, column, status) => {
      console.log('status', status)
      try {
        setLoading(true)

        const params = {
          // type: selectedPharmacy.type === 'local' ? 'request' : 'receive',
          type: 'request',
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          status
        }

        await getNonExistingProductList({ params: params }).then(res => {
          // debugger
          console.log('response', res)
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoader(false)
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    fetchTableData(sort, sortColumn)
  }, [fetchTableData])
  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const getProductSearchLists = async () => {
    try {
      setLoader(true)
      const response = await getNonExistingProductList()
      if (response?.length > 0) {
        console.log('list', response)

        let listWithId = response
          ? response.map((el, i) => {
              return { ...el, uid: i + 1 }
            })
          : []
        setRows(listWithId)
        setLoader(false)
      } else {
        setLoader(false)
      }
    } catch (error) {
      setLoader(false)
      console.log('error', error)
    }
  }

  useEffect(() => {
    getProductSearchLists()
  }, [])

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

  const handleRowClick = async id => {
    setShow(true)
    setItemId(id)
    await getNonExistingProductById(id)
      .then(res => {
        setPrescriptionImages(res?.data?.prescription_images)
        setDetailsData(res?.data?.request_item_details)
        setImageUrl(res?.base_path)
      })
      .catch(err => console.log(err))
  }

  const columns = [
    {
      flex: 0.2,
      Width: 20,
      field: 'from_store_name',
      headerName: 'Store Name',
      renderCell: (params, rowId) => (
        <div onClick={() => handleRowClick(params.row.id)}>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {console.log('params', params)}
            {params.row.from_store_name}
          </Typography>
        </div>
      )
    },

    {
      flex: 0.2,
      Width: 20,
      field: 'request_number',
      headerName: 'Request_Number',
      renderCell: (params, rowId) => (
        <div onClick={() => handleRowClick(params.row.id)}>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.request_number}
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
            <Typography key={index} variant='body2'>
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
      headerName: 'priority',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.priority}
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
      headerName: 'status',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.status}
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
          {Utility.formatDisplayDate(params.row.created_at)}
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

  // const handleHeaderAction = () => {
  //   console.log('Handle Header Action')
  // }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <TableWithFilter
            TableTitle={'New Product Request'}
            headerActions={
              <div>
                <AddButton
                  title='Add Product'
                  action={() => router.push('/pharmacy/new-product-request/request-product/')}
                />
              </div>
            }
            columns={columns}
            rows={rows}
            onRowClick={params => handleRowClick(params.row.id)}
          />

          {show && (
            <CardContent>
              <Grid container>
                <CommonDialogBox
                  title={'View Details'}
                  dialogBoxStatus={show}
                  formComponent={
                    <ProductDetail
                      setShow={setShow}
                      detailsData={detailsData}
                      prescriptionImages={prescriptionImages}
                      imgUrl={imgUrl}
                      itemId={itemId}
                      handleEdit={handleEdit}
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
