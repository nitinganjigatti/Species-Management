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

export default function AddProduct() {
  const fileInputRef = useRef(null)
  const prescriptionRef = useRef(null)

  const [storeList, setStoreList] = useState([])
  const [dataChildValues, setDataChildValues] = useState([])
  const [editValues, setEditValues] = useState(dataChildValues)
  const [editIndex, setEditIndex] = useState(null)
  const [displayFile, setDisplayFile] = useState()
  const [imgBaseUrl, SetImgBaseUrl] = useState()
  const [getDetails, setGetDetails] = useState()
  const [prescriptionField, setPrescriptionField] = useState([])
  const [defaultSalts, setDefaultSalts] = useState([])
  const [saltsList, setSalts] = useState([])
  const [imgSrc, setImgSrc] = useState('')

  const [responseImage, setResponseImage] = useState()

  useEffect(() => {
    getStoreList({ params: { q: 'central', column: 'type' } })
      .then(res => setStoreList(res?.data?.list_items))
      .catch(err => console.log(err))
  }, [])

  console.log('storeList ????', storeList)

  // {
  //   storeList?.map((item, index) => setStoreId(item?.id))
  // }
  const base_url = `${process.env.NEXT_PUBLIC_BASE_URL}`

  const schema = yup.object().shape({
    from_store: yup.string().required('product name is required'),
    product_type: yup.string().required('product name is required'),
    product_name: yup.string().required('product name is required'),
    generic_name: yup.string().required('product name is required'),
    quantity: yup.number().required('Quantity is required').moreThan(0, 'Quantity must be greater than 0')
  })

  const defaultValues = {
    from_store: 38,
    comment: '',
    prescription_images: [],
    product_type: '',
    product_name: '',
    generic_name: '',
    product_image: '',
    quantity: '1',
    priority: 'Normal',
    salts: [],

    // salts: [
    //   {
    //     label: '',
    //     salt_id: '',
    //     salt_qty: ''
    //   }
    // ],
    status: 'Pending'
  }

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const { fields } = useFieldArray({
    control,
    name: 'prescription_images'
  })

  // const { fields, append, remove, insert } = useFieldArray({
  //   control,
  //   name: 'salts'
  // })

  console.log('fields?', fields)

  const handleFileChange = event => {
    debugger
    const { files } = event.target
    console.log('event ???', event)

    const newImages = Array.from(files).map(file => ({
      file
    }))
    console.log('preImages???', newImages)
    setValue('prescription_images', newImages)
  }

  const handleAddGalleryClick = () => {
    fileInputRef.current.click()
  }

  const handlePrescriptionClick = () => {
    prescriptionRef.current.click()
  }

  const removeItemsFroTable = index => {
    const updatedItems = dataChildValues.filter((el, elindex) => {
      return elindex != index
    })
    setDataChildValues(updatedItems)
  }

  const removeselectedImage = selectedindex => {
    const list = [...fields]
    const filterList = list.filter((item, index) => selectedindex !== index)
    setValue('prescription_images', filterList)
  }

  const getSpecificProductList = async id => {
    debugger
    await getNonExistingProductById(id).then(res => {
      SetImgBaseUrl(res?.base_path)
      setGetDetails(res?.data)
      setDataChildValues(res?.data?.request_item_details)
      setPrescriptionField(res?.data?.prescription_images)

      res?.data?.request_item_details?.map(item => setResponseImage(item?.product_image))

      // console.log('Prescription iMAGE???', prescriptionField)

      reset({
        from_store: res?.data?.from_store,
        comment: res?.data?.comments,
        quantity: res?.data?.quantity,
        priority: res?.data?.request_item_details[0].priority,
        product_type: res?.data?.request_item_details[0].product_type,
        product_name: res?.data?.request_item_details[0].product_name,
        generic_name: res?.data?.request_item_details[0].generic_name,
        product_image: res?.data?.request_item_details.map(Item =>
          typeof Item?.product_image === 'string'
            ? `${base_url}${imgBaseUrl}${Item?.product_image}`
            : Item?.product_image
        )
      })
      setImgSrc(
        res?.data?.request_item_details?.map(Item =>
          typeof Item?.product_image === 'string'
            ? `${base_url}${imgBaseUrl}${Item?.product_image}`
            : Item?.product_image
        )
      )
    })
  }

  const onSubmit = async data => {
    debugger
    const dataChild = [...dataChildValues]
    console.log('dataChild====????', dataChild)

    const requestData = dataChild?.map((item, index) => {
      return item?.request_item_detail_id
    })
    console.log('request???????', requestData)
    data.request_item_detail_id = requestData.join('')

    data.status = data?.status ? data?.status : 'Pending'

    // handleUpdate(getDetails, data)
    // const requestDetailsData = {
    //   product_type: data?.product_type,
    //   product_name: data?.product_name,
    //   generic_name: data?.generic_name,
    //   priority: data?.priority,
    //   quantity: data?.quantity,
    //   product_image: data?.product_image,
    //   salts: JSON.stringify([]),
    //   status: data?.status
    // }

    // const saltValues = data.salts

    // const filterSaltValues = saltValues?.map(item => ({
    //   salt_id: item.salt_id,
    //   salt_qty: item.salt_qty
    // }))
    // data.salts = JSON.stringify(filterSaltValues)
    const {
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

    const listImages = []
    prescription_images?.map(file => {
      return listImages?.push(file.file)
    })

    const payload = {
      from_store: from_store,
      comments: comment,
      prescription_images: listImages,
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

    // payload.request_item_details.request_item_detail_id = requestData

    let response

    console.log('payload???', payload)

    try {
      if (id) {
        response = await updateNonExistingProduct(payload, id)
      } else {
        debugger
        response = await addNonExistingProduct(payload)
      }

      if (response?.success) {
        const toastMessage = id ? 'Product Updated Successfully' : 'New Product Created Successfully'
        toast.success(toastMessage)

        router.push('/pharmacy/new-product-request/')
        reset()
      } else {
        setSuccessFulModal(false)
      }
    } catch (error) {
      setSuccessFulModal(false)

      // Handle the error as needed
      console.error('An error occurred:', error)
    }
  }

  const handleUpdate = (item, data) => {
    debugger

    console.log('Details????', item)

    // if (item?.request_item_details?.request_item_detail_id) {
    //   // Use optional chaining consistently
    //   data?.[request_item_detail_id] = item?.request_item_details?.request_item_detail_id;
    // }
  }

  const clearSaltFields = index => {
    return (
      <Box>
        <Icon
          onClick={() => {
            var tempDefaultSalts = defaultSalts
            tempDefaultSalts[index] = undefined
            setDefaultSalts(tempDefaultSalts)
            remove(index)
            insert(index, {})
          }}
          icon='material-symbols-light:close'
        />
      </Box>
    )
  }

  const handleCallback = dataFromChild => {
    debugger
    if (editValues || editValues.request_item_detail_id) {
      handleUpdate(editValues, editIndex, dataFromChild)
    } else {
      setDataChildValues([...dataChildValues, dataFromChild])
    }
  }

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
    debugger
    const reader = new FileReader()
    const { files } = file.target
    if (files && files.length !== 0) {
      if (files[0] !== imgBaseUrl) {
        reader.onload = () => {
          setImgSrc(reader?.result)
        }
      }

      setValue('product_image', files[0])
      setDisplayFile(files[0].name)
      reader.readAsDataURL(files[0])
    }
  }

  console.log('file name', displayFile)

  const handleEditLineItems = (item, index) => {
    setEditValues(item)
    setEditIndex(index)
  }

  const removeSelectedImage = () => {
    setImgSrc('')
    setValue('product_image', '')
  }

  const router = useRouter()
  const { id } = router.query

  // useEffect(() => {
  //   getSpecificProductList()
  // }, [])

  // useEffect(() => {
  //   if (dataChildValues) {
  //     reset({
  //       priority: res?.data?.request_item_details.map(Item => Item.priority),
  //       product_type: res?.data?.request_item_details.map(Item => Item.product_type),
  //       product_name: res?.data?.request_item_details.map(Item => Item.product_name),
  //       generic_name: res?.data?.request_item_details.map(Item => Item.generic_name),
  //       product_image: res?.data?.request_item_details.map(Item =>
  //         typeof Item?.product_image === 'string'
  //           ? `${base_url}${imgBaseUrl}${Item?.product_image}`
  //           : Item?.product_image
  //       )
  //     })

  //     // let constructedPath = ''
  //     // if (imgBaseUrl) {
  //     //   constructedPath = `https://app.antzsystems.com${imgBaseUrl}/${responseImage}`
  //     // }
  //     setImgSrc(
  //       editValues?.product_image !== '' && typeof editValues?.product_image === 'string'
  //         ? `${base_url}${imgBaseUrl}${editValues?.product_image}`
  //         : editValues?.product_image
  //     )
  //   }
  // }, [])

  useEffect(() => {
    if (id) {
      getSpecificProductList(id)
    }
  }, [id, responseImage])

  // const renderFilePreview = file => {
  //   if (typeof file === 'string') {
  //     return <img width={38} height={38} alt={file.name} src={`${base_url}${props.imgBaseUrl}${file}`} />
  //   }
  //   if (file instanceof Blob || file instanceof File) {
  //     return <img width={38} height={38} alt={file.name} src={URL.createObjectURL(file)} />
  //   } else {
  //     return <Icon icon='mdi:file-document-outline' />
  //   }
  // }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Add Product Form'
            avatar={
              <Icon
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  Router.push('/pharmacy/new-product-request/')
                }}
                icon='ep:back'
              />
            }
          />

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent>
              <Grid container spacing={6}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>From Store Name</InputLabel>
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
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='comment'
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label='Comment'
                          multiline
                          rows={1}

                          // error={Boolean(errors.medicine_name)}
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
              </Grid>
              <Grid container sm={12} mt={4} xs={12}>
                <Grid container spacing={6}>
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
                        <FormHelperText sx={{ color: 'error.main' }}>{errors?.generic_name.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <Controller
                        name='quantity'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            value={value}
                            label='Quantity'
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

                  <Grid item xs={12} sm={12}>
                    <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.radio)}>
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
                    <Typography>Product Image</Typography>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={e => handleInputImageChange(e)}
                      style={{ display: 'none' }}
                      name='product_image'
                      ref={fileInputRef}
                    />

                    {imgSrc !== '' && (
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
                            src={typeof imgSrc === 'string' ? imgSrc : imgSrc}
                          />

                          <Typography sx={{ margin: '10px' }}>{displayFile}</Typography>
                        </Box>
                        <Box sx={{ cursor: 'pointer' }}>
                          <Icon icon='material-symbols-light:close' onClick={() => removeSelectedImage()}>
                            {' '}
                          </Icon>
                        </Box>
                      </Box>
                    )}

                    {/* {imgSrc === '' && ( */}
                    {imgSrc === '' && <AddButton title=' Upload Image' action={handleAddGalleryClick} />}
                  </Grid>

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

                  {/* <Grid item xs={12} sm={12}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#F5F5F7' }}>
                      <TableRow>
                        <TableCell>Product Type</TableCell>
                        <TableCell>Product Name</TableCell>
                        <TableCell>Generic Name</TableCell>
                        <TableCell>Salt Name</TableCell>
                        <TableCell>Strength</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dataChildValues.map((item, index) => {
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              {item?.product_type && (
                                <Typography variant='body2' sx={{ color: 'text.primary' }}>
                                  {item.product_type}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {item?.product_name && (
                                <Typography variant='body2' sx={{ color: 'text.primary' }}>
                                  {item.product_name}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {item?.generic_name && (
                                <Typography variant='body2' sx={{ color: 'text.primary' }}>
                                  {item.generic_name}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {JSON.parse(item?.salts)?.map((item, index) => {
                                return (
                                  <Typography key={index} variant='body2' sx={{ color: 'text.primary' }}>
                                    {item.salt_id}
                                  </Typography>
                                )
                              })}
                            </TableCell>
                            <TableCell>
                              {JSON.parse(item?.salts)?.map((item, index) => {
                                return (
                                  <Typography key={index} variant='body2' sx={{ color: 'text.primary' }}>
                                    {item.salt_qty}
                                  </Typography>
                                )
                              })}
                            </TableCell>
                            <TableCell align='center'>
                              <IconButton
                                size='small'
                                sx={{ mr: 0.5 }}
                                aria-label='Edit'
                                onClick={() => {
                                  setShow(true)
                                  handleEditLineItems(item, index)
                                }}
                              >
                                <Icon icon='mdi:pencil-outline' />
                              </IconButton>

                              <IconButton
                                size='small'
                                sx={{ mr: 0.5 }}
                                onClick={() => {
                                  removeItemsFroTable(index)
                                }}
                              >
                                <Icon icon='mdi:delete-outline' />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid> */}
                  {/* <Grid item xs={12} sx={{ mt: 6 }}>
                <Card>
                  <CardHeader title='Upload Prescription' />
                  <CardContent>
                    <DropzoneWrapper sx={{ minHeight: '100px' }}>
                      <FileUploaderMultiple
                        onImageUpload={handleFileChange}
                        image={handleAddGalleryClick}
                        prescriptionField={prescriptionField}
                        imgBaseUrl={imgBaseUrl}
                      />
                    </DropzoneWrapper>
                    {/* <Box>
                      <Icon icon='material-symbols-light:close' onClick={() => removeselectedImage(index)}>
                        {' '}
                      </Icon>
                    </Box> */}
                  {/* </CardContent>
                </Card>
              </Grid> */}

                  <Grid item xs={12} sm={6}>
                    <Typography>Prescription Images</Typography>
                    {/* <Grid
                      item
                      sm={12}
                      xs={12}
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center'
                      }}
                    > */}
                    <input
                      type='file'
                      accept='image/*'
                      multiple
                      onChange={e => handleFileChange(e)}
                      style={{ display: 'none' }}
                      name='prescription_images'
                      ref={prescriptionRef}
                    />
                    {prescriptionField && (
                      <AddButton
                        title=' Add Prescription'
                        action={() => {
                          handlePrescriptionClick()
                        }}
                      />
                    )}
                    <ImageUploadComponent
                      fields={fields}
                      setValue={setValue}
                      prescriptionField={prescriptionField}
                      imgBaseUrl={imgBaseUrl}
                    />
                    {/* <Button fullWidth type='button' variant='contained' onClick={handleAddGalleryClick}>
                    Add Gallery
                  </Button> */}
                    {/* <ImageUploadCard
                    fields={fields}
                    removeselectedImage={removeselectedImage}
                    renderFilePreview={renderFilePreview}
                  /> */}

                    {/* {
                    <Box sx={{ display: 'flex', flexDirection: 'row', borderRadius: '10px' }}>
                      <CardContent>
                        <DropzoneWrapper className='dropzone'></DropzoneWrapper>
                        <Fragment>
                          <List>
                            {fields?.map((image, index) => (
                              // console.log('image results??????', image)
                              <ListItem key={image.file.name}>
                                <div className='file-details'>
                                  <div className='file-preview'>{renderFilePreview(image.file)}</div>
                                  <div>
                                    <Typography className='file-name'>
                                      {typeof file === 'string' ? image.file : image.file.name}
                                    </Typography>
                                  </div>
                                </div>
                                <IconButton onClick={() => removeselectedImage(index)}>
                                  <Icon icon='mdi:close' fontSize={20} />
                                </IconButton>
                              </ListItem>
                            ))}
                          </List>
                        </Fragment>

                      </CardContent>
                    </Box>
                  } */}
                    {/* </Grid> */}
                  </Grid>
                </Grid>
              </Grid>
              <Grid
                container
                sm={12}
                spacing={6}
                mt={4}
                item
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center'
                }}
              >
                <LoadingButton type='submit' sx={{ marginRight: '8px' }} size='large' variant='contained'>
                  Save
                </LoadingButton>
              </Grid>
            </CardContent>
          </form>
        </Card>
      </Grid>
    </Grid>
  )
}
