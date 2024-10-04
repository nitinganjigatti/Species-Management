import React, { useState, useEffect, useRef, useContext } from 'react'

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
  RadioGroup,
  CardContent,
  FormControl,
  OutlinedInput,
  FormHelperText,
  InputAdornment,
  FormControlLabel,
  CircularProgress,
  Box
} from '@mui/material'
import IconButton from '@mui/material/IconButton'
import FormGroup from '@mui/material/FormGroup'
import Autocomplete from '@mui/material/Autocomplete'
import Icon from 'src/@core/components/icon'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { useSettings } from 'src/@core/hooks/useSettings'
import { debounce } from 'lodash'
import toast from 'react-hot-toast'

import { LoadingButton } from '@mui/lab'
import Router from 'next/router'
import { useRouter } from 'next/router'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import FileUploaderSingle from 'src/views/forms/form-elements/file-uploader/FileUploaderSingle'
import AddManufacturer from 'src/views/pages/pharmacy/medicine/manufacturers/addManufacturer'
import AddSalts from 'src/views/pages/pharmacy/medicine/salts/addSalts'

// ** Source code imports
import * as source from 'src/views/forms/form-elements/file-uploader/FileUploaderSourceCode'
import FallbackSpinner from 'src/@core/components/spinner/index'
import Error404 from 'src/pages/404'
import { addMedicine, getMedicineById, updateMedicineById } from 'src/lib/api/pharmacy/getMedicineList'
import { getStates } from 'src/lib/api/pharmacy/getStates'
import UserSnackbar from 'src/components/utility/snackbar'
import { getGenerics, addGenericName } from 'src/lib/api/pharmacy/genericNames'
import { getDosageFormList } from 'src/lib/api/pharmacy/productForms'
import { getUnits } from 'src/lib/api/pharmacy/getUnits'
import { getDrugs } from 'src/lib/api/pharmacy/getDrugs'
import { getCategories } from 'src/lib/api/pharmacy/getCategories'
import { getLeafs } from 'src/lib/api/pharmacy/leaf'
import { getGstList } from 'src/lib/api/pharmacy/getGstList'
import { getManufacturers } from 'src/lib/api/pharmacy/manufacturer'
import { getPackages } from 'src/lib/api/pharmacy/packages'
import { getProductFormList } from 'src/lib/api/pharmacy/productForms'
import { getSalts, addSalt } from 'src/lib/api/pharmacy/salts'
import { getDrugClass } from 'src/lib/api/pharmacy/getDrugs'
import { getStorage } from 'src/lib/api/pharmacy/storage'
import { addManufacturer } from 'src/lib/api/pharmacy/manufacturer'
import { AddButton, SwitchButton } from 'src/components/Buttons'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import GenericNamesList from '../../masters/generic'
import AddGenericName from 'src/views/pages/pharmacy/medicine/generic/addGenericName'

const defaultValues = {
  medicine_type: 'allopathy',
  medicine_name: '',
  manufacturer: '',
  generic_name_id: '',
  package_type: '',
  package_qty: '',
  package_uom: '',
  product_form: '',
  salts: [
    {
      label: '',
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
  active: '1',
  url: ''
}

const schema = yup.object().shape({
  medicine_type: yup.string().required('Product Type is required'),
  medicine_name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Product name is required'),
  manufacturer: yup.string().required('Manufacturer name is required'),

  generic_name_id: yup.string().when('medicine_type', {
    is: val => val !== 'non_medical',
    then: schema => schema.required('Generic name is required'),
    otherwise: schema => schema.optional().nullable()
  }),
  package_type: yup.string().required('Package is required'),
  package_qty: yup.number().typeError('This should be a number').required('Package Quantity is required'),
  package_uom: yup.string().nullable(),
  product_form: yup.string().required('Product Form is required'),
  salts: yup.array().of(
    yup.object().shape({
      salt_name: yup.string().nullable(),
      salt_qty: yup.string().nullable(),
      salt_id: yup.string().nullable()
    })
  ),
  drug_class: yup.string().nullable(),
  storage: yup.string().nullable(),
  prescription_required: yup.string().required('Prescription is required'),
  controlled_substance: yup.string().required('Controlled substance is required'),
  part_out_of_stock: yup.string().required('part of out of stock is required'),
  side_effects: yup.string().nullable(),
  uses: yup.string().nullable(),
  safety_advice: yup.string().nullable(),
  active: yup.string().nullable(),
  url: yup.string().url('Please enter a valid URL').nullable()
})

const AddMedicine = () => {
  // ** Hooks
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue,
    getValues
  } = useForm({
    defaultValues,

    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const { selectedPharmacy } = usePharmacyContext()

  const router = useRouter()
  const { id, action } = router.query

  // const queryParams = new URLSearchParams(window.location.search)
  // const productDetails = queryParams.get('productDetails')

  const { settings } = useSettings()
  const { skin } = settings

  const [drugsClassList, setDrugsClass] = useState([])
  const [gstList, setGstList] = useState([])
  const [files, setFiles] = useState([])
  const [uploadedImage, setUploadedImage] = useState()

  const [loader, setLoader] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)

  const [manufacturer, setManufacturers] = useState([])
  const [genericNameList, setGenericNameList] = useState([])
  const [packages, setPackages] = useState([])
  const [productForm, setProductForm] = useState([])
  const [saltsList, setSalts] = useState([])
  const [medicineType, setMedicineType] = useState('allopathy')
  const [uomList, setUom] = useState([])
  const [storageList, setStorageList] = useState([])

  const [packageQuantity, setPackageQuantity] = useState('')

  //Default preSelected values on Edit

  const [defaultManufacturer, setDefaultManufacturer] = useState(null)
  const [defaultGenericName, setDefaultGenericName] = useState(null)
  const [defaultPackage, setDefaultPackage] = useState(null)
  const [defaultUom, setDefaultUom] = useState(null)
  const [defaultProductForm, setDefaultProductForm] = useState(null)
  const [defaultSaltName, setDefaultSaltName] = useState(null)
  const [defaultDrugClass, setDefaultDrugClass] = useState(null)
  const [defaultStorage, setDefaultStorage] = useState(null)
  const [defaultSalts, setDefaultSalts] = useState([])
  const [shouldClearFields, setShouldClearFields] = useState(false)

  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [severity, setSeverity] = useState('success')

  // states for Manufacturer and salt

  const [openManufacturer, setOpenManufacturer] = useState(false)
  const [openSalt, setOpenSalt] = useState(false)
  const [popupLoader, setPopupLoader] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const editParamsInitialState = { id: null, name: null, active: null }
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const [genericsDrawerMenu, setGenericsDrawerMenu] = useState(false)
  const [genericsMenuLoader, setGenericsDrawerMenuLoader] = useState(false)

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

  const getGenericNames = async ({ key, page, limit }) => {
    try {
      const params = {
        q: key,
        active: 1,
        page,
        limit
      }
      await getGenerics({ params: params }).then(res => {
        setGenericNameList(res?.data?.list_items)
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
        const tempSaltsList = []
        res?.data?.list_items?.map((value, index) => {
          const tempSalt = {}
          tempSalt['salt_id'] = value.id
          tempSalt['label'] = value.label
          tempSaltsList.push(tempSalt)
        })
        setSalts(tempSaltsList)
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

  const getGSTList = async () => {
    try {
      const response = await getGstList({ params: {} })
      if (response?.success) {
        setGstList(response?.data?.list_items)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const onImageUpload = async imageData => {
    setFiles(imageData)
  }

  const getMedicine = async id => {
    setLoader(true)
    try {
      const response = await getMedicineById(id)
      if (response.success) {
        setUploadedImage(response?.data?.image ? response?.data?.image : '/images/tablet.png')
        const salts = []
        const tempSalts = []
        if (response?.data?.salts != null && response?.data?.salts?.length > 0) {
          response?.data?.salts?.map((value, index) => {
            const salt = {}
            const tempSalt = {}
            salt['label'] = value.label
            salt['salt_qty'] = value.qty
            salt['salt_id'] = value.id
            tempSalt['salt_id'] = value.id
            tempSalt['label'] = value.label
            salts.push(salt)
            tempSalts.push(tempSalt)
          })
        }
        setGenericNameList([
          {
            id: response?.data?.generic_id === null ? '' : response?.data?.generic_id,
            name: response?.data?.generic_name === null ? '' : response?.data?.generic_name
          }
        ])
        setManufacturers([{ id: response?.data?.manufacturer, label: response?.data?.manufacturer_name }])

        setPackages([{ id: response?.data?.package_type, label: response?.data?.package }])
        setUom([{ id: response?.data?.package_uom, unit_name: response?.data?.package_uom_label }])
        setProductForm([{ id: response?.data?.product_form, label: response?.data?.product_form_label }])
        setSalts(tempSalts !== null && tempSalts.length > 0 ? tempSalts : [])
        setMedicineType(response.data.stock_type)

        setDrugsClass(
          response?.data?.drug_class
            ? [{ id: response?.data?.drug_class, label: response?.data?.drug_class_label }]
            : []
        )

        setPackageQuantity(response?.data?.package_qty)

        setDefaultGenericName({
          id: response?.data?.generic_id === null ? '' : response?.data?.generic_id,
          name: response?.data?.generic_name === null ? '' : response?.data?.generic_name
        })
        setDefaultManufacturer({ id: response?.data?.manufacturer, label: response?.data?.manufacturer_name })
        setDefaultPackage({ id: response?.data?.package_type, label: response?.data?.package })
        setDefaultUom({ id: response?.data?.package_uom, unit_name: response?.data?.package_uom_label })
        setDefaultProductForm({ id: response?.data?.product_form, label: response?.data?.product_form_label })
        setDefaultDrugClass({ id: response?.data?.drug_class, label: response?.data?.drug_class_label })
        setDefaultStorage({ id: response?.data?.storage, label: response?.data?.storage_value })
        setDefaultSalts(
          salts !== null && salts.length > 0
            ? salts
            : [
                {
                  label: '',
                  salt_qty: '',
                  salt_id: ''
                }
              ]
        )

        reset({
          ...response.data,
          medicine_type: response.data.stock_type,
          medicine_name: response.data.name,
          generic_name_id: response?.data?.generic_id,
          salts:
            salts !== null && salts.length > 0
              ? salts
              : [
                  {
                    label: '',
                    salt_qty: '',
                    salt_id: ''
                  }
                ],
          status: response?.data?.active
        })
      }
      setLoader(false)
    } catch (e) {
      console.log(e)
      setLoader(false)
    }
  }

  const addGenericsHandleSubmitData = async payload => {
    console.log('payload.data', payload)
    try {
      setGenericsDrawerMenuLoader(true)
      var response = await addGenericName(payload)
      if (response?.success) {
        toast.success(response?.message)
        genericSearch('')
        setGenericsDrawerMenuLoader(false)
        handleSidebarClose()
      } else {
        handleSidebarClose()

        if (typeof response?.message === 'object') {
          Utility.errorMessageExtractorFromObject(response.message)
          setGenericsDrawerMenuLoader(false)
        } else {
          toast.error(response.message)
          setGenericsDrawerMenuLoader(false)
        }
      }
    } catch (e) {
      console.log(e)
      handleSidebarClose()
      setGenericsDrawerMenuLoader(false)
      toast.error(JSON.stringify(e))
    }
  }

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }

    setOpenSnackbar(false)
  }

  const setAlertDefaults = ({ message, severity, status }) => {
    setOpenSnackbar(status)
    setSnackbarMessage(message)
    setSeverity(severity)
  }

  const genericSearch = debounce(async value => {
    try {
      await getGenericNames({ key: value, active: 1, page: 1, limit: 20 })
    } catch (error) {
      console.error(error)
    }
  }, 500)

  const manufacturerSearch = debounce(async value => {
    try {
      await getManufacturersList({ key: value, active: 1, page: 1, limit: 20 })
    } catch (error) {
      console.error(error)
    }
  }, 500)

  const packageSearch = debounce(async value => {
    try {
      await getPackagesList({ key: value, active: 1, page: 1, limit: 20 })
    } catch (e) {
      console.log(e)
    }
  }, 500)

  const unitListSearch = debounce(async value => {
    try {
      await getUnitsList({ key: value, active: 1, page: 1, limit: 20 })
    } catch (e) {
      console.log(e)
    }
  }, 500)

  const productFormSearch = debounce(async value => {
    try {
      await getProductForm({ key: value, active: 1, page: 1, limit: 20 })
    } catch (e) {
      console.log(e)
    }
  }, 500)

  const saltsListSearch = debounce(async value => {
    try {
      await getSaltsList({ key: value, active: 1, page: 1, limit: 20 })
    } catch (e) {
      console.log(e)
    }
  }, 500)

  const drugClassListSearch = debounce(async value => {
    try {
      await getDrugsClassList({ key: value, active: 1, page: 1, limit: 20 })
    } catch (e) {
      console.log(e)
    }
  }, 500)

  const storageListSearch = debounce(async value => {
    try {
      await getStorageList({ key: value, active: 1, page: 1, limit: 20 })
    } catch (e) {
      console.log(e)
    }
  }, 500)

  useEffect(() => {
    // getGSTList()

    if (id != undefined && action === 'edit') {
      getMedicine(id)
    } else {
      reset(defaultValues)
      setDefaultPackage(null)
      setDefaultUom(null)
      setDefaultProductForm(null)
      setDefaultSaltName(null)
      setDefaultDrugClass(null)
      setDefaultStorage(null)
      setDefaultSalts([])
      setShouldClearFields(null)
      setDefaultManufacturer(null)
      setDefaultGenericName(null)
      setPackageQuantity('')

      setManufacturers([])
      setGenericNameList([])
      setPackages([])
      setProductForm([])
      setSalts([])
      setMedicineType('allopathy')
      setUom([])
      setStorageList([])

      genericSearch('')
      manufacturerSearch('')
      packageSearch('')
      unitListSearch('')
      productFormSearch('')
      saltsListSearch('')
      drugClassListSearch('')
      storageListSearch('')
    }
  }, [id, action])

  const shouldClearFieldsRef = useRef(false)

  const onSubmit = async params => {
    // setSubmitLoader(true)

    const {
      medicine_type,
      medicine_name,
      manufacturer,
      generic_name_id,
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
      active,
      url
    } = {
      ...params
    }

    const duplicatedSalts = [...salts]

    let filtered_salts = duplicatedSalts.filter(item => item.hasOwnProperty('salt_id') && item.salt_id.trim() !== '')

    const payload = {
      medicine_type,
      medicine_name,
      manufacturer,
      generic_name_id: medicine_type !== 'non_medical' ? generic_name_id : '',
      package_type,
      package_qty,
      package_uom,
      product_form,
      salts: filtered_salts.length > 0 && medicine_type !== 'non_medical' ? filtered_salts : [],
      gst_slab,
      drug_class,
      storage,
      prescription_required,
      controlled_substance,
      part_out_of_stock,
      side_effects,
      uses,
      safety_advice,
      status: active,
      url
    }
    if (files.length > 0) {
      payload.image = files[0]
    } else {
    }

    if (id !== undefined && action === 'edit') {
      console.log(payload)

      await updateMedicine(payload, id)
    } else {
      console.log(payload)

      await addMedicineToList(payload)
    }
  }

  const handleSubmitData = async () => {
    try {
      const errors = await trigger()
      const values = getValues()
      if (errors) {
        handleSubmit(onSubmit)()
      } else {
        scrollToTop()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleSubmitAddAnother = async () => {
    try {
      const errors = await trigger()
      if (errors) {
        shouldClearFieldsRef.current = true
        handleSubmit(onSubmit)()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const updateMedicine = async (payload, id) => {
    try {
      const response = await updateMedicineById(payload, id)
      if (response?.success) {
        setAlertDefaults({ status: true, message: response?.message, severity: 'success' })

        //setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'success' })
        setSubmitLoader(true)
        reset(defaultValues)
        Router.push('/pharmacy/medicine/product-list')
      } else {
        setSubmitLoader(false)

        // setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'error' })
        setAlertDefaults({ status: true, message: response?.message, severity: 'error' })
      }
    } catch (e) {
      setSubmitLoader(false)
      setAlertDefaults({ status: true, message: 'Error', severity: 'error' })

      // setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
    }
  }

  const addMedicineToList = async payload => {
    try {
      const response = await addMedicine(payload)

      if (response?.success) {
        setAlertDefaults({ status: true, message: response?.message, severity: 'success' })

        // setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'success' })
        setSubmitLoader(true)
        reset(defaultValues)
        if (shouldClearFieldsRef.current) {
          shouldClearFieldsRef.current = false
          setDefaultManufacturer(null)
          setDefaultGenericName(null)
          setDefaultPackage(null)
          setDefaultUom(null)
          setDefaultProductForm(null)
          setDefaultSaltName(null)
          setDefaultDrugClass(null)
          setDefaultStorage(null)
          setDefaultSalts([])
          setShouldClearFields(false)
        } else {
          Router.push('/pharmacy/medicine/product-list')
        }
        setSubmitLoader(false)
      } else {
        setSubmitLoader(false)

        // setOpenSnackbar({ ...openSnackbar, open: false, message: response?.message, severity: 'error' })
        shouldClearFieldsRef.current = false
        setAlertDefaults({ status: true, message: response?.message, severity: 'error' })
      }
    } catch (e) {
      setSubmitLoader(false)

      // setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
      setAlertDefaults({ status: true, message: 'Error', severity: 'error' })
      shouldClearFieldsRef.current = false
    }
  }

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'salts'
  })

  const checkDuplicateSalt = id => {
    const selectedSaltIds = defaultSalts.filter(salt => salt?.id == id)
    if (selectedSaltIds.length > 0) {
      return true
    } else {
      return false
    }
  }

  const addSaltButton = () => {
    return (
      <Button
        variant='outlined'
        onClick={() => {
          setSalts([])
          append({
            salt_qty: '',
            slat_id: ''
          })
        }}
        sx={{ marginRight: '4px', borderRadius: 6 }}
      >
        Add Another
      </Button>
    )
  }

  const removeSaltButton = index => {
    return (
      <Box>
        <Icon
          onClick={() => {
            var tempDefaultSalts = defaultSalts
            tempDefaultSalts.splice(index, 1)
            setDefaultSalts(tempDefaultSalts)
            remove(index)
          }}
          icon='material-symbols-light:close'
        />
      </Box>

      // <Button
      //   variant='outlined'
      //   color='error'
      //   startIcon={<Icon icon='material-symbols-light:close' />}
      //   onClick={() => {
      //     var tempDefaultSalts = defaultSalts
      //     tempDefaultSalts.splice(index, 1)
      //     setDefaultSalts(tempDefaultSalts)
      //     remove(index)
      //   }}
      // >
      //   {/* Remove */}
      // </Button>
    )
  }

  const clearSaltFields = index => {
    return (
      // eslint-disable-next-line lines-around-comment
      // <Button
      //   variant='outlined'
      //   onClick={() => {
      //     var tempDefaultSalts = defaultSalts
      //     tempDefaultSalts[index] = undefined
      //     setDefaultSalts(tempDefaultSalts)
      //     remove(index)
      //     insert(index, {})
      //   }}
      // >
      //   Clear
      // </Button>

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

  const handleAddRemoveSalts = (fields, index) => {
    if (fields.length - 1 === index && index > 0) {
      return (
        <>
          {addSaltButton()}
          {removeSaltButton(index)}
        </>
      )
    } else if (index <= 0 && fields.length - 1 <= 0) {
      return (
        <>
          {addSaltButton()}
          {clearSaltFields(index)}
        </>
      )
    } else if (index <= 0 && fields.length > 0) {
      return <>{clearSaltFields(index)}</>
    } else {
      return <>{removeSaltButton(index)}</>
    }
  }

  const getPackageString = () => {
    if (defaultPackage?.label) {
      return `(${defaultPackage?.label} of ${getValues('package_qty')} ${
        defaultUom?.unit_name ? defaultUom?.unit_name : ''
      } ${defaultProductForm?.label ? defaultProductForm?.label : ''})`
    } else {
      return ''
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleSidebarClose = () => {
    setOpenManufacturer(false)
    setOpenSalt(false)
    setResetForm(true)
    setPopupLoader(false)
    setGenericsDrawerMenu(false)
  }

  const addNewManufacturer = () => {
    setOpenManufacturer(true)
    setResetForm(false)
  }

  const addNewGenericNameSidebarOpen = () => {
    setGenericsDrawerMenu(true)
    setResetForm(false)
  }

  const addNewSalt = () => {
    setOpenSalt(true)
    setResetForm(false)
  }

  const handleManufacturer = async payload => {
    try {
      setPopupLoader(true)

      var response = await addManufacturer(payload)

      if (response?.success) {
        setAlertDefaults({ status: true, message: response?.message, severity: 'success' })
        setPopupLoader(false)
        setResetForm(true)
        setOpenManufacturer(false)
      } else {
        setPopupLoader(false)
        setAlertDefaults({ status: true, message: response?.message, severity: 'error' })
      }
    } catch (e) {
      setPopupLoader(false)
      setAlertDefaults({ status: true, message: 'Error', severity: 'error' })
    }
  }

  const handleSalt = async payload => {
    try {
      setPopupLoader(true)
      var response = await addSalt(payload)

      if (response?.success) {
        setAlertDefaults({ status: true, message: response?.message, severity: 'success' })
        setPopupLoader(false)
        setResetForm(true)
        setOpenSalt(false)
      } else {
        setPopupLoader(false)
        setAlertDefaults({ status: true, message: JSON.stringify(response?.message), severity: 'error' })
      }
    } catch (e) {
      console.log(e)
      setPopupLoader(false)
      setAlertDefaults({ status: true, message: JSON.stringify(e), severity: 'error' })
    }
  }

  return (
    <>
      {selectedPharmacy.type === 'central' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') ? (
        <>
          {loader ? (
            <FallbackSpinner />
          ) : (
            <>
              <Grid container spacing={6} className='match-height'>
                <Grid item xs={12}>
                  <Card>
                    <CardHeader
                      avatar={
                        <Icon
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            Router.push('/pharmacy/medicine/product-list')
                          }}
                          icon='ep:back'
                        />
                      }
                      title={id ? 'Edit Product' : 'Add New Product'}
                    />
                    {console.log(fields, 'fields')}
                    <CardContent>
                      <form onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
                        <Grid container spacing={5}>
                          {/* <Grid item xs={12}> */}
                          {/* <Grid container spacing={5}> */}

                          {/* <Grid item xs={12} sm={12}>
                            <div>Product</div>
                          </Grid> */}
                          {id ? (
                            <Grid item xs={12} sm={12}>
                              <SwitchButton
                                style={{ float: 'right' }}
                                title='Active'
                                status={watch('active') == 0 ? false : true}
                                action={() => {
                                  const status = watch('active') == 0 ? 1 : 0
                                  setValue('active', status)
                                }}
                              />
                            </Grid>
                          ) : null}
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel error={Boolean(errors?.medicine_type)} id='medicine_type'>
                                Product Type*
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
                                      if (e.target.value === 'non_medical') {
                                        //reset({ salts: [] }, { keepValues: true })
                                        //setValue('salts', [])
                                      } else {
                                        //reset({ salts: [{}] }, { keepValues: true })
                                        //setValue('salts', [{}])
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
                          {/* </Grid> */}
                          {/* </Grid> */}
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <Controller
                                name='medicine_name'
                                control={control}
                                rules={{ required: true }}
                                render={({ field: { value, onChange } }) => (
                                  <TextField
                                    value={value}
                                    label='Product Name*'
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

                          {medicineType !== 'non_medical' && (
                            <>
                              <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                  <Controller
                                    name='generic_name_id'
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field: { value, onChange } }) => (
                                      <Autocomplete
                                        disablePortal
                                        id='generic_name_id'
                                        value={defaultGenericName}
                                        options={genericNameList}
                                        getOptionLabel={option => option.name}
                                        isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                        onChange={(e, val) => {
                                          // setDefaultManufacturer(val)
                                          if (val === null) {
                                            setDefaultGenericName(val)

                                            return onChange('')
                                          } else {
                                            setDefaultGenericName(val)

                                            return onChange(val.id)
                                          }
                                        }}
                                        onKeyUp={e => {
                                          genericSearch(e.target.value)

                                          // getManufacturersList({ key: e.target.value })
                                        }}
                                        renderInput={params => (
                                          <TextField
                                            {...params}
                                            label='Generic Name*'
                                            placeholder='Search & Select'
                                            error={Boolean(errors.generic_name_id)}
                                          />
                                        )}
                                      />
                                    )}
                                  />
                                  {errors?.generic_name_id && (
                                    <FormHelperText sx={{ color: 'error.main' }}>
                                      {errors?.generic_name_id?.message}
                                    </FormHelperText>
                                  )}
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={6} justifyContent='flex-end' alignSelf='center'>
                                <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
                                  <AddButton
                                    title='Add Generic Name'
                                    action={() => {
                                      addNewGenericNameSidebarOpen()
                                    }}
                                  />
                                </Box>
                              </Grid>
                            </>
                          )}

                          <Grid item xs={12} sm={12}>
                            <Grid container spacing={5}>
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
                                        isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                        onChange={(e, val) => {
                                          // setDefaultManufacturer(val)

                                          if (val === null) {
                                            setDefaultManufacturer(val)

                                            return onChange('')
                                          } else {
                                            setDefaultManufacturer(val)

                                            return onChange(val.id)
                                          }
                                        }}
                                        onKeyUp={e => {
                                          manufacturerSearch(e.target.value)

                                          // getManufacturersList({ key: e.target.value })
                                        }}
                                        renderInput={params => (
                                          <TextField
                                            {...params}
                                            label='Manufacturer*'
                                            placeholder='Search & Select'
                                            error={Boolean(errors.manufacturer)}
                                          />
                                        )}
                                      />
                                    )}
                                  />
                                  {errors?.manufacturer && (
                                    <FormHelperText sx={{ color: 'error.main' }}>
                                      {errors?.manufacturer?.message}
                                    </FormHelperText>
                                  )}
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={6} justifyContent='flex-end' alignSelf='center'>
                                <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
                                  <AddButton
                                    title='Add Manufacturer'
                                    action={() => {
                                      addNewManufacturer()
                                    }}
                                  />
                                  {/* <IconButton
                                aria-label='capture screenshot'
                                color='primary'
                                onClick={() => addNewManufacturer()}
                              >
                                <Icon icon='mdi:plus' />
                              </IconButton> */}
                                </Box>
                                {/* <Button variant='outlined' onClick={() => addNewManufacturer()}>
                              +
                            </Button> */}
                              </Grid>
                            </Grid>
                          </Grid>

                          {/* Packages */}

                          <Grid item xs={12} sm={12}>
                            <div>Package {getPackageString()}</div>
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
                                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                    onChange={(e, val) => {
                                      if (val === null) {
                                        setDefaultPackage(null)

                                        return onChange('')
                                      } else {
                                        setDefaultPackage(val)

                                        return onChange(val.id)
                                      }
                                    }}
                                    onKeyUp={e => {
                                      packageSearch(e.target.value)
                                    }}
                                    renderInput={params => (
                                      <TextField
                                        {...params}
                                        label='Package*'
                                        placeholder='Search & Select'
                                        error={Boolean(errors.package_type)}
                                      />
                                    )}
                                  />
                                )}
                              />
                              {errors?.package_type && (
                                <FormHelperText sx={{ color: 'error.main' }}>
                                  {errors?.package_type?.message}
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
                                    label='Presentation*'
                                    onChange={onChange}
                                    onKeyUp={e => setPackageQuantity(e.target.value)}
                                    placeholder='Presentation*'
                                    error={Boolean(errors.package_qty)}
                                    name='package_qty'
                                  />
                                )}
                              />
                              {errors?.package_qty && (
                                <FormHelperText sx={{ color: 'error.main' }}>
                                  {errors?.package_qty?.message}
                                </FormHelperText>
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
                                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                    onChange={(e, val) => {
                                      if (val === null) {
                                        setDefaultUom(null)

                                        return onChange('')
                                      } else {
                                        setDefaultUom(val)

                                        return onChange(val.id)
                                      }
                                    }}
                                    onKeyUp={e => {
                                      //getUnitsList(e.target.value)
                                      unitListSearch(e.target.value)
                                    }}
                                    renderInput={params => (
                                      <TextField
                                        {...params}
                                        label='UOM'
                                        placeholder='Search'
                                        error={Boolean(errors.package_uom)}
                                      />
                                    )}
                                  />
                                )}
                              />
                              {errors?.package_uom && (
                                <FormHelperText sx={{ color: 'error.main' }}>
                                  {errors?.package_uom?.message}
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
                                    getOptionLabel={option => option?.label}
                                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                    onChange={(e, val) => {
                                      if (val === null) {
                                        setDefaultProductForm(null)

                                        return onChange('')
                                      } else {
                                        setDefaultProductForm(val)

                                        return onChange(val.id)
                                      }
                                    }}
                                    onKeyUp={e => {
                                      productFormSearch(e.target.value)
                                    }}
                                    renderInput={params => (
                                      <TextField
                                        {...params}
                                        label='Product Form*'
                                        placeholder='Search & Select'
                                        error={Boolean(errors.product_form)}
                                      />
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
                                    <span>
                                      <IconButton
                                        aria-label='capture screenshot'
                                        color='primary'
                                        onClick={() => addNewSalt()}
                                      >
                                        <Icon icon='mdi:plus' />
                                      </IconButton>
                                    </span>
                                  </Grid>
                                </Grid>
                                {fields.map((field, index) => (
                                  <Grid container spacing={5} key={field.id} style={{ marginTop: '0px' }}>
                                    <Grid item xs={4}>
                                      <FormControl fullWidth>
                                        <Controller
                                          name={`salts[${index}].salt_id`}
                                          control={control}
                                          rules={{ required: true }}
                                          render={({ field: { value, onChange } }) => {
                                            return (
                                              <Autocomplete
                                                value={
                                                  defaultSalts != null && defaultSalts.length > 0
                                                    ? defaultSalts[index]
                                                    : null
                                                }
                                                disablePortal
                                                id={`salts[${index}].salt_id`}
                                                options={saltsList.filter(option => {
                                                  // Assuming defaultSalts is an array of objects with a 'salt_id' property
                                                  const selectedSaltIds = defaultSalts.map(salt => salt?.salt_id)

                                                  return !selectedSaltIds.includes(option.salt_id)
                                                })}
                                                getOptionLabel={option => option?.label}
                                                isOptionEqualToValue={(option, value) =>
                                                  parseInt(option?.salt_id) === parseInt(value?.salt_id)
                                                }
                                                onChange={(e, val) => {
                                                  if (val === null) {
                                                    //setDefaultProductForm(undefined)
                                                    var saltComposition = defaultSalts
                                                    saltComposition[index] = null
                                                    setDefaultSalts(saltComposition)

                                                    return onChange('')
                                                  } else {
                                                    var saltComposition = defaultSalts
                                                    saltComposition[index] = { salt_id: val.salt_id, label: val.label }
                                                    setDefaultSalts(saltComposition)

                                                    return onChange(val.salt_id)
                                                  }
                                                }}
                                                onKeyUp={e => {
                                                  // getSaltsList({ key: e.target.value })
                                                  saltsListSearch(e.target.value)
                                                }}
                                                renderInput={params => {
                                                  return (
                                                    <TextField
                                                      {...params}
                                                      label='Salt Name'
                                                      placeholder='Search & Select'
                                                      error={Boolean(errors?.salts?.[index]?.salt_id)}
                                                    />
                                                  )
                                                }}
                                              />
                                            )
                                          }}
                                        />
                                        {errors?.salts?.[index]?.salt_id && (
                                          <FormHelperText sx={{ color: 'error.main' }}>
                                            {errors?.salts?.[index]?.salt_id?.message}
                                          </FormHelperText>
                                        )}
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
                                        {errors?.salts?.[index]?.salt_qty && (
                                          <FormHelperText sx={{ color: 'error.main' }}>
                                            {errors?.salts?.[index]?.salt_qty?.message}
                                          </FormHelperText>
                                        )}
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
                            </Grid>
                          )}

                          {/* //Salt Composition */}
                          {/* Others */}
                          <Grid item xs={12} sm={12}>
                            <div>Others</div>
                          </Grid>
                          {/* <Grid item xs={12} sm={6}>
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
                                    {gstList?.map((item, index) => {
                                      return (
                                        <MenuItem key={index} disabled={item?.active === '0'} value={item?.id}>
                                          {item?.label}
                                        </MenuItem>
                                      )
                                    })}
                                  </Select>
                                )}
                              />
                              {errors?.gst_slab && (
                                <FormHelperText sx={{ color: 'error.main' }}>
                                  {errors?.gst_slab?.message}
                                </FormHelperText>
                              )}
                            </FormControl>
                          </Grid> */}
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
                                    getOptionLabel={option => option?.label}
                                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                    onChange={(e, val) => {
                                      if (val === null) {
                                        setDefaultDrugClass(null)

                                        return onChange('')
                                      } else {
                                        setDefaultDrugClass(val)

                                        return onChange(val.id)
                                      }
                                    }}
                                    onKeyUp={e => {
                                      //getDrugsClassList({ key: e.target.value })
                                      drugClassListSearch(e.target.value)
                                    }}
                                    renderInput={params => (
                                      <TextField
                                        {...params}
                                        label='Drug Class'
                                        placeholder='Search & Select'
                                        error={Boolean(errors.drug_class)}
                                      />
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
                                        setDefaultStorage(null)

                                        return onChange('')
                                      } else {
                                        setDefaultStorage(val)

                                        return onChange(val.id)
                                      }
                                    }}
                                    onKeyUp={e => {
                                      //getStorageList({ key: e.target.value })
                                      storageListSearch(e.target.value)
                                    }}
                                    renderInput={params => (
                                      <TextField
                                        {...params}
                                        label='Storage'
                                        placeholder='Search & Select'
                                        error={Boolean(errors.storage)}
                                      />
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

                          {/* <Grid item xs={12} sm={6}>
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
                                    label='Part Out of Stock'
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
                          </Grid> */}

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
                            <FormControl fullWidth>
                              <Controller
                                name='url'
                                control={control}
                                rules={{ required: true }}
                                render={({ field: { value, onChange } }) => (
                                  <TextField
                                    value={value}
                                    label='Reference URL'
                                    name='safety_advice'
                                    onChange={onChange}
                                    placeholder='URL'
                                  />
                                )}
                              />
                              {errors.url && (
                                <FormHelperText sx={{ color: 'error.main' }}>{errors?.url?.message}</FormHelperText>
                              )}
                            </FormControl>
                          </Grid>

                          {/* <Grid item xs={12} sm={6}>
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
                          </Grid> */}

                          <Grid item xs={12}>
                            <Card>
                              <CardHeader title='Upload Product Picture' />
                              <CardContent>
                                <FileUploaderSingle onImageUpload={onImageUpload} image={uploadedImage} files={files} />
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ float: 'right' }}>
                              <LoadingButton
                                size='large'
                                variant='contained'
                                loading={submitLoader}
                                sx={{ marginRight: '8px' }}
                                onClick={handleSubmitData}
                              >
                                Submit
                              </LoadingButton>

                              {id === undefined && action !== 'edit' && (
                                <Button
                                  onClick={() => {
                                    reset(defaultValues)
                                    setDefaultManufacturer(null)
                                    setDefaultGenericName(null)
                                    setDefaultPackage(null)
                                    setDefaultUom(null)
                                    setDefaultProductForm(null)
                                    setDefaultSaltName(null)
                                    setDefaultDrugClass(null)
                                    setDefaultStorage(null)
                                    setDefaultSalts([])
                                    setShouldClearFields(false)
                                    setFiles([])
                                    setUploadedImage(null)
                                  }}
                                  size='large'
                                  variant='outlined'
                                >
                                  Reset
                                </Button>
                              )}
                            </Box>

                            {/* {id === undefined && (
                          <LoadingButton
                            size='large'
                            variant='contained'
                            loading={submitLoader}
                            onClick={handleSubmitAddAnother}
                          >
                            Submit & Add Another
                          </LoadingButton>
                        )} */}

                            <UserSnackbar
                              status={openSnackbar}
                              message={snackbarMessage}
                              severity={severity}
                              handleClose={handleClose}
                            />
                          </Grid>
                        </Grid>
                      </form>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <AddManufacturer
                drawerWidth={400}
                addEventSidebarOpen={openManufacturer}
                handleSidebarClose={handleSidebarClose}
                handleSubmitData={handleManufacturer}
                resetForm={resetForm}
                submitLoader={popupLoader}
                editParams={editParams}
              />
              <AddSalts
                drawerWidth={400}
                addEventSidebarOpen={openSalt}
                handleSidebarClose={handleSidebarClose}
                handleSubmitData={handleSalt}
                resetForm={resetForm}
                submitLoader={popupLoader}
                editParams={editParams}
              />
              <AddGenericName
                drawerWidth={400}
                addEventSidebarOpen={genericsDrawerMenu}
                handleSidebarClose={handleSidebarClose}
                handleSubmitData={addGenericsHandleSubmitData}
                resetForm={resetForm}
                submitLoader={genericsMenuLoader}
                editParams={editParams}
              />
            </>
          )}
        </>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default AddMedicine
