import { yupResolver } from '@hookform/resolvers/yup'
import {
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
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
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { useRef, useState, useEffect } from 'react'
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
import { useRouter } from 'next/router'
import { AddButton } from 'src/components/Buttons'
import FileUploaderMultiple from 'src/views/forms/form-elements/file-uploader/FileUploaderMultiple'

// ** Styled Component
import DropzoneWrapper from 'src/@core/styles/libs/react-dropzone'

export default function AddProduct() {
  const fileInputRef = useRef(null)
  const [show, setShow] = useState(false)
  const [storeList, setStoreList] = useState([])
  const [dataChildValues, setDataChildValues] = useState([])
  const [editValues, setEditValues] = useState(dataChildValues)
  const [editIndex, setEditIndex] = useState(null)
  const [successFulModal, setSuccessFulModal] = useState(false)
  const [imgBaseUrl, SetImgBaseUrl] = useState()
  const [getDetails, setGetDetails] = useState()
  const [prescriptionField, setPrescriptionField] = useState([])

  const [responseImage, setResponseImage] = useState()

  useEffect(() => {
    getStoreList({ params: { type: 'central' } })
      .then(res => setStoreList(res.data))
      .catch(err => console.log(err))
  }, [])

  const schema = yup.object().shape({
    from_store: yup.string().required('Select the From Store')
  })

  const defaultValues = {
    from_store: '',
    comment: '',
    quantity: 0,
    prescription_images: []
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

  const handleFileChange = event => {
    const newImages = Array.from(event).map(file => ({
      file
    }))
    setValue('prescription_images', newImages)
  }

  const handleAddGalleryClick = () => {
    fileInputRef.current.click()
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

  const onSubmit = async data => {
    const { from_store, comment, prescription_images } = data

    const listImages = []
    prescription_images?.map(file => {
      return listImages?.push(file.file)
    })

    const payload = {
      from_store: from_store,
      comments: comment,
      prescription_images: listImages,
      request_item_details: dataChildValues
    }

    let response

    try {
      if (id) {
        response = await updateNonExistingProduct(payload, id)
      } else {
        response = await addNonExistingProduct(payload)
      }

      if (response) {
        setSuccessFulModal(true)

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

  const handleUpdate = (item, itemIndex, dataFromChild) => {
    const updatedItems = [...dataChildValues]
    let dataUpdate = dataFromChild
    if (item?.request_item_detail_id) {
      dataUpdate['request_item_detail_id'] = item.request_item_detail_id
    }
    updatedItems[itemIndex] = dataUpdate
    setDataChildValues(updatedItems)
  }

  const handleCallback = dataFromChild => {
    if (editValues || editValues.request_item_detail_id) {
      handleUpdate(editValues, editIndex, dataFromChild)
    } else {
      setDataChildValues([...dataChildValues, dataFromChild])
    }
  }

  const handleEditLineItems = (item, index) => {
    setEditValues(item)
    setEditIndex(index)
  }

  const router = useRouter()
  const { id } = router.query

  const getSpecificProductList = async id => {
    await getNonExistingProductById(id).then(res => {
      SetImgBaseUrl(res?.base_path)
      setGetDetails(res?.data)
      setDataChildValues(res?.data?.request_item_details)
      setPrescriptionField(res.data?.prescription_images)

      res?.data?.request_item_details?.map(item => setResponseImage(item?.product_image))

      reset({
        comment: res?.data?.comments,
        from_store: res?.data?.from_store
      })
    })
  }

  useEffect(() => {
    if (id) {
      getSpecificProductList(id)
    }
  }, [id])

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Add Product Form' />
          {successFulModal && (
            <Box
              sx={{
                backgroundColor: 'cornsilk',
                width: '1500px',
                textAlign: 'center',
                fontSize: '20px'
              }}
            >
              <Typography>Data Successfully Submitted</Typography>
            </Box>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent>
              <Grid container spacing={6}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>From Store</InputLabel>
                    <Controller
                      name='from_store'
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Select {...field} label='Select From Store'>
                          {storeList?.list_items?.map(item => {
                            return (
                              <MenuItem key={item.id} value={item.id}>
                                {item.name}
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
                      defaultValue=''
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
              <Grid container sm={12} xs={12}>
                <Grid
                  item
                  sm={12}
                  xs={12}
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    my: '10px',
                    alignItems: 'center'
                  }}
                >
                  <AddButton
                    title='Add Request Item'
                    action={() => {
                      setShow(true)
                      setEditValues('')
                    }}
                  />
                </Grid>
              </Grid>
              <Grid item xs={12} sm={12}>
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
              </Grid>
              <Grid item xs={12} sx={{ mt: 6 }}>
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
                  </CardContent>
                </Card>
              </Grid>
              {/* <Grid container sm={12} xs={12}>
                <Grid
                  item
                  sm={12}
                  xs={12}
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center'
                  }}
                >
                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    name='prescription_images'
                    ref={fileInputRef}
                  />
                  <AddButton
                    title=' Add Gallery'
                    action={() => {
                      handleAddGalleryClick()
                    }}
                  />
                  {/* <Button fullWidth type='button' variant='contained' onClick={handleAddGalleryClick}>
                    Add Gallery
                  </Button> */}
              {/* <Box sx={{ display: 'flex', flexDirection: 'row', borderRadius: '10px' }}>
                {prescriptionField?.map((image, index) => (
                  <Box sx={{ padding: '10px', display: 'flex', flexDirection: 'row' }}>
                    <Box>
                      <img
                        width={150}
                        height={150}
                        key={index}
                        src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                        alt={`uploaded-${index}`}
                      />
                    </Box>
                  </Box>
                ))}
              </Box> */}
              {/* </Grid>
              </Grid> */}{' '}
              <Grid
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
          {show && (
            <CardContent>
              <Grid container>
                <CommonDialogBox
                  title={'Add Request Item'}
                  dialogBoxStatus={show}
                  formComponent={
                    <AddRequestLineItemsForm
                      handleCallback={handleCallback}
                      setShow={setShow}
                      imgBaseUrl={imgBaseUrl}
                      SetImgBaseUrl={SetImgBaseUrl}
                      responseImage={responseImage}
                      setResponseImage={setResponseImage}
                      dataChildValues={dataChildValues}
                      setDataChildValues={setDataChildValues}
                      editValues={editValues}
                      editIndex={editIndex}
                      handleUpdate={handleUpdate}
                    />
                  }
                  close={() => setShow(false)}
                  show={() => setShow(true)}
                />
              </Grid>
            </CardContent>
          )}
        </Card>
      </Grid>
    </Grid>
  )
}
