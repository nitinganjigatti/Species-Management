import React, { useState, useRef } from 'react'

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
  TableRow,
  FormLabel
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { LoaderIcon } from 'react-hot-toast'
import IconButton from '@mui/material/IconButton'

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

  // const schema = yup.object().shape({
  //   upload_file: yup
  //     .mixed()
  //     .required('A file is required')

  //     .test('fileType', 'Invalid file type, only CSV files are allowed', value => {
  //       if (!value) return true

  //       return value && value[0]?.type === 'text/csv'
  //     })
  // })
  const schema = yup.object().shape({
    upload_file: yup
      .mixed()
      .required('A file is required')
      .test('fileType', 'Invalid file type, only CSV files are allowed', value => {
        if (!value || value.length === 0) {
          console.log('value', value.length)

          return true
        }

        return value[0].type === 'text/csv'
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
    register,
    setError
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

    // console.log('upload file', getValues('upload_file'))

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
      const confirmLabel = 0
      const formData = new FormData(formRef.current)
      formData.append('is_confirm', confirmLabel)

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

      if (result?.message !== '' && result?.success === false) {
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
    } else {
      setError('upload_file', {
        type: 'manual',
        message: 'Invalid file type, only CSV files are allowed'
      })
    }
  }

  const { selectedPharmacy } = usePharmacyContext()

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
                  <Grid item xs={12} sm={5} sx={{ my: 2, ml: 6 }}>
                    <FormControl fullWidth>
                      <FormLabel sx={{ m: 1 }}>Upload CSV file</FormLabel>
                      <TextField
                        {...register('upload_file')}
                        type='file'
                        accept='.csv'
                        disabled={loader}
                        error={Boolean(errors.upload_file)}
                        helperText={errors.upload_file?.message}
                        onChange={e => {
                          handleFileChange(e)
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>
                              {loader ? (
                                <IconButton edge='end'>{<LoaderIcon size={40} />}</IconButton>
                              ) : getValues('upload_file') !== '' ? (
                                <Icon
                                  color='error.main'
                                  onClick={() => {
                                    reset(defaultValues)
                                    setFileUploadErrors([])
                                    setUploadedFileData([])
                                    setLoader(false)
                                  }}
                                  icon='mdi:close'
                                />
                              ) : null}
                            </InputAdornment>
                          )
                        }}
                      />
                    </FormControl>
                  </Grid>

                  {fileUploadErrors?.length > 0 ? (
                    <Grid item xs={12} sm={12} sx={{ my: 2, mx: 6 }}>
                      <Card>
                        <CardHeader title='Rows with errors' />
                        <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                          <Table stickyHeader sx={{ minWidth: 650, overflowX: 'scroll' }} aria-label='simple table'>
                            <TableHead sx={{ backgroundColor: 'primary.bg' }}>
                              <TableRow>
                                <TableCell width={100}>Purchase invoice no</TableCell>
                                <TableCell width={100}>Error Details</TableCell>
                                {/* <TableCell>Error Details</TableCell> */}
                                <TableCell width={'100%'}></TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {fileUploadErrors.length > 0
                                ? fileUploadErrors?.map((el, index, array) => {
                                    const isFirstRow =
                                      index ===
                                      array.findIndex(
                                        item => item?.purchase_invoice_number === el?.purchase_invoice_number
                                      )

                                    return (
                                      <TableRow key={index}>
                                        {isFirstRow && (
                                          <TableCell
                                            rowSpan={
                                              array.filter(
                                                item => item?.purchase_invoice_number === el?.purchase_invoice_number
                                              ).length
                                            }
                                            style={{
                                              borderRight: '1px solid #ccc'
                                            }}
                                          >
                                            {el?.purchase_invoice_number}
                                          </TableCell>
                                        )}
                                        {isFirstRow && (
                                          <TableCell
                                            sx={{ minWidth: 180 }}
                                            rowSpan={array.filter(item => item?.key === el?.key).length}
                                            style={{
                                              borderRight: '1px solid #ccc'
                                            }}
                                          >
                                            <Typography variant='subtitle2' color='error.main'>
                                              Row {el.key}, {el.value}
                                            </Typography>
                                          </TableCell>
                                        )}

                                        <TableCell>
                                          <TableHead>
                                            <TableCell sx={{ backgroundColor: 'transparent', minWidth: 130 }}>
                                              Product Name
                                            </TableCell>
                                            <TableCell sx={{ backgroundColor: 'transparent', minWidth: 130 }}>
                                              Batch No.
                                            </TableCell>

                                            <TableCell sx={{ backgroundColor: 'transparent', minWidth: 130 }}>
                                              Quantity
                                            </TableCell>
                                            <TableCell sx={{ backgroundColor: 'transparent', minWidth: 130 }}>
                                              Expire date
                                            </TableCell>

                                            <TableCell sx={{ backgroundColor: 'transparent', minWidth: 130 }}>
                                              Purchase amount
                                            </TableCell>
                                            <TableCell sx={{ backgroundColor: 'transparent', minWidth: 130 }}>
                                              Discount amount
                                            </TableCell>
                                            <TableCell sx={{ backgroundColor: 'transparent', minWidth: 130 }}>
                                              Taxable amount
                                            </TableCell>
                                            <TableCell
                                              sx={{
                                                backgroundColor: 'transparent',
                                                minWidth: 130,
                                                textAlign: 'center'
                                              }}
                                            >
                                              CGST
                                              <Grid container>
                                                <Grid item xs={6} sx={{ backgroundColor: 'transparent' }}>
                                                  Rate
                                                </Grid>
                                                <Grid item xs={6} sx={{ backgroundColor: 'transparent' }}>
                                                  Amount
                                                </Grid>
                                              </Grid>
                                            </TableCell>
                                            <TableCell
                                              sx={{
                                                backgroundColor: 'transparent',
                                                textAlign: 'center',

                                                minWidth: 130
                                              }}
                                            >
                                              SGST
                                              <Grid container>
                                                <Grid item xs={6} sx={{ backgroundColor: 'transparent' }}>
                                                  Rate
                                                </Grid>
                                                <Grid item xs={6} sx={{ backgroundColor: 'transparent' }}>
                                                  Amount
                                                </Grid>
                                              </Grid>
                                            </TableCell>
                                            <TableCell sx={{ backgroundColor: 'transparent', textAlign: 'center' }}>
                                              IGST
                                              <Grid container>
                                                <Grid item xs={6} sx={{ backgroundColor: 'transparent' }}>
                                                  Rate
                                                </Grid>
                                                <Grid item xs={6} sx={{ backgroundColor: 'transparent' }}>
                                                  Amount
                                                </Grid>
                                              </Grid>
                                            </TableCell>
                                          </TableHead>
                                          {el?.data?.map((el, index) => {
                                            return (
                                              <TableRow key={index}>
                                                <TableCell>{el?.stock_name}</TableCell>
                                                <TableCell>{el?.batch_no}</TableCell>
                                                <TableCell>{el?.qty}</TableCell>
                                                <TableCell>{Utility.formatDisplayDate(el.expiry_date)}</TableCell>
                                                <TableCell>{el?.purchase_price.toFixed(2)}</TableCell>
                                                <TableCell>{el?.discount_amount}</TableCell>
                                                <TableCell>{el?.taxable_amount}</TableCell>
                                                <TableCell>
                                                  <TableCell
                                                    sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}
                                                  >
                                                    {el?.cgst}%
                                                  </TableCell>
                                                  <TableCell
                                                    sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}
                                                  >
                                                    {el?.cgst_amount}
                                                  </TableCell>
                                                </TableCell>
                                                <TableCell>
                                                  <TableCell
                                                    sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}
                                                  >
                                                    {el?.sgst}%
                                                  </TableCell>
                                                  <TableCell
                                                    sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}
                                                  >
                                                    {el?.sgst_amount}
                                                  </TableCell>
                                                </TableCell>{' '}
                                                <TableCell>
                                                  <TableCell
                                                    sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}
                                                  >
                                                    {el?.igst}%
                                                  </TableCell>
                                                  <TableCell
                                                    sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}
                                                  >
                                                    {el?.igst_amount}
                                                  </TableCell>
                                                </TableCell>
                                              </TableRow>
                                            )
                                          })}
                                        </TableCell>
                                        <TableCell></TableCell>
                                        {/*  <TableCell>{el.purchase_date}</TableCell> */}
                                      </TableRow>
                                    )
                                  })
                                : null}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Card>
                    </Grid>
                  ) : null}
                  {uploadedFileData.length > 0 ? (
                    <>
                      <Grid item xs={12} sm={12} sx={{ my: 2, mx: 6 }}>
                        <Card>
                          <CardHeader title='Invoices good to upload' />
                          {console.log('uploadedFileData', uploadedFileData)}
                          <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                            <Table stickyHeader sx={{ minWidth: 650, overflowX: 'scroll' }} aria-label='sticky table'>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Purchase invoice no</TableCell>

                                  <TableCell></TableCell>
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
                                              <TableCell sx={{ backgroundColor: 'transparent', minWidth: 130 }}>
                                                Product Name
                                              </TableCell>
                                              <TableCell sx={{ backgroundColor: 'transparent', minWidth: 130 }}>
                                                Batch No.
                                              </TableCell>

                                              <TableCell sx={{ backgroundColor: 'transparent', minWidth: 130 }}>
                                                Quantity
                                              </TableCell>
                                              <TableCell sx={{ backgroundColor: 'transparent', minWidth: 130 }}>
                                                Expire date
                                              </TableCell>

                                              <TableCell sx={{ backgroundColor: 'transparent', minWidth: 130 }}>
                                                Purchase amount
                                              </TableCell>
                                              <TableCell sx={{ backgroundColor: 'transparent', minWidth: 130 }}>
                                                Discount amount
                                              </TableCell>
                                              <TableCell sx={{ backgroundColor: 'transparent', minWidth: 130 }}>
                                                Taxable amount
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  backgroundColor: 'transparent',
                                                  minWidth: 130,
                                                  textAlign: 'center'
                                                }}
                                              >
                                                CGST
                                                <Grid container>
                                                  <Grid item xs={6} sx={{ backgroundColor: 'transparent' }}>
                                                    Rate
                                                  </Grid>
                                                  <Grid item xs={6} sx={{ backgroundColor: 'transparent' }}>
                                                    Amount
                                                  </Grid>
                                                </Grid>
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  backgroundColor: 'transparent',
                                                  textAlign: 'center',
                                                  minWidth: 130
                                                }}
                                              >
                                                SGST
                                                <Grid container>
                                                  <Grid item xs={6} sx={{ backgroundColor: 'transparent' }}>
                                                    Rate
                                                  </Grid>
                                                  <Grid item xs={6} sx={{ backgroundColor: 'transparent' }}>
                                                    Amount
                                                  </Grid>
                                                </Grid>
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  backgroundColor: 'transparent',
                                                  textAlign: 'center',
                                                  minWidth: 130
                                                }}
                                              >
                                                IGST
                                                <Grid container>
                                                  <Grid item xs={6} sx={{ backgroundColor: 'transparent' }}>
                                                    Rate
                                                  </Grid>
                                                  <Grid item xs={6} sx={{ backgroundColor: 'transparent' }}>
                                                    Amount
                                                  </Grid>
                                                </Grid>
                                              </TableCell>
                                              {/* <TableCell sx={{ backgroundColor: 'transparent' }}>IGST</TableCell>
                                              <TableCell sx={{ backgroundColor: 'transparent' }}>SGST</TableCell> */}
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {el?.purchaseDetails?.map((el, index) => {
                                              return (
                                                <TableRow key={index}>
                                                  <TableCell>{el?.stock_name}</TableCell>
                                                  <TableCell>{el?.batch_no}</TableCell>
                                                  <TableCell>{el?.qty}</TableCell>
                                                  <TableCell>{Utility.formatDisplayDate(el.expiry_date)}</TableCell>
                                                  <TableCell>{el?.purchase_price.toFixed(2)}</TableCell>
                                                  <TableCell>{el?.discount_amount}</TableCell>
                                                  <TableCell>{el?.taxable_amount}</TableCell>
                                                  <TableCell>
                                                    <TableCell
                                                      sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}
                                                    >
                                                      {el?.cgst}%
                                                    </TableCell>
                                                    <TableCell
                                                      sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}
                                                    >
                                                      {el?.cgst_amount}
                                                    </TableCell>
                                                  </TableCell>
                                                  <TableCell>
                                                    <TableCell
                                                      sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}
                                                    >
                                                      {el?.sgst}%
                                                    </TableCell>
                                                    <TableCell
                                                      sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}
                                                    >
                                                      {el?.sgst_amount}
                                                    </TableCell>
                                                  </TableCell>{' '}
                                                  <TableCell>
                                                    <TableCell
                                                      sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}
                                                    >
                                                      {el?.igst}%
                                                    </TableCell>
                                                    <TableCell
                                                      sx={{ borderBottom: 'none', backgroundColor: 'transparent' }}
                                                    >
                                                      {el?.igst_amount}
                                                    </TableCell>
                                                  </TableCell>
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
                      setLoader(false)
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
