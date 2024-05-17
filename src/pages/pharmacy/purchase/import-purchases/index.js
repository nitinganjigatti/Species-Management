import React, { useState, useRef } from 'react'

import { DataGrid } from '@mui/x-data-grid'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'
import {
  Card,
  CardHeader,
  Typography,
  Grid,
  FormControl,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { LoaderIcon } from 'react-hot-toast'
import IconButton from '@mui/material/IconButton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

import Error404 from 'src/pages/404'
import Paper from '@mui/material/Paper'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import { useForm } from 'react-hook-form'
import { uploadPurchaseFile } from 'src/lib/api/pharmacy/getPurchaseList'
import toast from 'react-hot-toast'
import { useRouter } from 'next/router'

const ImportPurchase = () => {
  const defaultValues = {
    upload_file: '',
    is_confirm: 0
  }

  const schema = yup.object().shape({
    upload_file: yup
      .mixed()
      .required('A file is required')

      .test('fileType', 'Invalid file type, only CSV files are allowed', value => {
        if (!value) return true

        return value && value[0]?.type === 'text/csv'
      })
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues,
    register
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const [loader, setLoader] = useState(false)

  const [fileUploadErrors, setFileUploadErrors] = useState([])
  const [uploadedFileData, setUploadedFileData] = useState([])
  const [submitLoader, setSubmitLoader] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }
  const formRef = useRef(null)

  const uploadFileData = async () => {
    // const formData = new FormData()
    const formData = new FormData(formRef.current)

    // formData.append('upload_file', getValues('upload_file')[0])
    formData.append('is_confirm', uploadedFileData?.length > 0 ? '1' : '0')

    try {
      setLoader(true)
      const result = await uploadPurchaseFile(formData)
      setSubmitLoader(true)
      console.log('result', result)
      if (result?.success === false && result?.error?.length > 0) {
        setFileUploadErrors(result?.error)
        setSubmitLoader(false)
        setLoader(false)

        if (result?.data?.length > 0) {
          const newData = result?.data?.map((item, index) => ({
            ...item,
            id: index + 1
          }))
          newData.forEach((dataItem, dataIndex) => {
            dataItem.id = dataIndex + 1
            dataItem?.purchaseDetails?.forEach((purchaseDetail, purchaseDetailIndex) => {
              purchaseDetail.id = purchaseDetailIndex + 1
            })
          })
          console.log('newData', newData)
          setUploadedFileData(newData)
        }
      }

      if (result?.success === true && result?.data) {
        const newData = result?.data?.map((item, index) => ({
          ...item,
          id: index + 1
        }))
        newData.forEach((dataItem, dataIndex) => {
          dataItem.id = dataIndex + 1
          dataItem?.purchaseDetails?.forEach((purchaseDetail, purchaseDetailIndex) => {
            purchaseDetail.id = purchaseDetailIndex + 1
          })
        })
        console.log('newData', newData)
        setSubmitLoader(false)
        setLoader(false)

        setUploadedFileData(newData)
      }
      if (result?.message === 'Saved the purchase entries successfully' && result?.success === true) {
        toast.success(result.message)
        setSubmitLoader(false)
        reset(defaultValues)
        setUploadedFileData([])
        setFileUploadErrors([])
        setLoader(false)
      }
      if (result?.message === 'Please upload the proper csv file.' && result?.success === false) {
        toast.error(result.message)
        setSubmitLoader(false)
        reset(defaultValues)
        setLoader(false)
      }
    } catch (error) {
      setSubmitLoader(false)
      setLoader(false)

      console.log('error', error)
    }
  }
  const router = useRouter()

  const handleFileChange = async e => {
    e.preventDefault()
    setFileUploadErrors([])
    setUploadedFileData([])
    const file = e.target.files[0]

    if (file && file.type === 'text/csv') {
      reset({}, { errors: true })
      setLoader(true)

      const formData = new FormData(formRef.current)
      formData.append('is_confirm', uploadedFileData?.length > 0 ? '1' : '0')

      const result = await uploadPurchaseFile(formData)
      setSubmitLoader(true)
      console.log('newData', result)

      if (result?.success === false && result?.error?.length > 0) {
        setFileUploadErrors(result?.error)
        setSubmitLoader(false)
        setLoader(false)

        console.log('newData', result)

        if (result?.data.length > 0) {
          const newData = result?.data?.map((item, index) => ({
            ...item,
            id: index + 1
          }))

          newData.forEach((dataItem, dataIndex) => {
            dataItem.id = dataIndex + 1
            dataItem?.purchaseDetails?.forEach((purchaseDetail, purchaseDetailIndex) => {
              purchaseDetail.id = purchaseDetailIndex + 1
            })
          })
          console.log('newData', newData)
          setUploadedFileData(newData)
          setLoader(false)
        }
      }

      if (result?.message === 'Please upload the proper csv file.' && result?.success === false) {
        toast.error(result.message)
        setSubmitLoader(false)
        setLoader(false)
      }
      if (result?.success === true && result?.data) {
        const newData = result?.data?.map((item, index) => ({
          ...item,
          id: index + 1
        }))
        newData.forEach((dataItem, dataIndex) => {
          dataItem.id = dataIndex + 1
          dataItem?.purchaseDetails?.forEach((purchaseDetail, purchaseDetailIndex) => {
            purchaseDetail.id = purchaseDetailIndex + 1
          })
        })
        console.log('newData', newData)
        setSubmitLoader(false)
        setLoader(false)

        setUploadedFileData(newData)
      }
    }
  }

  const { selectedPharmacy } = usePharmacyContext()

  const fileDataColumns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'id ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      flex: 0.05,
      Width: 40,
      minWidth: 200,
      field: 'po_no',
      headerName: 'Purchase Number ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.po_no}
        </Typography>
      )
    },

    {
      field: 'purchaseDetails',
      headerName: 'Purchase Details',
      flex: 1,
      minWidth: 800,
      children: [
        {
          flex: 0.05,
          Width: 40,
          field: 'id',
          headerName: 'id',
          renderCell: params => (
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.id}
            </Typography>
          )
        },
        {
          flex: 0.2,
          minWidth: 20,
          field: 'expiry_date',
          headerName: 'Expiry date',
          renderCell: params => (
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {Utility.formatDisplayDate(params.row.expiry_date)}
            </Typography>
          )
        },
        {
          flex: 0.2,
          minWidth: 20,
          field: 'stock_name',
          headerName: 'Product name',
          renderCell: params => (
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.stock_name}
            </Typography>
          )
        }
      ]
    }
  ]

  return (
    <>
      {selectedPharmacy.type === 'central' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') ? (
        <>
          <Card>
            <CardHeader
              title='Import Inventory '
              avatar={
                <Icon
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    router.back()
                  }}
                  icon='ep:back'
                />
              }
            />
            <form ref={formRef} autoComplete='off'>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} sx={{ my: 2, mx: 6 }}>
                    <FormControl fullWidth>
                      <TextField
                        {...register('upload_file')}
                        type='file'
                        accept='.csv'
                        label='Upload file'
                        disabled={loader}
                        error={Boolean(errors.upload_file)}
                        helperText={errors.upload_file?.message}
                        onChange={handleFileChange}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>
                              {loader ? <IconButton edge='end'>{<LoaderIcon size={40} />}</IconButton> : null}
                            </InputAdornment>
                          )
                        }}
                      />
                    </FormControl>
                  </Grid>
                  {fileUploadErrors?.length > 0 ? (
                    <Grid item xs={12} sm={12} sx={{ my: 2, mx: 6 }}>
                      {/* {console.log('fileUploadErrors', fileUploadErrors)} */}
                      <Card>
                        <CardHeader title='Rows with errors' />
                        <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                          <Table stickyHeader sx={{ minWidth: 650 }} aria-label='simple table'>
                            <TableHead sx={{ backgroundColor: 'primary.bg' }}>
                              <TableRow>
                                <TableCell>Purchase invoice no</TableCell>
                                <TableCell>Error Details</TableCell>
                                <TableCell>Supplier name</TableCell>
                                <TableCell>Product name</TableCell>
                                <TableCell>Purchase date</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {fileUploadErrors?.map((el, index) => {
                                return (
                                  <TableRow key={index}>
                                    <TableCell>{el?.purchase_invoice_number}</TableCell>
                                    <TableCell sx={{ color: 'error.main' }}>
                                      {' '}
                                      In {el.key} Row {el.value}
                                    </TableCell>
                                    <TableCell>{el?.supplier_name}</TableCell>
                                    <TableCell>{el?.product_name}</TableCell>
                                    <TableCell>{el.purchase_date}</TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Card>
                    </Grid>
                  ) : null}
                  {uploadedFileData.length > 0 ? (
                    <>
                      {/* {console.log('uploadedFileData', uploadedFileData)} */}
                      <Grid item xs={12} sm={12} sx={{ my: 2, mx: 6 }}>
                        {/* <DataGrid
                          autoHeight
                          autoWidth
                          rows={uploadedFileData ? uploadedFileData : []}
                          columns={fileDataColumns}
                        /> */}
                        <Card>
                          <CardHeader title='Invoices good to upload' />

                          <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                            <Table stickyHeader sx={{ minWidth: 650 }} aria-label='sticky table'>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Purchase invoice no</TableCell>

                                  <TableCell>Purchase Details</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {uploadedFileData.length > 0
                                  ? uploadedFileData?.map((el, index, array) => {
                                      const isFirstRow = index === array.findIndex(item => item?.po_no === el?.po_no)

                                      return (
                                        <TableRow key={index}>
                                          {isFirstRow && (
                                            <TableCell
                                              rowSpan={array.filter(item => item?.po_no === el?.po_no).length}
                                              style={{
                                                borderRight: '1px solid #ccc'
                                              }}
                                            >
                                              {el?.po_no}
                                            </TableCell>
                                          )}

                                          <TableHead>
                                            <TableRow>
                                              <TableCell sx={{ backgroundColor: 'transparent' }}>Batch No.</TableCell>
                                              <TableCell sx={{ backgroundColor: 'transparent' }}>
                                                Product Name
                                              </TableCell>
                                              <TableCell sx={{ backgroundColor: 'transparent' }}>Quantity</TableCell>
                                              <TableCell sx={{ backgroundColor: 'transparent' }}>Expire date</TableCell>
                                              <TableCell sx={{ backgroundColor: 'transparent' }}>
                                                Purchase amount
                                              </TableCell>

                                              <TableCell sx={{ backgroundColor: 'transparent' }}>CGST</TableCell>
                                              <TableCell sx={{ backgroundColor: 'transparent' }}>IGST</TableCell>
                                              <TableCell sx={{ backgroundColor: 'transparent' }}>SGST</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {el?.purchaseDetails?.map((el, index) => {
                                              return (
                                                <TableRow key={index}>
                                                  <TableCell>{el?.batch_no}</TableCell>
                                                  <TableCell>{el?.stock_name}</TableCell>
                                                  <TableCell>{el?.qty}</TableCell>
                                                  <TableCell>{Utility.formatDisplayDate(el.expiry_date)}</TableCell>
                                                  <TableCell>{el?.purchase_price}</TableCell>

                                                  <TableCell>{el?.cgst}%</TableCell>
                                                  <TableCell>{el?.igst}%</TableCell>
                                                  <TableCell>{el?.sgst}%</TableCell>
                                                </TableRow>
                                              )
                                            })}
                                          </TableBody>
                                        </TableRow>
                                      )
                                    })
                                  : null}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Card>
                      </Grid>
                    </>
                  ) : null}
                </Grid>
                <Grid item xs={12} sm={6} sx={{ mx: 6, my: 2 }}>
                  {uploadedFileData?.length > 0 ? (
                    <LoadingButton
                      disabled={getValues('upload_file') === '' || fileUploadErrors.length > 0 ? true : false}
                      sx={{ marginRight: '8px' }}
                      size='large'
                      variant='contained'
                      onClick={uploadFileData}
                      loading={submitLoader}
                    >
                      Save
                    </LoadingButton>
                  ) : null}
                  <Button
                    disabled={getValues('upload_file') === '' ? true : false}
                    size='large'
                    variant='contained'
                    color='error'
                    onClick={() => {
                      reset(defaultValues)
                      setFileUploadErrors([])
                      setUploadedFileData([])
                    }}
                  >
                    Cancel
                  </Button>
                </Grid>
              </CardContent>
            </form>
          </Card>
        </>
      ) : (
        <Error404 />
      )}
    </>
  )
}

export default ImportPurchase
