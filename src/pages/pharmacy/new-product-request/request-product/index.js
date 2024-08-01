import { yupResolver } from '@hookform/resolvers/yup'
import {
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  ListItem,
  MenuItem,
  Modal,
  Popover,
  Radio,
  RadioGroup,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  List
} from '@mui/material'
import { Box, borderRadius } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import React, { useRef, useState, useEffect, Fragment } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import CommonDialogBox from 'src/components/CommonDialogBox'
import Icon from 'src/@core/components/icon'
import * as yup from 'yup'
import { AddRequestLineItemsForm } from 'src/views/pages/pharmacy/product/add-request-lineItems-form'
import { LoadingButton } from '@mui/lab'
import {
  addMedicineForm,
  addNonExistingProduct,
  getMedicine,
  getNonExistingProductById,
  getNonExistingProductList,
  updateNonExistingProduct
} from 'src/lib/api/pharmacy/newMedicine'
import Router, { useRouter } from 'next/router'
import { AddButton } from 'src/components/Buttons'
import FileUploaderMultiple from 'src/views/forms/form-elements/file-uploader/FileUploaderMultiple'

// ** Styled Component
import DropzoneWrapper from 'src/@core/styles/libs/react-dropzone'
import toast from 'react-hot-toast'
import ImageUploadComponent, { ImageUploadCard } from 'src/views/pages/pharmacy/utility/image-upload-card'
import Error404 from 'src/pages/404'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { ConfirmationBox } from 'src/utility/Confirm-dialog-box'
import ConfirmDialog from 'src/components/ConfirmationDialog'

export default function AddProduct() {
  const [storeList, setStoreList] = useState([])
  const [dataChildValues, setDataChildValues] = useState([])
  const [editValues, setEditValues] = useState(dataChildValues)
  const [editIndex, setEditIndex] = useState(null)
  const [displayFile, setDisplayFile] = useState()
  const [imgBaseUrl, setImgBaseUrl] = useState()
  const [getDetails, setGetDetails] = useState()
  const [prescriptionField, setPrescriptionField] = useState([])
  const [defaultSalts, setDefaultSalts] = useState([])
  const [saltsList, setSalts] = useState([])
  const [imgSrc, setImgSrc] = useState('')
  const [prescriptionImage, setPrescriptionImage] = useState()
  const [previousPrescriptionLength, setPreviousPrescriptionLength] = useState(false)
  const [imgSrcChange, setImgSrcChange] = useState(false)
  const [confirmationBox, setConfirmationBox] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)

  const [responseImage, setResponseImage] = useState()
  const theme = useTheme()
  const { selectedPharmacy } = usePharmacyContext()

  useEffect(() => {
    getStoreList({ params: { type: 'central' } })
      .then(res => {
        setStoreList(res?.data?.list_items)
        if (res?.data?.list_items.length > 0) {
          setValue('from_store', res?.data?.list_items[0].id)
        }
      })
      .catch(err => console.log(err))
  }, [])

  const commonSchema = yup.object().shape({
    from_store: yup.string().required('Store Name is required'),
    product_type: yup.string().required('Product type is required'),
    product_name: yup.string().required('Product name is required'),
    quantity: yup
      .number()
      .typeError('Quantity must be a number')
      .required('Quantity is required')
      .moreThan(0, 'Quantity must be greater than 0')
  })

  const nonMedicalSchema = yup.object().shape({
    generic_name: yup.string().notRequired()
  })

  const medicalSchema = yup.object().shape({
    generic_name: yup.string().required('Generic name is required')
  })

  const schema = yup.lazy(values => {
    if (values && values.product_type === 'non_medical') {
      return commonSchema.concat(nonMedicalSchema)
    }

    return commonSchema.concat(medicalSchema)
  })

  const defaultValues = {
    from_store: '',
    comment: '',
    prescription_images: [],
    product_type: '',
    product_name: '',
    generic_name: '',
    product_image: '',
    quantity: '',
    priority: 'Normal',
    salts: [],
    status: 'pending'
  }

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors, isDirty, isValid }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const handleFileChange = event => {
    const { files } = event.target

    const newImages = Array.from(files).map(file => file)
    const imagesList = getValues('prescription_images')
    if (imagesList.length > 0) {
      setValue('prescription_images', [...imagesList, ...newImages])
    } else {
      setValue('prescription_images', [...newImages])
    }

    setPrescriptionImage([...imagesList, ...newImages])
    setPreviousPrescriptionLength(true)
  }

  const removeselectedImage = selectedindex => {
    if (prescriptionImage.length > 0) {
      const list = [...prescriptionImage]
      const filterList = list.filter((item, index) => selectedindex !== index)
      setValue('prescription_images', filterList)
      setPrescriptionImage(filterList)
      setPreviousPrescriptionLength(true)
    }
  }

  const getSpecificProductList = async id => {
    await getNonExistingProductById(id).then(res => {
      setGetDetails(res?.data)
      setDataChildValues(res?.data?.request_item_details)
      setPrescriptionField(res?.data?.prescription_images)
      setResponseImage(res?.data?.request_item_details[0].product_image)
      reset({
        from_store: res?.data?.from_store,
        comment: res?.data?.comments,
        quantity: res?.data?.request_item_details[0].quantity,
        priority: res?.data?.request_item_details[0].priority,
        product_type: res?.data?.request_item_details[0].product_type,
        product_name: res?.data?.request_item_details[0].product_name,
        generic_name: res?.data?.request_item_details[0].generic_name,
        product_image: res?.data?.request_item_details[0].product_image,
        prescription_images: res?.data?.prescription_images
      })

      setPrescriptionImage(res?.data?.prescription_images)

      setImgSrc(res?.data?.request_item_details[0].product_image)
    })
  }

  const onSubmit = async data => {
    setSubmitLoader(true)
    const dataChild = [...dataChildValues]

    const requestData = dataChild?.map((item, index) => {
      return item?.request_item_detail_id
    })

    if (typeof data?.product_image === 'string') {
      const trimImg = data?.product_image.trim()
      const imgName = trimImg.split('/').pop()
      data.product_image = imgName
    }

    data.request_item_detail_id = requestData.join('')

    data.status = data?.status ? data?.status : 'Pending'

    if (data.prescription_images.length > 0) {
      const filterPrescriptionImages = data?.prescription_images?.map(element => {
        if (typeof element === 'string') {
          const trimElement = element.trim()
          const imageName = trimElement.split('/').pop()

          return imageName
        } else {
          return element
        }
      })
      data.prescription_images = filterPrescriptionImages
    } else {
      data.prescription_images = []
    }

    if (typeof data?.product_image === 'string') {
      const trimImg = data?.product_image.trim()
      const imgName = trimImg.split('/').pop()
      data.product_image = imgName
    }

    let {
      from_store,
      comment,
      prescription_images,
      product_type,
      priority,
      product_name,
      generic_name,
      quantity,
      status,
      product_image
    } = data

    const payload = {
      from_store: from_store,
      comments: comment,
      prescription_images,
      request_item_details: [
        {
          product_type,
          product_name,
          generic_name,
          priority,
          quantity,
          product_image,
          salts: JSON.stringify([]),
          status: data?.status,
          request_item_detail_id: data.request_item_detail_id
        }
      ]
    }

    console.log(payload)

    let response

    try {
      if (id) {
        response = await updateNonExistingProduct(payload, id)
      } else {
        response = await addNonExistingProduct(payload)
      }

      if (response?.success) {
        reset()
        const toastMessage = id ? 'Product Updated Successfully' : 'New Product Created Successfully'
        toast.success(toastMessage)

        router.push('/pharmacy/new-product-request/')
      } else {
        setSubmitLoader(false)
      }
    } catch (error) {
      console.error('An error occurred:', error)
      setSubmitLoader(false)
    }
  }

  const handleCancelDialogBox = () => {
    if (isDirty) {
      setConfirmationBox(true)
    } else if (imgSrcChange) {
      setConfirmationBox(true)
    } else if (previousPrescriptionLength) {
      setConfirmationBox(true)
    } else {
      router.push('/pharmacy/new-product-request/')
    }
  }

  // const clearSaltFields = index => {
  //   return (
  //     <Box>
  //       <Icon
  //         onClick={() => {
  //           var tempDefaultSalts = defaultSalts
  //           tempDefaultSalts[index] = undefined
  //           setDefaultSalts(tempDefaultSalts)
  //           remove(index)
  //           insert(index, {})
  //         }}
  //         icon='material-symbols-light:close'
  //       />
  //     </Box>
  //   )
  // }

  // const handleCallback = dataFromChild => {
  //   if (editValues || editValues.request_item_detail_id) {
  //     handleUpdate(editValues, editIndex, dataFromChild)
  //   } else {
  //     setDataChildValues([...dataChildValues, dataFromChild])
  //   }
  // }

  // const addSaltButton = () => {
  //   return (
  //     <Button
  //       variant='outlined'
  //       onClick={() => {
  //         setSalts([])
  //         append({
  //           salt_qty: '',
  //           slat_id: ''
  //         })
  //       }}
  //       sx={{ marginRight: '4px', borderRadius: 6 }}
  //     >
  //       Add Another
  //     </Button>
  //   )
  // }

  // const removeSaltButton = index => {
  //   return (
  //     <Box>
  //       <Icon
  //         onClick={() => {
  //           var tempDefaultSalts = defaultSalts
  //           tempDefaultSalts.splice(index, 1)
  //           setDefaultSalts(tempDefaultSalts)
  //           remove(index)
  //         }}
  //         icon='material-symbols-light:close'
  //       />
  //     </Box>
  //   )
  // }

  // const handleAddRemoveSalts = (fields, index) => {
  //   if (fields.length - 1 === index && index > 0) {
  //     return (
  //       <>
  //         {addSaltButton()}
  //         {removeSaltButton(index)}
  //       </>
  //     )
  //   } else if (index <= 0 && fields.length - 1 <= 0) {
  //     return (
  //       <>
  //         {addSaltButton()}
  //         {clearSaltFields(index)}
  //       </>
  //     )
  //   } else if (index <= 0 && fields.length > 0) {
  //     return <>{clearSaltFields(index)}</>
  //   } else {
  //     return <>{removeSaltButton(index)}</>
  //   }
  // }

  const handleInputImageChange = file => {
    const reader = new FileReader()
    const { files } = file.target
    if (files && files.length !== 0) {
      if (files[0] !== imgBaseUrl) {
        reader.onload = () => {
          setImgSrc(reader?.result)
          setImgSrcChange(true)
        }
      }

      setValue('product_image', files[0])
      setDisplayFile(files[0].name)
      reader.readAsDataURL(files[0])
    }
  }

  const handleEditLineItems = (item, index) => {
    setEditValues(item)
    setEditIndex(index)
  }

  const removeSelectedImage = () => {
    setImgSrc('')
    setValue('product_image', '')
    setImgSrcChange(true)
  }

  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id) {
      getSpecificProductList(id)
    }
  }, [id])

  const handleCancelChange = () => {
    if (isDirty) {
      handleCancelDialogBox()
    } else if (imgSrcChange) {
      handleCancelDialogBox()
    } else if (previousPrescriptionLength) {
      handleCancelDialogBox()
    } else {
      router.push('/pharmacy/new-product-request/')
    }
  }

  return (
    <>
      {selectedPharmacy.type === 'local' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') ? (
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={!id ? 'Add Product Form' : 'Edit Product Form'}
                avatar={
                  <Icon
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      isDirty || imgSrcChange || previousPrescriptionLength
                        ? handleCancelDialogBox()
                        : router.push('/pharmacy/new-product-request/')
                    }}
                    icon='ep:back'
                  />
                }
              />

              <form onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
                <CardContent>
                  <Grid container spacing={6}>
                    {/* <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>From Store Name*</InputLabel>
                        <Controller
                          name='from_store'
                          control={control}
                          rules={{ required: true }}
                          render={({ field }) => (
                            <Select {...field} label='From Store Name'>
                              {storeList?.map((item, index) => {
                                return (
                                  <MenuItem key={index} value={item?.id}>
                                    {item?.name}
                                  </MenuItem>
                                )
                              })}
                            </Select>
                          )}
                        />
                        {errors?.from_store && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.from_store?.message}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid> */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <Controller
                          name='product_name'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <TextField
                              value={value}
                              label='Product Name*'
                              name='product_name'
                              error={Boolean(errors.product_name)}
                              onChange={onChange}
                              placeholder='Product Name'
                            />
                          )}
                        />
                        {errors?.product_name && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.product_name.message}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Select Product Type*</InputLabel>
                        <Controller
                          name='product_type'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name='product_type'
                              value={value}
                              label='Select Product Type*'
                              onChange={onChange}
                              error={Boolean(errors?.product_type)}
                            >
                              <MenuItem value='allopathy'>Allopathy</MenuItem>
                              <MenuItem value='ayurveda'>Ayurveda</MenuItem>
                              <MenuItem value='unani'>Unani</MenuItem>
                              <MenuItem value='non_medical'>Non Medical</MenuItem>
                            </Select>
                          )}
                        />
                        {errors?.product_type && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.product_type?.message}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>
                  <Grid container mt={4} xs={12}>
                    <Grid container spacing={6}>
                      {
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <Controller
                              name='generic_name'
                              control={control}
                              rules={{ required: true }}
                              render={({ field: { value, onChange } }) => (
                                <TextField
                                  value={value}
                                  label='Generic Name*'
                                  name='generic_name'
                                  error={Boolean(errors.generic_name)}
                                  onChange={onChange}
                                  placeholder='Generic Name'
                                />
                              )}
                            />
                            {errors?.generic_name && (
                              <FormHelperText sx={{ color: 'error.main' }}>
                                {errors?.generic_name.message}
                              </FormHelperText>
                            )}
                          </FormControl>
                        </Grid>
                      }
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='quantity'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                label='Quantity*'
                                name='quantity'
                                type='number'
                                onChange={onChange}
                                placeholder='quantity'
                              />
                            )}
                          />
                          {errors?.quantity && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.quantity?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      {
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>From Store Name*</InputLabel>
                            <Controller
                              name='from_store'
                              control={control}
                              rules={{ required: true }}
                              render={({ field }) => (
                                <Select {...field} label='From Store Name'>
                                  {storeList?.map((item, index) => {
                                    return (
                                      <MenuItem key={index} value={item?.id}>
                                        {item?.name}
                                      </MenuItem>
                                    )
                                  })}
                                </Select>
                              )}
                            />
                            {errors?.from_store && (
                              <FormHelperText sx={{ color: 'error.main' }}>
                                {errors?.from_store?.message}
                              </FormHelperText>
                            )}
                          </FormControl>
                        </Grid>
                      }
                      {}

                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='comment'
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => <TextField {...field} label='Comment' multiline rows={1} />}
                          />
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={12}>
                        <FormControl fullWidth error={Boolean(errors.radio)}>
                          <FormLabel>Priority</FormLabel>
                          <Controller
                            name='priority'
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                              <RadioGroup row {...field} aria-label='gender' name='validation-basic-radio'>
                                <FormControlLabel
                                  value='High'
                                  label='High'
                                  sx={errors.status ? { color: 'error.main' } : null}
                                  control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
                                />
                                <FormControlLabel
                                  value='Normal'
                                  label='Normal'
                                  sx={errors.status ? { color: 'error.main' } : null}
                                  control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
                                />
                              </RadioGroup>
                            )}
                          />
                          {errors.radio && (
                            <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-radio'>
                              This field is required
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ mb: 4 }}>Product Image</Typography>

                        {imgSrc !== '' && imgSrc !== null && (
                          <Box
                            sx={{
                              display: 'flex'
                            }}
                          >
                            <Box sx={{ display: 'flex' }}>
                              <img
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  padding: '0.1875rem',
                                  borderRadius: '10px',
                                  border: '1px solid rgba(93, 89, 98, 0.14)'
                                }}
                                width={50}
                                height={50}
                                alt='Uploaded image'
                                src={typeof imgSrc === 'string' ? `${imgSrc}` : imgSrc}
                              />

                              <Typography sx={{ margin: '10px' }}>
                                {responseImage ? responseImage.slice(-10) : displayFile}
                              </Typography>
                              <Box sx={{ cursor: 'pointer', margin: '10px' }}>
                                <Icon icon='material-symbols-light:close' onClick={() => removeSelectedImage()}>
                                  {' '}
                                </Icon>
                              </Box>
                            </Box>
                          </Box>
                        )}

                        <Grid item xs={12} sm={12} style={{ position: 'relative' }}>
                          <input
                            type='file'
                            accept='image/*'
                            onChange={e => handleInputImageChange(e)}
                            name='product_image'
                            style={{ opacity: 0, position: 'relative', height: '36px', cursor: 'pointer', zIndex: 1 }}
                          />
                          {(imgSrc === '' || imgSrc === null) && (
                            <AddButton
                              title=' Upload Image'
                              styles={{ zIndex: 0, position: 'absolute', left: '0px' }}
                            />
                          )}
                        </Grid>

                        {/* <Grid item xs={12} sm={12} style={{ position: 'relative' }}>
                          <input
                            type='file'
                            accept='image/*'
                            onChange={e => handleInputImageChange(e)}
                            name='product_image'
                            ref={fileInputRef}
                            style={{ opacity: 0, position: 'relative', height: '36px', cursor: 'pointer', zIndex: 1 }}
                          />
                          {imgSrc === '' && (
                            <AddButton
                              title=' Upload Image'
                              styles={{ zIndex: 0, position: 'absolute', left: '0px' }}
                            />
                          )}
                        </Grid> */}

                        {/* {imgSrc === '' && ( */}
                      </Grid>
                      {/* {confirmationBox && (
                        <Grid>
                          <CommonDialogBox
                            noWidth
                            dialogBoxStatus={confirmationBox}
                            formComponent={<ConfirmationBox setConfirmationBox={setConfirmationBox} />}
                            show={() => setConfirmationBox(true)}
                          />
                        </Grid>
                      )} */}
                      {confirmationBox && (
                        <ConfirmDialog
                          title={'Confirmation'}
                          open={() => setConfirmationBox(true)}
                          content={'Are you sure you want to cancel?'}
                          closeDialog={() => setConfirmationBox(false)}
                          action={() => router.push('/pharmacy/new-product-request/')}
                        />
                      )}
                      {/* salt composition */}

                      {/* <Grid item xs={12} sm={12}>
                    <FormGroup>
                      <Grid container item xs={12} sm={12} alignItems='center' spacing={2}>
                        <Grid item xs={6}>
                          <span style={{ marginRight: '10px' }}>Salt Composition</span>
                        </Grid>
                      </Grid>
                      {fields.map((field, index) => (
                        <Grid container spacing={5} key={field.id} style={{ marginTop: '0px' }}>
                          <Grid item xs={4}>
                            <FormControl fullWidth>
                              <Controller
                                name={`salts[${index}].salt_id`}
                                control={control}
                                rules={{ required: false }}
                                render={({ field: { value, onChange } }) => (
                                  <TextField
                                    value={value}
                                    label='Salt Name'
                                    onChange={onChange}
                                    placeholder='Salt Name'
                                    error={Boolean(errors?.salts?.[index]?.salt_id)}
                                    name={`salts[${index}].salt_id`}
                                  />
                                )}
                              />
                            </FormControl>
                          </Grid>
                          <Grid item xs={4}>
                            <FormControl fullWidth>
                              <Controller
                                name={`salts[${index}].salt_qty`}
                                control={control}
                                rules={{ required: false }}
                                render={({ field: { value, onChange } }) => (
                                  <TextField
                                    value={value}
                                    label='Strength'
                                    onChange={onChange}
                                    placeholder='Strength'
                                    error={Boolean(errors?.salts?.[index]?.salt_qty)}
                                    name={`salts[${index}].salt_qty`}
                                  />
                                )}
                              />
                            </FormControl>
                          </Grid>

                          <Grid
                            item
                            xs={4}
                            // eslint-disable-next-line lines-around-comment
                            // justifyContent='flex-end'

                            alignSelf='center'
                            sx={{
                              display: 'flex',
                              justifyItems: 'center',
                              alignItems: 'center'
                            }}
                          >
                            {handleAddRemoveSalts(fields, index)}
                          </Grid>
                        </Grid>
                      ))}
                    </FormGroup>
                  </Grid> */}

                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ mb: 4 }}>Prescription Images</Typography>
                        <Grid item xs={12} sm={12} sx={{ position: 'relative' }}>
                          <input
                            type='file'
                            accept='image/*'
                            multiple
                            onChange={e => handleFileChange(e)}
                            name='prescription_images'
                            style={{ opacity: 0, position: 'relative', height: '36px', cursor: 'pointer', zIndex: 1 }}
                          />
                          <AddButton
                            styles={{ zIndex: 0, position: 'absolute', left: '0px' }}
                            title='Add Prescription'
                          />
                        </Grid>

                        {prescriptionImage?.length > 0 && (
                          <ImageUploadComponent
                            getValues={getValues}
                            setPrescriptionField={setPrescriptionField}
                            imgBaseUrl={imgBaseUrl}
                            prescriptionImage={prescriptionImage}
                            removeselectedImage={removeselectedImage}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid
                    container
                    sm={12}
                    spacing={6}
                    mt={5}
                    item
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center'
                    }}
                  >
                    {id && (
                      <Button
                        styles={{ color: theme.palette.error.dark, border: '1px solid red', margin: '5px' }}
                        onClick={() => handleCancelChange()}
                        size='large'
                        variant='outlined'
                        sx={{ mr: '6px' }}
                      >
                        Cancel
                      </Button>
                    )}
                    <LoadingButton
                      type='submit'
                      loading={submitLoader}
                      sx={{ mr: '8px' }}
                      size='large'
                      variant='contained'
                      disabled={!isValid}
                    >
                      Submit
                    </LoadingButton>
                  </Grid>
                </CardContent>
              </form>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}
