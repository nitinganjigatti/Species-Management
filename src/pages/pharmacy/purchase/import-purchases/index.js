import React, { useState, useEffect, useCallback } from 'react'

import { getPurchaseList } from 'src/lib/api/pharmacy/getPurchaseList'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import CommonDialogBox from 'src/components/CommonDialogBox'
import {
  Card,
  CardHeader,
  Typography,
  CardContent,
  Grid,
  FormHelperText,
  FormControl,
  TextField,
  Button
} from '@mui/material'
import { LoadingButton } from '@mui/lab'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

import Router from 'next/router'
import Error404 from 'src/pages/404'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AddButton, ExcelExportButton } from 'src/components/Buttons'
import Utility from 'src/utility'
import { margin } from '@mui/system'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import { useForm, Controller } from 'react-hook-form'
import { uploadPurchaseFile } from 'src/lib/api/pharmacy/getPurchaseList'
import toast from 'react-hot-toast'

const ImportPurchase = () => {
  /***** Server side pagination */
  const defaultValues = {
    upload_file: '',
    is_confirm: 0
  }

  // const schema = yup.object().shape({
  //   upload_file: yup
  //     .mixed()
  //     .test('filePresence', 'Excel file is required', value => {
  //       return value && value.length > 0
  //     })
  //     .test('fileType', 'Only Excel files are allowed', value => {
  //       if (!value) return true // Skip validation if no file is selected

  //       const file = value[0] // Get the first file from the array

  //       return (
  //         file &&
  //         ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(
  //           file.type
  //         )
  //       )
  //     })
  //     .test('fileCount', 'Only one file is allowed', value => {
  //       return value && value.length === 1
  //     })
  // })
  const schema = yup.object().shape({
    upload_file: yup
      .mixed()
      .required('A file is required')

      // .test('fileType', 'Invalid file type, only Excel (xls, xlsx) and CSV files are allowed', value => {
      //   if (!value) return true

      //   return (
      //     value &&
      //     [
      //       'application/vnd.ms-excel',
      //       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      //       'text/csv'
      //     ].includes(value.type)
      //   )
      // })
      .nullable()
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
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const [loader, setLoader] = useState(false)

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [fileUploadErrors, setFileUploadErrors] = useState([])
  const [uploadedFileData, setUploadedFileData] = useState()
  const [submitLoader, setSubmitLoader] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const onSubmit = async params => {
    const { upload_file, is_confirm } = params
    console.log('params', params.upload_file[0])
    var result

    try {
      if (uploadedFileData?.purchaseDetails.length > 0) {
        const formData = new FormData()
        formData.append('upload_file', upload_file[0])
        formData.append('is_confirm', '1')
        result = await uploadPurchaseFile(formData)
      } else {
        const formData = new FormData()
        formData.append('upload_file', upload_file[0])
        formData.append('is_confirm', '0')
        result = await uploadPurchaseFile(formData)
      }

      setSubmitLoader(true)

      console.log('result of upload', result)
      if (result?.success === false && result?.error?.length > 0) {
        setFileUploadErrors(result?.error)
        setSubmitLoader(false)
      }
      if (result?.success === true && result?.data !== '') {
        result.data.purchaseDetails.forEach((item, index) => {
          item.id = index + 1
        })

        // toast.success(response.message)
        setSubmitLoader(false)

        console.log('data', result?.data)
        setUploadedFileData(result?.data)
      }
    } catch (error) {
      setSubmitLoader(false)

      console.log('error', error)
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
      field: 'batch_no',
      headerName: 'Batch No ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
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

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }

  const headerAction = (
    <div>
      {/* <AddButton title='Inventory List' action={() => Router.push({ pathname: '/pharmacy/purchase/purchase-list/' })} /> */}
    </div>
  )

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <Card>
              <CardHeader title='Import Inventory ' action={headerAction} />
              <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} sx={{ mx: 6 }}>
                    <FormControl fullWidth>
                      <TextField
                        {...register('upload_file')}
                        type='file'
                        accept='.xls,.xlsx'
                        label='Upload File'
                        error={Boolean(errors.upload_file)}
                        helperText={errors.upload_file?.message}
                        onChange={() => {
                          setFileUploadErrors([])
                        }}
                      />
                      {errors.upload_file && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors?.upload_file?.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  {fileUploadErrors.length > 0 ? (
                    <Grid item xs={12} sm={6} sx={{ my: 2 }}>
                      {fileUploadErrors.length > 0
                        ? fileUploadErrors.map((el, index) => {
                            return (
                              <FormHelperText key={index} sx={{ color: 'error.main' }}>
                                In {el.key} Row {el.value}
                              </FormHelperText>
                            )
                          })
                        : null}
                    </Grid>
                  ) : null}
                  {uploadedFileData?.purchaseDetails.length > 0 ? (
                    <Grid item xs={12} sm={12}>
                      <DataGrid
                        autoHeight
                        autoWidth
                        rows={uploadedFileData?.purchaseDetails === undefined ? [] : uploadedFileData?.purchaseDetails}
                        columns={fileDataColumns}
                      />
                    </Grid>
                  ) : null}
                  <Grid item xs={12} sm={6} sx={{ mx: 6, my: 2 }}>
                    <LoadingButton
                      disabled={getValues('upload_file') === '' ? true : false}
                      sx={{ marginRight: '8px' }}
                      size='large'
                      type='submit'
                      variant='contained'
                      loading={submitLoader}
                    >
                      Save
                    </LoadingButton>
                    <Button
                      disabled={getValues('upload_file') === '' ? true : false}
                      size='large'
                      variant='contained'
                      color='error'
                    >
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Card>
          </>
        )
      ) : (
        <Error404 />
      )}
    </>
  )
}

export default ImportPurchase
