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
  TableRow,
  MenuItem,
  FormHelperText,
  Box,
  InputLabel,
  FormLabel,
  Select
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
import { ValidateUploadPurchaseFile, saveImportFileData } from 'src/lib/api/pharmacy/getPurchaseList'
import toast from 'react-hot-toast'
import { useRouter } from 'next/router'

const ValidateImportPurchase = () => {
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
  const [conflictProducts, setConflictProducts] = useState([])
  const [submitLoader, setSubmitLoader] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }
  const formRef = useRef(null)

  const uploadFileData = async () => {
    try {
      setLoader(true)
      const result = await saveImportFileData(uploadedFileData)
      setSubmitLoader(true)
      console.log('result', result)

      if (result?.message === 'Saved the purchase entries successfully' && result?.success === true) {
        toast.success(result.message)
        setSubmitLoader(false)
        reset(defaultValues)
        setUploadedFileData([])
        setFileUploadErrors([])
        setConflictProducts([])
        setLoader(false)
      } else {
        setSubmitLoader(false)
        setLoader(false)
      }
    } catch (error) {
      setSubmitLoader(false)
      console.log('error', error)
      setLoader(false)
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

      const result = await ValidateUploadPurchaseFile(formData)
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
            uid: index + 1
          }))

          // newData.forEach((dataItem, dataIndex) => {
          //   dataItem.id = dataIndex + 1
          //   dataItem?.purchaseDetails?.forEach((purchaseDetail, purchaseDetailIndex) => {
          //     purchaseDetail.id = purchaseDetailIndex + 1
          //   })
          // })
          console.log('newData', newData)
          setUploadedFileData(newData)
          setLoader(false)
        }
      }
      if (result?.success === true && result?.manufacturer_package?.length > 0) {
        const newData = result?.manufacturer_package?.map((item, index) => ({
          ...item,
          uid: index + 1,
          selected_product_id: ''
        }))
        newData.forEach((dataItem, dataIndex) => {
          dataItem.uid = dataIndex + 1
          dataItem?.conflict_products?.forEach((purchaseDetail, purchaseDetailIndex) => {
            purchaseDetail.uid = purchaseDetailIndex + 1
          })
        })
        console.log('conflict', newData)
        setSubmitLoader(false)
        setConflictProducts(newData)
      }

      if (result?.message === 'Please upload the proper csv file.' && result?.success === false) {
        toast.error(result.message)
        setSubmitLoader(false)
        setLoader(false)
      }
      if (result?.success === true && result?.data) {
        const newData = result?.data?.map((item, index) => ({
          ...item,
          uid: index + 1
        }))
        newData.forEach((dataItem, dataIndex) => {
          dataItem.uid = dataIndex + 1
          dataItem?.purchaseDetails?.forEach((purchaseDetail, purchaseDetailIndex) => {
            purchaseDetail.uid = purchaseDetailIndex + 1
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

  const insertIdFromConflictProducts = (mainObject, idFromConflictProducts) => {
    const { conflict_products, ...rest } = mainObject

    const updatedRecords = conflictProducts.map(record => {
      if (record.uid === mainObject.uid) {
        return { ...record, selected_product_id: idFromConflictProducts }
      }

      return record
    })

    setConflictProducts(updatedRecords)
    const final = { ...rest, product_id: idFromConflictProducts }

    const indexToRemove = uploadedFileData?.findIndex(
      item => item?.purchase_invoice_number === final?.purchase_invoice_number
    )

    if (indexToRemove !== -1) {
      const updatedData = [...uploadedFileData]
      updatedData.splice(indexToRemove, 1)
      setUploadedFileData(updatedData)
    }

    setUploadedFileData(prevData => [...prevData, final])
  }

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
                      <FormLabel sx={{ m: 1 }}>Upload CSV file</FormLabel>

                      <TextField
                        {...register('upload_file')}
                        type='file'
                        accept='.csv'
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
                  {conflictProducts?.length > 0 ? (
                    <Grid item xs={12} sm={12} sx={{ my: 2, mx: 6 }}>
                      <Card>
                        <CardHeader title='Conflict products' />

                        <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                          <Table stickyHeader sx={{ minWidth: 650, overflowX: 'scroll' }} aria-label='sticky table'>
                            <TableHead sx={{ backgroundColor: 'primary.bg' }}>
                              <TableRow>
                                <TableCell>Purchase invoice no</TableCell>
                                <TableCell>Conflict manufacturer Error Details</TableCell>
                                <TableCell>Supplier name</TableCell>
                                <TableCell>Product name</TableCell>
                                <TableCell>Purchase date</TableCell>
                                <TableCell>Select manufacturer</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {conflictProducts?.map((el, index) => {
                                return (
                                  <TableRow key={index}>
                                    <TableCell>{el?.purchase_invoice_number}</TableCell>
                                    <TableCell sx={{ color: 'error.main' }}>
                                      {' '}
                                      In {el.key}th Row {el.value}
                                    </TableCell>
                                    <TableCell>{el?.supplier_name}</TableCell>
                                    <TableCell>{el?.product_name}</TableCell>
                                    <TableCell>{el.purchase_date}</TableCell>
                                    <TableCell>
                                      <FormControl>
                                        <InputLabel
                                          error={Boolean(el?.selected_product_id === '' ? true : false)}
                                          id='demo-simple-select-helper-label'
                                        >
                                          Manufacturer
                                        </InputLabel>
                                        <Select
                                          fullWidth
                                          label='Manufacturer'
                                          defaultValue={el.selected_product_id}
                                          id='demo-simple-select-helper'
                                          labelId='demo-simple-select-helper-label'
                                          error={Boolean(el?.selected_product_id === '' ? true : false)}
                                        >
                                          {el?.conflict_products &&
                                            Object.entries(el?.conflict_products)?.map(([id, product]) => (
                                              <MenuItem
                                                onClick={() => {
                                                  insertIdFromConflictProducts(el, product.id)
                                                }}
                                                key={id}
                                                value={product.id}
                                              >
                                                <Box>
                                                  <Typography>{product.name}</Typography>
                                                  {/* <Typography variant='body2'>{product.name}</Typography> */}
                                                  <Typography variant='body2'>{product.manufacturer_name}</Typography>
                                                </Box>
                                              </MenuItem>
                                            ))}
                                        </Select>
                                        {el?.selected_product_id === '' ? (
                                          <FormHelperText variant='error.main' sx={{ color: 'error.main' }}>
                                            Select the manufacture
                                          </FormHelperText>
                                        ) : null}
                                      </FormControl>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Card>
                    </Grid>
                  ) : null}

                  {uploadedFileData?.length > 0 ? (
                    <>
                      <Grid item xs={12} sm={12} sx={{ my: 2, mx: 6 }}>
                        <Card>
                          <CardHeader title='Invoices good to upload' />

                          <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                            <Table stickyHeader sx={{ minWidth: 650 }} aria-label='sticky table'>
                              <TableHead sx={{ backgroundColor: 'primary.bg' }}>
                                <TableRow>
                                  <TableCell>Purchase invoice no</TableCell>
                                  <TableCell>Batch</TableCell>
                                  <TableCell>Supplier name</TableCell>
                                  <TableCell>Product name</TableCell>
                                  <TableCell>Purchase date</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {uploadedFileData?.map((el, index) => {
                                  return (
                                    <TableRow key={index}>
                                      <TableCell>{el?.purchase_invoice_number}</TableCell>
                                      <TableCell>{el?.batch_number}</TableCell>
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
                    </>
                  ) : null}
                </Grid>
                <Grid item xs={12} sm={6} sx={{ mx: 6, my: 2 }}>
                  {uploadedFileData?.length > 0 ? (
                    <LoadingButton
                      disabled={
                        getValues('upload_file') === '' ||
                        fileUploadErrors?.length > 0 ||
                        conflictProducts?.some(obj => obj?.selected_product_id === '')
                          ? true
                          : false
                      }
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
                      setConflictProducts([])
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

export default ValidateImportPurchase
