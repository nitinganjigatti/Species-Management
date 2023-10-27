import React, { useState, useEffect } from 'react'

// ** MUI Imports

import {
  Grid,
  styled,
  Button,
  Card,
  Radio,
  Select,
  MenuItem,
  Checkbox,
  TextField,
  FormLabel,
  CardHeader,
  InputLabel,
  IconButton,
  RadioGroup,
  CardContent,
  FormControl,
  OutlinedInput,
  FormHelperText,
  InputAdornment,
  FormControlLabel,
  CircularProgress
} from '@mui/material'

import { LoadingButton } from '@mui/lab'
import Router from 'next/router'
import { useRouter } from 'next/router'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import FileUploaderSingle from 'src/views/forms/form-elements/file-uploader/FileUploaderSingle'

// ** Source code imports
import * as source from 'src/views/forms/form-elements/file-uploader/FileUploaderSourceCode'

import { addMedicine, getMedicineById, updateMedicineById } from 'src/lib/api/getMedicineList'
import { getStates } from 'src/lib/api/getStates'
import UserSnackbar from 'src/components/utility/snackbar'
import { getGenerics } from 'src/lib/api/getGenerics'
import { getDosageFormList } from 'src/lib/api/getDosageFormList'
import { getUnits } from 'src/lib/api/getUnits'
import { getDrugs } from 'src/lib/api/getDrugs'
import { getCategories } from 'src/lib/api/getCategories'
import { getLeafs } from 'src/lib/api/leaf'
import { getGstList } from 'src/lib/api/getGstList'

const defaultValues = {
  name: '',
  supplier_price: 0,
  generic_name_id: '',
  type_id: '',
  unit_id: '',
  gst_slab: '',
  leaf_id: '',
  category_id: '',
  image: '',
  qrcode: '',
  status: 'active',
  dose: '',
  drug_class_id: '',
  brand_sustance: 'no',
  part_of_out_of_stock: 'yes',
  concentration: '',
  contents: ''
}

const schema = yup.object().shape({
  name: yup.string().required('Medicine name is required'),
  supplier_price: yup.number().nullable(),
  generic_name_id: yup.number().typeError('Generic name is required').required('Generic name is required'),
  type_id: yup.number().typeError('Medicine Form is required').required('Medicine Form is required'),
  unit_id: yup.number().nullable(),
  gst_slab: yup.number().typeError('GST slab is required').required('GST slab is required'),
  leaf_id: yup.number().typeError('Leaf is required').required('Leaf is required'),
  category_id: yup.number().typeError('Category is required').required('Category is required'),
  image: yup.string().nullable(),
  qrcode: yup.string().nullable(),
  status: yup.string().nullable(),
  dose: yup.string().nullable(),
  drug_class_id: yup.string().required('Drug Class is required'),
  brand_sustance: yup.string().required('Brand sustenance is required'),
  part_of_out_of_stock: yup.string().required('part of out of stock is required'),
  concentration: yup.string().nullable(),
  contents: yup.string().nullable()
})

const AddMedicine = () => {
  // ** Hooks
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const router = useRouter()
  const { id, action } = router.query

  const [statesList, setStatesList] = useState([])
  const [genericNames, setGenericNames] = useState([])
  const [dosageForms, setDosageForms] = useState([])
  const [units, setUnits] = useState([])
  const [drugsClass, setDrugsClass] = useState([])
  const [categoryList, setCategoryList] = useState([])
  const [leafList, setLeafList] = useState([])
  const [gstList, setGstList] = useState([])
  const [files, setFiles] = useState([])
  const [uploadedImage, setUploadedImage] = useState()

  const [loader, setLoader] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })

  const getStatesList = async () => {
    setLoader(true)
    const response = await getStates()
    console.log(response)
    if (response?.length > 0) {
      setStatesList(response)
    }
  }

  const getGenericNames = async () => {
    const response = await getGenerics()
    if (response?.length > 0) {
      setGenericNames(response)
    }
  }

  const getDosageForms = async () => {
    const response = await getDosageFormList()
    if (response?.length > 0) {
      setDosageForms(response)
    }
  }

  const getUnitsList = async () => {
    const response = await getUnits()
    if (response?.length > 0) {
      setUnits(response)
    }
  }

  const getDrugsClassList = async () => {
    const response = await getDrugs()
    if (response?.length > 0) {
      setDrugsClass(response)
    }
  }

  const getCategoriesList = async () => {
    const response = await getCategories()
    if (response?.length > 0) {
      setCategoryList(response)
    }
  }

  const getLeafList = async () => {
    const response = await getLeafs()
    if (response?.length > 0) {
      setLeafList(response)
    }
  }

  const getGSTList = async () => {
    const response = await getGstList()
    if (response?.length > 0) {
      setGstList(response)
    }
  }

  const onImageUpload = async imageData => {
    setFiles(imageData)
  }

  const getMedicine = async id => {
    setLoader(true)
    const response = await getMedicineById(id)
    if (response != undefined) {
      setUploadedImage(response?.image)
      reset(response)
    }
  }

  useEffect(() => {
    getGenericNames()
    getStatesList()
    getDosageForms()
    getUnitsList()
    getDrugsClassList()
    getCategoriesList()
    getLeafList()
    getGSTList()
    if (id != undefined && action === 'edit') {
      getMedicine(id)
    }
  }, [id, action])

  const onSubmit = async params => {
    setSubmitLoader(true)

    const {
      qrcode,
      name,
      generic_name_id,
      type_id,
      drug_class_id,
      category_id,
      leaf_id,
      brand_sustance,
      part_of_out_of_stock,
      supplier_price,
      gst_slab,
      contents,
      image,
      unit_id,
      dose,
      concentration,
      status
    } = {
      ...params
    }

    const payload = {
      qrcode,
      name,
      generic_name_id,
      type_id,
      drug_class_id,
      category_id,
      leaf_id,
      brand_sustance,
      part_of_out_of_stock,
      supplier_price,
      gst_slab,
      contents,
      unit_id,
      dose,
      concentration,
      status
    }
    if (files.length > 0) {
      payload.image = files[0]
    }
    if (id !== undefined && action === 'edit') {
      debugger
      await updateMedicine(payload, id)
    } else {
      console.log(payload)
      await addMedicineToList(payload)
    }
  }

  const updateMedicine = async (payload, id) => {
    try {
      const response = await updateMedicineById(payload, id)
      if (response?.success) {
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'success' })
        setSubmitLoader(true)
        reset(defaultValues)
        Router.push('/pharmacy/medicine/medicine')
      } else {
        setSubmitLoader(false)
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'error' })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
    }
  }

  const addMedicineToList = async payload => {
    try {
      console.log('payload', payload)

      const response = await addMedicine(payload)
      if (response?.success) {
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'success' })
        setSubmitLoader(true)
        reset(defaultValues)
        Router.push('/pharmacy/medicine/medicine')
      } else {
        setSubmitLoader(false)
        setOpenSnackbar({ ...openSnackbar, open: false, message: response?.message, severity: 'error' })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
    }
  }

  return (
    <>
      <Grid container spacing={6} className='match-height'>
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title={id ? 'Edit Medicine' : 'Add New Medicine'}
              action={
                <div>
                  <Button
                    size='big'
                    variant='contained'
                    onClick={() => {
                      Router.push('/pharmacy/medicine/medicine')
                    }}
                  >
                    Medicine List
                  </Button>
                </div>
              }
            />
            <CardContent>
              <form onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
                <Grid container spacing={5}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <Controller
                        name='qrcode'
                        control={control}
                        rules={{ required: false }}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            value={value}
                            label='Bar Code/QR Code'
                            onChange={onChange}
                            placeholder='Bar Code/QR Code'
                            error={Boolean(errors.qrcode)}
                            name='qrcode'
                          />
                        )}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <Controller
                        name='name'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            value={value}
                            label='Medicine Name*'
                            name='name'
                            error={Boolean(errors.name)}
                            onChange={onChange}
                            placeholder=''
                          />
                        )}
                      />
                      {errors.name && (
                        <FormHelperText sx={{ color: 'error.main' }}> {errors?.name?.message} </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel error={Boolean(errors?.generic_name_id)} id='generic_name_id'>
                        Generic Name*
                      </InputLabel>
                      <Controller
                        name='generic_name_id'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <Select
                            name='generic_name_id'
                            value={value}
                            label='Generic Name*'
                            onChange={onChange}
                            error={Boolean(errors?.generic_name_id)}
                            labelId='generic_name_id'
                          >
                            {genericNames?.map((item, index) => (
                              <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                                {item?.name}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors?.generic_name_id && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors?.generic_name_id?.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel error={Boolean(errors?.type_id)} id='type_id'>
                        Dosage Form*
                      </InputLabel>
                      <Controller
                        name='type_id'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <Select
                            name='type_id'
                            value={value}
                            label='Dosage Form*'
                            onChange={onChange}
                            error={Boolean(errors?.type_id)}
                            labelId='type_id'
                          >
                            {dosageForms?.map((item, index) => (
                              <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                                {item?.name}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors?.type_id && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors?.type_id?.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Grid container spacing={5}>
                      <Grid item xs={6} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='dose'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                label='Drug Doses'
                                name='dose'
                                onChange={onChange}
                                placeholder=''
                              />
                            )}
                          />
                          {errors.dose && (
                            <FormHelperText sx={{ color: 'error.main' }}> {errors?.dose?.message} </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel error={Boolean(errors?.unit_id)} id='unit_id'>
                            UOM
                          </InputLabel>
                          <Controller
                            name='unit_id'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Select
                                name='unit_id'
                                value={value}
                                label='UOM'
                                onChange={onChange}
                                error={Boolean(errors?.unit_id)}
                                labelId='unit_id'
                              >
                                {units?.map((item, index) => (
                                  <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                                    {item?.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                          {errors?.unit_id && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.unit_id?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel error={Boolean(errors?.drug_class_id)} id='drug_class_id'>
                        Drug Class*
                      </InputLabel>
                      <Controller
                        name='drug_class_id'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <Select
                            name='drug_class_id'
                            value={value}
                            label='Drug Class'
                            onChange={onChange}
                            error={Boolean(errors?.drug_class_id)}
                            labelId='drug_class_id'
                          >
                            {drugsClass?.map((item, index) => (
                              <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                                {item?.name}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors?.drug_class_id && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors?.drug_class_id?.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel error={Boolean(errors?.category_id)} id='category_id'>
                        Category*
                      </InputLabel>
                      <Controller
                        name='category_id'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <Select
                            name='category_id'
                            value={value}
                            label='Category'
                            onChange={onChange}
                            error={Boolean(errors?.category_id)}
                            labelId='category_id'
                          >
                            {categoryList?.map((item, index) => (
                              <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                                {item?.name}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors?.category_id && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors?.category_id?.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel error={Boolean(errors?.leaf_id)} id='leaf_id'>
                        Leaf*
                      </InputLabel>
                      <Controller
                        name='leaf_id'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <Select
                            name='leaf_id'
                            value={value}
                            label='Leaf'
                            onChange={onChange}
                            error={Boolean(errors?.leaf_id)}
                            labelId='leaf_id'
                          >
                            {leafList?.map((item, index) => (
                              <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                                {item?.name}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors?.leaf_id && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors?.leaf_id?.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel error={Boolean(errors?.brand_sustance)} id='brand_sustance'>
                        Controlled Substances*
                      </InputLabel>
                      <Controller
                        name='brand_sustance'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <Select
                            name='brand_sustance'
                            value={value}
                            label='Controlled Substances*'
                            onChange={onChange}
                            error={Boolean(errors?.brand_sustance)}
                            labelId='brand_sustance'
                          >
                            <MenuItem value='yes'> Yes</MenuItem>
                            <MenuItem value='no'> No</MenuItem>
                          </Select>
                        )}
                      />
                      {errors?.brand_sustance && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors?.brand_sustance?.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel error={Boolean(errors?.part_of_out_of_stock)} id='part_of_out_of_stock'>
                        Part Out of Stock
                      </InputLabel>
                      <Controller
                        name='part_of_out_of_stock'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <Select
                            name='part_of_out_of_stock'
                            value={value}
                            label='Out of Stock'
                            onChange={onChange}
                            error={Boolean(errors?.part_of_out_of_stock)}
                            labelId='part_of_out_of_stock'
                          >
                            <MenuItem value='yes'> Yes</MenuItem>
                            <MenuItem value='no'> No</MenuItem>
                          </Select>
                        )}
                      />
                      {errors?.part_of_out_of_stock && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors?.part_of_out_of_stock?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <Controller
                        name='supplier_price'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            value={value}
                            type='number'
                            label='Supplier Price'
                            onChange={onChange}
                            placeholder='Supplier Price'
                            name='supplier_price'
                          />
                        )}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel error={Boolean(errors?.gst_slab)} id='gst_slab'>
                        GST*
                      </InputLabel>
                      <Controller
                        name='gst_slab'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <Select
                            name='gst_slab'
                            value={value}
                            label='GST*'
                            onChange={onChange}
                            error={Boolean(errors?.part_of_out_of_stock)}
                            labelId='gst_slab'
                          >
                            {gstList?.map((item, index) => (
                              <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                                {item?.name}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors?.gst_slab && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors?.gst_slab?.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <Controller
                        name='contents'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <TextField value={value} label='Content' name='name' onChange={onChange} placeholder='' />
                        )}
                      />
                      {errors.name && (
                        <FormHelperText sx={{ color: 'error.main' }}> {errors?.contents?.message} </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    {id !== undefined ? (
                      <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.radio)}>
                        <FormLabel>Status</FormLabel>
                        <Controller
                          name='status'
                          control={control}
                          rules={{ required: true }}
                          render={({ field }) => (
                            <RadioGroup row {...field} name='validation-basic-radio'>
                              <FormControlLabel
                                value='active'
                                label='Active'
                                sx={errors.status ? { color: 'error.main' } : null}
                                control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
                              />
                              <FormControlLabel
                                value='inactive'
                                label='Inactive'
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
                    ) : null}
                  </Grid>

                  <Grid item xs={12}>
                    <Card>
                      <CardHeader title='Upload Medicine Picture' />
                      <CardContent>
                        <FileUploaderSingle onImageUpload={onImageUpload} image={uploadedImage} />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
                      Submit
                    </LoadingButton>
                    {openSnackbar.open ? (
                      <UserSnackbar severity={openSnackbar?.severity} status={true} message={openSnackbar?.message} />
                    ) : null}
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

export default AddMedicine
