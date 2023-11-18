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
import FormGroup from '@mui/material/FormGroup'
import Autocomplete from '@mui/material/Autocomplete'
import Icon from '@mui/material/Icon'

import { LoadingButton } from '@mui/lab'
import Router from 'next/router'
import { useRouter } from 'next/router'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import FileUploaderSingle from 'src/views/forms/form-elements/file-uploader/FileUploaderSingle'

// ** Source code imports
import * as source from 'src/views/forms/form-elements/file-uploader/FileUploaderSourceCode'
import FallbackSpinner from 'src/@core/components/spinner/index'

import { addMedicine, getMedicineById, updateMedicineById } from 'src/lib/api/getMedicineList'
import { getStates } from 'src/lib/api/getStates'
import UserSnackbar from 'src/components/utility/snackbar'
import { getGenerics } from 'src/lib/api/getGenerics'
import { getDosageFormList } from 'src/lib/api/productForms'
import { getUnits } from 'src/lib/api/getUnits'
import { getDrugs } from 'src/lib/api/getDrugs'
import { getCategories } from 'src/lib/api/getCategories'
import { getLeafs } from 'src/lib/api/leaf'
import { getGstList } from 'src/lib/api/getGstList'
import { getManufacturers } from 'src/lib/api/manufacturer'
import { getPackages } from 'src/lib/api/packages'
import { getProductFormList } from 'src/lib/api/productForms'
import { getSalts } from 'src/lib/api/salts'
import { getDrugClass } from 'src/lib/api/getDrugs'
import { getStorage } from 'src/lib/api/storage'

const defaultValues = {
  medicine_type: 'allopathy',
  medicine_name: '',
  medicine_manufacturer: '',
  package_type: '',
  package_qty: '',
  package_uom: '',
  product_form: '',
  salts: [
    {
      salt_name: '',
      salt_qty: '',
      salt_id: ''
    }
  ],
  gst_slab: '',
  drug_class: '',
  storage: '',
  prescription_required: '0',
  controlled_substance: '0',
  part_out_of_stock: '0',
  side_effects: '',
  uses: '',
  safety_advice: '',
  image: '',
  status: '1'
}

const schema = yup.object().shape({
  medicine_type: yup.string().required('Medicine Type name is required'),
  medicine_name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Medicine name is required'),
  manufacturer: yup.string().required('Manufacturer name is required'),
  package_type: yup.string().required('Package is required'),
  package_qty: yup.number().typeError('This should be a number').required('Package Quantity is required'),
  package_uom: yup.string().required('UOM is required'),
  product_form: yup.string().required('Product Form is required'),
  salts: yup.array().of(
    yup.object().shape({
      salt_name: yup.string().nullable(),
      salt_qty: yup.string().nullable(),
      salt_id: yup.string().nullable()
    })
  ),
  gst_slab: yup.number().typeError('GST slab is required').required('GST slab is required'),
  drug_class: yup.string().nullable(),
  storage: yup.string().nullable(),
  prescription_required: yup.string().required('Prescription is required'),
  controlled_substance: yup.string().required('Controlled substance is required'),
  part_out_of_stock: yup.string().required('part of out of stock is required'),
  side_effects: yup.string().nullable(),
  uses: yup.string().nullable(),
  safety_advice: yup.string().nullable(),
  status: yup.string().nullable()
})

const AddMedicine = () => {
  // ** Hooks
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
    setValue
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
  const [drugsClassList, setDrugsClass] = useState([])
  const [categoryList, setCategoryList] = useState([])
  const [leafList, setLeafList] = useState([])
  const [gstList, setGstList] = useState([])
  const [files, setFiles] = useState([])
  const [uploadedImage, setUploadedImage] = useState()

  const [loader, setLoader] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)

  const [manufacturer, setManufacturers] = useState([])
  const [packages, setPackages] = useState([])
  const [productForm, setProductForm] = useState([])
  const [saltsList, setSalts] = useState([])
  const [medicineType, setMedicineType] = useState('allopathy')
  const [uomList, setUom] = useState([])
  const [storageList, setStorageList] = useState([])

  //Default preSelected values on Edit

  const [defaultManufacturer, setDefaultManufacturer] = useState(undefined)
  const [defaultPackage, setDefaultPackage] = useState(undefined)
  const [defaultUom, setDefaultUom] = useState(undefined)
  const [defaultProductForm, setDefaultProductForm] = useState(undefined)
  const [defaultSaltName, setDefaultSaltName] = useState(undefined)
  const [defaultDrugClass, setDefaultDrugClass] = useState(undefined)
  const [defaultStorage, setDefaultStorage] = useState(undefined)
  const [defaultSalts, setDefaultSalts] = useState([])

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })

  const getManufacturersList = async ({ key, page, limit }) => {
    try {
      const params = {
        q: key,
        active: 1,
        page,
        limit
      }
      await getManufacturers({ params: params }).then(res => {
        setManufacturers(res?.data?.list_items)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const getPackagesList = async ({ key, page, limit }) => {
    try {
      const params = {
        q: key,
        active: 1,
        page,
        limit
      }
      await getPackages({ params: params }).then(res => {
        setPackages(res?.data?.list_items)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const getProductForm = async ({ key, page, limit }) => {
    try {
      const params = {
        q: key,
        active: 1,
        page,
        limit
      }
      await getProductFormList({ params: params }).then(res => {
        setProductForm(res?.data?.list_items)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const getSaltsList = async ({ key, page, limit }) => {
    try {
      const params = {
        q: key,
        active: 1,
        page,
        limit
      }
      await getSalts({ params: params }).then(res => {
        setSalts(res?.data?.list_items)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const getDrugsClassList = async ({ key, page, limit }) => {
    try {
      const params = {
        q: key,
        active: 1,
        page,
        limit
      }
      await getDrugClass({ params: params }).then(res => {
        setDrugsClass(res?.data?.list_items)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const getUnitsList = async ({ key, page, limit }) => {
    try {
      const params = {
        q: key,
        active: 1,
        page,
        limit
      }
      await getUnits({ params: params }).then(res => {
        setUom(res?.data?.list_items)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const getStorageList = async ({ key, page, limit }) => {
    try {
      const params = {
        q: key,
        active: 1,
        page,
        limit
      }
      await getStorage({ params: params }).then(res => {
        setStorageList(res?.data?.list_items)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const getStatesList = async () => {
    try {
      setLoader(true)
      const response = await getStates()
      console.log(response)
      if (response?.length > 0) {
        setStatesList(response)
      }
    } catch (e) {
      console.log(e)
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

  // const getDrugsClassList = async () => {
  //   const response = await getDrugs()
  //   if (response?.length > 0) {
  //     setDrugsClass(response)
  //   }
  // }

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
    try {
      const response = await getGstList()
      if (response?.length > 0) {
        setGstList(response)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const onImageUpload = async imageData => {
    setFiles(imageData)
  }

  const getMedicine = async id => {
    debugger
    setLoader(true)
    try {
      const response = await getMedicineById(id)
      if (response.success) {
        var data = { ...response?.data, medicine_name: response.data.name }
        debugger
        console.log(data)
        setManufacturers([{ id: response?.data?.manufacturer, label: response?.data?.manufacturer_name }])

        setUploadedImage(response?.data?.image ? response?.data?.image : '/images/tablet.PNG')

        const salts = []
        if (response.data.salts.length > 0) {
          response.data.salts.map((value, index) => {
            const salt = {}
            salt['label'] = value.label
            salt['salt_qty'] = value.qty
            salt['id'] = value.id.toString()
            salts.push(salt)
          })
        }
        setDefaultManufacturer({ id: response.data.manufacturer, label: response.data.manufacturer_name })
        setDefaultPackage({ id: response.data.package_type, label: response.data.package })
        setDefaultUom({ id: response.data.package_uom, unit_name: response.data.package_uom_label })
        setDefaultProductForm({ id: response.data.product_form, label: response.data.product_form_label })
        setDefaultDrugClass({ id: response.data.drug_class, label: response.data.drug_class_label })
        setDefaultStorage({ id: response.data.storage, label: response.data.storage_value })
        setDefaultSalts(salts)

        console.log(salts)

        reset({
          ...response.data,
          medicine_type: response.data.stock_type,
          medicine_name: response.data.name,
          salts: salts
        })
      }
      setLoader(false)
    } catch (e) {
      console.log(e)
      setLoader(false)
    }
  }

  useEffect(() => {
    getGSTList()

    if (id != undefined && action === 'edit') {
      debugger
      getMedicine(id)
    } else {
      getManufacturersList({ page: 1, limit: 10 })
      getPackagesList({ page: 1, limit: 10 })
      getUnitsList({ page: 1, limit: 10 })
      getProductForm({ page: 1, limit: 10 })
      getSaltsList({ page: 1, limit: 10 })
      getDrugsClassList({ page: 1, limit: 10 })
      getStorageList({ page: 1, limit: 10 })
    }
  }, [id, action])

  const onSubmit = async params => {
    console.log('params', params)

    // setSubmitLoader(true)

    const {
      medicine_type,
      medicine_name,
      manufacturer,
      package_type,
      package_qty,
      package_uom,
      product_form,
      salts,
      gst_slab,
      drug_class,
      storage,
      prescription_required,
      controlled_substance,
      part_out_of_stock,
      side_effects,
      uses,
      safety_advice,
      status
    } = {
      ...params
    }

    // console.log(params)

    const payload = {
      medicine_type,
      medicine_name,
      manufacturer,
      package_type,
      package_qty,
      package_uom,
      product_form,
      salts,
      gst_slab,
      drug_class,
      storage,
      prescription_required,
      controlled_substance,
      part_out_of_stock,
      side_effects,
      uses,
      safety_advice,
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
      debugger

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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'salts'
  })

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
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
                  {/* <form onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}> */}
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={5}>
                      <Grid item xs={12} sm={12}>
                        <div>Medicine</div>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel error={Boolean(errors?.medicine_type)} id='medicine_type'>
                            Medicine Type*
                          </InputLabel>
                          <Controller
                            name='medicine_type'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Select
                                name='medicine_type'
                                value={value}
                                label='Medicine Type*'
                                onChange={e => {
                                  console.log(e.target.value)

                                  if (e.target.value === 'non_medical') {
                                    //reset({ salts: [] }, { keepValues: true })
                                    setValue('salts', [])
                                  } else {
                                    //reset({ salts: [{}] }, { keepValues: true })
                                    setValue('salts', [{}])
                                  }
                                  onChange(e.target.value)
                                  setMedicineType(e.target.value)
                                }}
                                error={Boolean(errors?.medicine_type)}
                                labelId='medicine_type'
                              >
                                <MenuItem value='allopathy'>Allopathy</MenuItem>
                                <MenuItem value='ayurveda'>Ayurveda</MenuItem>
                                <MenuItem value='unani'>Unani</MenuItem>
                                <MenuItem value='non_medical'>Non Medical</MenuItem>
                              </Select>
                            )}
                          />
                          {errors?.medicine_type && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.medicine_type?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='medicine_name'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                label='Medicine Name*'
                                name='medicine_name'
                                error={Boolean(errors.medicine_name)}
                                onChange={onChange}
                                placeholder=''
                              />
                            )}
                          />
                          {errors.medicine_name && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.medicine_name?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='manufacturer'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Autocomplete
                                disablePortal
                                id='manufacturer'
                                value={defaultManufacturer}
                                options={manufacturer}
                                getOptionLabel={option => option.label}
                                isOptionEqualToValue={(option, value) => parseInt(option.id) === parseInt(value.id)}
                                onChange={(e, val) => {
                                  if (val === null) {
                                    setDefaultManufacturer(undefined)

                                    return onChange('')
                                  } else {
                                    setDefaultManufacturer(val)

                                    return onChange(val.id)
                                  }
                                }}
                                onKeyUp={e => {
                                  getManufacturersList({ key: e.target.value })
                                }}
                                renderInput={params => (
                                  <TextField {...params} label='Manufacturer*' error={Boolean(errors.manufacturer)} />
                                )}
                              />
                            )}
                          />
                          {errors?.manufacturer && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.manufacturer?.message}{' '}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      {/* Packages */}

                      <Grid item xs={12} sm={12}>
                        <div>Package</div>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                          <Controller
                            name='package_type'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Autocomplete
                                value={defaultPackage}
                                disablePortal
                                id='package_type'
                                options={packages}
                                getOptionLabel={option => option.label}
                                isOptionEqualToValue={(option, value) => parseInt(option.id) === parseInt(value.id)}
                                onChange={(e, val) => {
                                  if (val === null) {
                                    setDefaultPackage(undefined)

                                    return onChange('')
                                  } else {
                                    setDefaultPackage(val)

                                    return onChange(val.id)
                                  }
                                }}
                                onKeyUp={e => {
                                  getPackagesList({ key: e.target.value })
                                }}
                                renderInput={params => (
                                  <TextField {...params} label='Package*' error={Boolean(errors.package_type)} />
                                )}
                              />
                            )}
                          />
                          {errors?.package_type && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.package_type?.message}{' '}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                          <Controller
                            name='package_qty'
                            control={control}
                            rules={{ required: false }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                label='Quantity*'
                                onChange={onChange}
                                placeholder='Quantity*'
                                error={Boolean(errors.package_qty)}
                                name='package_qty'
                              />
                            )}
                          />
                          {errors?.package_qty && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.package_qty?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                          <Controller
                            name='package_uom'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Autocomplete
                                value={defaultUom}
                                disablePortal
                                id='package_uom'
                                options={uomList}
                                getOptionLabel={option => option.unit_name}
                                isOptionEqualToValue={(option, value) => parseInt(option.id) === parseInt(value.id)}
                                onChange={(e, val) => {
                                  if (val === null) {
                                    setDefaultUom(undefined)

                                    return onChange('')
                                  } else {
                                    setDefaultUom(val)

                                    return onChange(val.id)
                                  }
                                }}
                                onKeyUp={e => {
                                  getUnitsList(e.target.value)
                                }}
                                renderInput={params => (
                                  <TextField {...params} label='UOM*' error={Boolean(errors.package_uom)} />
                                )}
                              />
                            )}
                          />
                          {errors?.package_uom && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.package_uom?.message}{' '}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                          <Controller
                            name='product_form'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Autocomplete
                                value={defaultProductForm}
                                disablePortal
                                id='product_form'
                                options={productForm}
                                getOptionLabel={option => option.label}
                                isOptionEqualToValue={(option, value) => parseInt(option.id) === parseInt(value.id)}
                                onChange={(e, val) => {
                                  if (val === null) {
                                    setDefaultProductForm(undefined)

                                    return onChange('')
                                  } else {
                                    setDefaultProductForm(val)

                                    return onChange(val.id)
                                  }
                                }}
                                onKeyUp={e => {
                                  getProductForm({ key: e.target.value })
                                }}
                                renderInput={params => (
                                  <TextField {...params} label='Product Form*' error={Boolean(errors.product_form)} />
                                )}
                              />
                            )}
                          />
                          {errors?.product_form && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.product_form?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      {/* //Package */}

                      {/* Salt Composition */}

                      {medicineType !== 'non_medical' && (
                        <Grid item xs={12} sm={12}>
                          <FormGroup>
                            <Grid container item xs={12} sm={12} alignItems='center' spacing={2}>
                              <Grid item xs={6}>
                                <span style={{ marginRight: '10px' }}>Salt Composition</span>
                              </Grid>
                            </Grid>
                            {fields.map((field, index) => (
                              <Grid container spacing={5} key={field.id} style={{ marginTop: '0px' }}>
                                <Grid item xs={5}>
                                  <FormControl fullWidth>
                                    <Controller
                                      name={`salts[${index}].salt_id`}
                                      control={control}
                                      rules={{ required: true }}
                                      render={({ field: { value, onChange } }) => (
                                        <Autocomplete
                                          value={defaultSalts[index]}
                                          disablePortal
                                          id={`salts[${index}].salt_id`}
                                          options={saltsList}
                                          getOptionLabel={option => option.label}
                                          isOptionEqualToValue={(option, value) => {
                                            debugger

                                            return parseInt(option.id) === parseInt(value.id)
                                          }}
                                          onChange={(e, val) => {
                                            if (val === null) {
                                              //setDefaultProductForm(undefined)
                                              var saltComposition = defaultSalts
                                              saltComposition[index] = undefined
                                              setDefaultSalts(saltComposition)

                                              return onChange('')
                                            } else {
                                              debugger
                                              var saltComposition = defaultSalts
                                              saltComposition[index] = val
                                              setDefaultSalts(saltComposition)

                                              return onChange(val.id)
                                            }
                                          }}
                                          onKeyUp={e => {
                                            getSaltsList({ key: e.target.value })
                                          }}
                                          renderInput={params => (
                                            <TextField
                                              {...params}
                                              label='Salt Name'
                                              error={Boolean(errors?.salts?.[index]?.salt_id)}
                                            />
                                          )}
                                        />
                                      )}
                                    />
                                    {errors?.salts?.[index]?.salt_id && (
                                      <FormHelperText sx={{ color: 'error.main' }}>
                                        {errors?.salts?.[index]?.salt_id?.message}
                                      </FormHelperText>
                                    )}
                                  </FormControl>
                                </Grid>
                                <Grid item xs={5}>
                                  <FormControl fullWidth>
                                    <Controller
                                      name={`salts[${index}].salt_qty`}
                                      control={control}
                                      rules={{ required: false }}
                                      render={({ field: { value, onChange } }) => (
                                        <TextField
                                          value={value}
                                          label='Salt Quantity'
                                          onChange={onChange}
                                          placeholder='Salt Quantity'
                                          error={Boolean(errors?.salts?.[index]?.salt_qty)}
                                          name={`salts[${index}].salt_qty`}
                                        />
                                      )}
                                    />
                                    {errors?.salts?.[index]?.salt_qty && (
                                      <FormHelperText sx={{ color: 'error.main' }}>
                                        {errors?.salts?.[index]?.salt_qty?.message}
                                      </FormHelperText>
                                    )}
                                  </FormControl>
                                </Grid>

                                <Grid item xs={2} justifyContent='flex-end' alignSelf='center'>
                                  {index === 0 ? (
                                    <Button variant='outlined' onClick={() => append({})}>
                                      Add Another
                                    </Button>
                                  ) : (
                                    <Button variant='outlined' color='error' onClick={() => remove(index)}>
                                      Remove
                                    </Button>
                                  )}
                                </Grid>
                              </Grid>
                            ))}
                          </FormGroup>
                        </Grid>
                      )}
                      {/* <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <Controller
                        name='package'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <Autocomplete
                            disablePortal
                            id='package'
                            options={[]}
                            onKeyUp={e => {
                              console.log('eee values', e.target.value)
                            }}
                            renderInput={params => (
                              <TextField {...params} label='Package*' error={Boolean(errors.package)} />
                            )}
                          />
                        )}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <Controller
                        name='package_quantity'
                        control={control}
                        rules={{ required: false }}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            value={value}
                            label='Quantity*'
                            onChange={onChange}
                            placeholder='Quantity*'
                            error={Boolean(errors.package_quantity)}
                            name='package_quantity'
                          />
                        )}
                      />
                      {errors?.package_quantity && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors?.package_quantity?.message}{' '}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid> */}

                      {/* //Salt Composition */}
                      {/* Others */}
                      <Grid item xs={12} sm={12}>
                        <div>Others</div>
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
                                error={Boolean(errors?.gst_slab)}
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
                            name='drug_class'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Autocomplete
                                value={defaultDrugClass}
                                disablePortal
                                id='drug_class'
                                options={drugsClassList}
                                getOptionLabel={option => option.label}
                                isOptionEqualToValue={(option, value) => parseInt(option.id) === parseInt(value.id)}
                                onChange={(e, val) => {
                                  if (val === null) {
                                    setDefaultDrugClass(undefined)

                                    return onChange('')
                                  } else {
                                    setDefaultDrugClass(val)

                                    return onChange(val.id)
                                  }
                                }}
                                onKeyUp={e => {
                                  getDrugsClassList({ key: e.target.value })
                                }}
                                renderInput={params => (
                                  <TextField {...params} label='Drug Class' error={Boolean(errors.drug_class)} />
                                )}
                              />
                            )}
                          />
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='storage'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Autocomplete
                                value={defaultStorage}
                                disablePortal
                                id='storage'
                                options={storageList}
                                getOptionLabel={option => option.label}
                                isOptionEqualToValue={(option, value) => parseInt(option.id) === parseInt(value.id)}
                                onChange={(e, val) => {
                                  if (val === null) {
                                    setDefaultStorage(undefined)

                                    return onChange('')
                                  } else {
                                    setDefaultStorage(val)

                                    return onChange(val.id)
                                  }
                                }}
                                onKeyUp={e => {
                                  getStorageList({ key: e.target.value })
                                }}
                                renderInput={params => (
                                  <TextField {...params} label='Storage' error={Boolean(errors.storage)} />
                                )}
                              />
                            )}
                          />
                          {errors?.storage && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.storage?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel error={Boolean(errors?.controlled_substance)} id='controlled_substance'>
                            Controlled Substances
                          </InputLabel>
                          <Controller
                            name='controlled_substance'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Select
                                name='controlled_substance'
                                value={value}
                                label='Controlled substances'
                                onChange={onChange}
                                error={Boolean(errors?.controlled_substance)}
                                labelId='controlled_substance'
                              >
                                <MenuItem value='1'> Yes</MenuItem>
                                <MenuItem value='0'> No</MenuItem>
                              </Select>
                            )}
                          />
                          {errors?.controlled_substance && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.controlled_substance?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel error={Boolean(errors?.prescription_required)} id='prescription_required'>
                            Prescription Required
                          </InputLabel>
                          <Controller
                            name='prescription_required'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Select
                                name='prescription_required'
                                value={value}
                                label='Prescription Required'
                                onChange={onChange}
                                error={Boolean(errors?.prescription_required)}
                                labelId='prescription_required'
                              >
                                <MenuItem value='1'> Yes</MenuItem>
                                <MenuItem value='0'> No</MenuItem>
                              </Select>
                            )}
                          />
                          {errors?.prescription_required && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.prescription_required?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel error={Boolean(errors?.part_out_of_stock)} id='part_out_of_stock'>
                            Part Out of Stock
                          </InputLabel>
                          <Controller
                            name='part_out_of_stock'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Select
                                name='part_out_of_stock'
                                value={value}
                                label='Out of Stock'
                                onChange={onChange}
                                error={Boolean(errors?.part_out_of_stock)}
                                labelId='part_out_of_stock'
                              >
                                <MenuItem value='1'> Yes</MenuItem>
                                <MenuItem value='0'> No</MenuItem>
                              </Select>
                            )}
                          />
                          {errors?.part_out_of_stock && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.part_out_of_stock?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='side_effects'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                label='Common Side Effects'
                                name='side_effects'
                                onChange={onChange}
                                placeholder=''
                                multiline
                                rows={4}
                              />
                            )}
                          />
                          {errors.side_effects && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.side_effects?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='uses'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                label='Uses'
                                name='uses'
                                onChange={onChange}
                                placeholder=''
                                multiline
                                rows={4}
                              />
                            )}
                          />
                          {errors.uses && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.uses?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='safety_advice'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                label='Safety Advice'
                                name='safety_advice'
                                onChange={onChange}
                                placeholder=''
                                multiline
                                rows={4}
                              />
                            )}
                          />
                          {errors.safety_advice && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.safety_advice?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        {id !== undefined ? (
                          <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.radio)}>
                            <FormLabel>Status</FormLabel>
                            <Controller
                              name='active'
                              control={control}
                              rules={{ required: true }}
                              render={({ field }) => (
                                <RadioGroup row {...field} name='validation-basic-radio'>
                                  <FormControlLabel
                                    value='1'
                                    label='Active'
                                    sx={errors.status ? { color: 'error.main' } : null}
                                    control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
                                  />
                                  <FormControlLabel
                                    value='0'
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
                          <UserSnackbar
                            severity={openSnackbar?.severity}
                            status={true}
                            message={openSnackbar?.message}
                          />
                        ) : null}
                      </Grid>
                    </Grid>
                  </form>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </>
  )
}

export default AddMedicine
