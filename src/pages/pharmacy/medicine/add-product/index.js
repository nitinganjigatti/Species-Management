/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useRef, useContext } from 'react'

// ** MUI Imports

import { Grid, Button, Card, CardHeader, CardContent, FormGroup, Box } from '@mui/material'
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
import { getGenericsForMaster, addGenericName } from 'src/lib/api/pharmacy/genericNames'
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
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'
import ControlledCheckBox from 'src/views/forms/form-fields/ControlledCheckBox'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import { productCategoryOptions } from 'src/constants/PharmacyConstants'
const defaultValues = {
  medicine_type: 'allopathy',
  medicine_name: '',
  manufacturer: null,
  generic_name_id: '',
  package_type: null,
  package_qty: '',
  package_uom: null,
  product_form: null,
  salts: [
    {
      salt_qty: '',
      salt_id: null
    }
  ],
  gst_slab: '',
  drug_class: null,
  storage: null,
  prescription_required: '0',
  controlled_substance: '0',
  part_out_of_stock: '0',
  side_effects: '',
  uses: '',
  safety_advice: '',
  image: '',
  active: '1',
  url: '',
  priority: '',
  category: []
}

const schema = yup.object().shape({
  medicine_type: yup.string().required('Product Type is required'),
  medicine_name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Product name is required'),
  manufacturer: yup
    .mixed()
    .required('Manufacturer name is required')
    .test('has-value', 'Manufacturer name is required', value => !!value?.value),

  generic_name_id: yup.mixed().when('medicine_type', {
    is: val => val !== 'non_medical',
    then: schema =>
      schema
        .required('Generic name is required')
        .test('has-value', 'Generic name is required', value => !!value?.value),
    otherwise: schema => schema.optional().nullable()
  }),
  package_type: yup
    .mixed()
    .required('Package is required')
    .test('has-value', 'Package is required', value => !!value?.value),
  package_qty: yup.number().typeError('This should be a number').required('Package Quantity is required'),
  package_uom: yup.mixed().nullable(),
  product_form: yup
    .mixed()
    .required('Product Form is required')
    .test('has-value', 'Product Form is required', value => !!value?.value),
  salts: yup.array().of(
    yup.object().shape({
      salt_name: yup.string().nullable(),
      salt_qty: yup.string().nullable(),
      salt_id: yup.mixed().nullable()
    })
  ),
  drug_class: yup.mixed().nullable(),
  storage: yup.mixed().nullable(),

  // prescription_required: yup.string().required('Prescription is required'),
  controlled_substance: yup.string().required('Controlled substance is required'),

  // prescription_required: yup.boolean().when('controlled_substance', {
  //   is: value => Boolean(value),
  //   then: yup.boolean().oneOf([true], 'Prescription is required if controlled substance is provided')
  // }),
  // prescription_required: yup.boolean().when('controlled_substance', (controlled_substance, schema) => {
  //   return controlled_substance[0] == '1'
  //     ? schema.oneOf([true], 'Prescription is required if product is controlled substance')
  //     : schema
  // }),
  prescription_required: yup
    .string()
    .transform(value =>
      value === true || value === '1' || value === 1 ? '1' : value === false || value === '0' || value === 0 ? '0' : ''
    )
    .when('controlled_substance', {
      is: value => value === '1',
      then: schema => schema.oneOf(['1'], 'Prescription is required').required('Prescription is required'),
      otherwise: schema => schema.optional().nullable()
    }),
  part_out_of_stock: yup.string().required('part of out of stock is required'),

  side_effects: yup.string().nullable(),
  uses: yup.string().nullable(),
  safety_advice: yup.string().nullable(),
  active: yup.string().nullable(),
  url: yup.string().url('Please enter a valid URL').nullable(),
  category: yup.array().nullable()
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
    clearErrors,
    getValues
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const { selectedPharmacy } = usePharmacyContext()
  const authData = useContext(AuthContext)

  const pharmacyRole = authData?.userData?.roles?.settings?.add_pharmacy

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

  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [severity, setSeverity] = useState('success')

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
      await getGenericsForMaster({ params: params }).then(res => {
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
        const saltsFormValues = []
        const tempSalts = []
        if (response?.data?.salts != null && response?.data?.salts?.length > 0) {
          response?.data?.salts?.map((value, index) => {
            saltsFormValues.push({
              salt_qty: value.qty,
              salt_id: { label: value.label, value: value.id }
            })
            tempSalts.push({
              salt_id: value.id,
              label: value.label
            })
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

        reset({
          ...response.data,
          medicine_type: response.data.stock_type,
          medicine_name: response.data.name,
          prescription_required: response?.data?.prescription_required,
          manufacturer: response?.data?.manufacturer
            ? { label: response?.data?.manufacturer_name, value: response?.data?.manufacturer }
            : null,
          generic_name_id: response?.data?.generic_id
            ? { label: response?.data?.generic_name, value: response?.data?.generic_id }
            : null,
          package_type: response?.data?.package_type
            ? { label: response?.data?.package, value: response?.data?.package_type }
            : null,
          package_uom: response?.data?.package_uom
            ? { label: response?.data?.package_uom_label, value: response?.data?.package_uom }
            : null,
          product_form: response?.data?.product_form
            ? { label: response?.data?.product_form_label, value: response?.data?.product_form }
            : null,
          drug_class: response?.data?.drug_class
            ? { label: response?.data?.drug_class_label, value: response?.data?.drug_class }
            : null,
          storage: response?.data?.storage
            ? { label: response?.data?.storage_value, value: response?.data?.storage }
            : null,
          salts:
            saltsFormValues !== null && saltsFormValues.length > 0
              ? saltsFormValues
              : [
                  {
                    salt_qty: '',
                    salt_id: null
                  }
                ],
          status: response?.data?.active,
          priority: response?.data?.priority,
          url: response?.data?.url || '',
          side_effects: response?.data?.side_effects || '',
          uses: response?.data?.uses || '',
          safety_advice: response?.data?.safety_advice || '',
          category: response?.data?.category
            ? response.data.category.split(',').map(c => ({ label: c.trim(), value: c.trim() }))
            : []
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
      url,
      priority,
      category
    } = {
      ...params
    }

    const duplicatedSalts = [...salts]

    let filtered_salts = duplicatedSalts
      .map(item => ({
        salt_id: item?.salt_id?.value || '',
        salt_qty: item?.salt_qty || '',
        label: item?.salt_id?.label || ''
      }))
      .filter(item => item.salt_id && String(item.salt_id).trim() !== '')

    const payload = {
      medicine_type,
      medicine_name,
      manufacturer: manufacturer?.value || '',
      generic_name_id: medicine_type !== 'non_medical' ? generic_name_id?.value || '' : '',
      package_type: package_type?.value || '',
      package_qty,
      package_uom: package_uom?.value || '',
      product_form: product_form?.value || '',
      salts: filtered_salts.length > 0 && medicine_type !== 'non_medical' ? filtered_salts : [],
      gst_slab,
      drug_class: drug_class?.value || '',
      storage: storage?.value || '',
      prescription_required,
      controlled_substance,
      part_out_of_stock,
      side_effects,
      uses,
      safety_advice,
      status: active,
      url,
      priority,
      category: category?.length > 0 ? category.map(item => item?.value || item).join(',') : ''
    }
    if (files.length > 0) {
      payload.image = files[0]
    } else {
      payload.image = uploadedImage ?? ''
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
        toast.success(response?.message)

        setSubmitLoader(true)
        reset(defaultValues)
        Router.replace(`/pharmacy/medicine/${id}`)
      } else {
        setSubmitLoader(false)

        toast.error(response?.message)
      }
    } catch (e) {
      setSubmitLoader(false)
      toast.error('error')
    }
  }

  const addMedicineToList = async payload => {
    try {
      const response = await addMedicine(payload)

      if (response?.success) {
        toast.success(response?.message)

        setSubmitLoader(true)
        reset(defaultValues)
        if (shouldClearFieldsRef.current) {
          shouldClearFieldsRef.current = false
        } else {
          Router.replace(`/pharmacy/medicine/${response?.data?.stock_item_id}`)
        }
        setSubmitLoader(false)
      } else {
        setSubmitLoader(false)

        shouldClearFieldsRef.current = false

        toast.error(response?.message)
      }
    } catch (e) {
      setSubmitLoader(false)

      toast.error('error')

      shouldClearFieldsRef.current = false
    }
  }

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'salts'
  })

  const addSaltButton = () => {
    return (
      <Button
        variant='outlined'
        onClick={() => {
          setSalts([])
          append({
            salt_qty: '',
            salt_id: null
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
            remove(index)
          }}
          icon='material-symbols-light:close'
        />
      </Box>
    )
  }

  const clearSaltFields = index => {
    return (
      <Box>
        <Icon
          onClick={() => {
            remove(index)
            insert(index, { salt_qty: '', salt_id: null })
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
    const pkg = getValues('package_type')
    const uom = getValues('package_uom')
    const pf = getValues('product_form')
    if (pkg?.label) {
      return `(${pkg.label} of ${getValues('package_qty')} ${uom?.label || ''} ${pf?.label || ''})`
    }

    return ''
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

  const handleRemoveImage = () => {
    setUploadedImage(null)
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

  const watchedSalts = watch('salts')

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
                <Grid item size={{ xs: 12 }}>
                  <PageCardLayout
                    title={id ? 'Edit Product' : 'Add New Product'}
                    showIcon={true}
                    onIconClick={() => {
                      Router.back()
                    }}
                    titleStyles={{
                      fontSize: '20px'
                    }}
                  >
                    <form onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
                      <Grid container spacing={5}>
                        {id && (
                          <Grid item size={{ xs: 12, sm: 12 }}>
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
                        )}

                        <Grid item size={{ xs: 12, sm: 6 }}>
                          <ControlledSelect
                            name='medicine_type'
                            label='Product Type*'
                            control={control}
                            errors={errors}
                            options={[
                              { label: 'Allopathy', value: 'allopathy' },
                              { label: 'Ayurveda', value: 'ayurveda' },
                              { label: 'Unani', value: 'unani' },
                              { label: 'Homeopathy', value: 'homeopathy' },
                              { label: 'Non Medical', value: 'non_medical' }
                            ]}
                            getOptionLabel={option => option.label}
                            getOptionValue={option => option.value}
                            onChangeExtra={e => {
                              setMedicineType(e.target.value)
                            }}
                          />
                        </Grid>

                        <Grid item size={{ xs: 12, sm: 6 }}>
                          <ControlledTextField
                            name='medicine_name'
                            label='Product Name*'
                            control={control}
                            errors={errors}
                          />
                        </Grid>
                        {medicineType !== 'non_medical' && (
                          <Grid item size={{ xs: 12, sm: 6 }}>
                            <ControlledAutocomplete
                              name='generic_name_id'
                              label='Generic Name*'
                              control={control}
                              errors={errors}
                              options={genericNameList?.map(item => ({ label: item.name, value: item.id })) || []}
                              onInputChange={value => genericSearch(value)}
                              onItemClear={() => genericSearch('')}
                              getOptionLabel={option => option?.label || ''}
                              getOptionValue={option => option?.value || ''}
                              isOptionEqualToValue={(option, value) => option?.value === value?.value}
                            />
                          </Grid>
                        )}
                        {pharmacyRole && medicineType !== 'non_medical' && (
                          <Grid
                            item
                            size={{ xs: 12, sm: 6 }}
                            sx={{
                              justifyContent: 'flex-end',
                              alignSelf: 'center'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
                              <AddButton
                                title='Add Generic Name'
                                action={() => {
                                  addNewGenericNameSidebarOpen()
                                }}
                              />
                            </Box>
                          </Grid>
                        )}

                        <Grid item size={{ xs: 12, sm: 6 }}>
                          <ControlledAutocomplete
                            name='manufacturer'
                            label='Manufacturer*'
                            control={control}
                            errors={errors}
                            options={manufacturer?.map(item => ({ label: item.label, value: item.id })) || []}
                            onInputChange={value => manufacturerSearch(value)}
                            onItemClear={() => manufacturerSearch('')}
                            getOptionLabel={option => option?.label || ''}
                            getOptionValue={option => option?.value || ''}
                            isOptionEqualToValue={(option, value) => option?.value === value?.value}
                          />
                        </Grid>
                        {pharmacyRole && (
                          <Grid
                            item
                            size={{ xs: 12, sm: 6 }}
                            sx={{
                              justifyContent: 'flex-end',
                              alignSelf: 'center'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
                              <AddButton
                                title='Add Manufacturer'
                                action={() => {
                                  addNewManufacturer()
                                }}
                              />
                            </Box>
                          </Grid>
                        )}

                        <Grid item size={{ xs: 12, sm: 12 }}>
                          <div>Package {getPackageString()}</div>
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 3 }}>
                          <ControlledAutocomplete
                            name='package_type'
                            label='Package*'
                            control={control}
                            errors={errors}
                            options={packages?.map(item => ({ label: item.label, value: item.id })) || []}
                            onInputChange={value => packageSearch(value)}
                            onItemClear={() => packageSearch('')}
                            getOptionLabel={option => option?.label || ''}
                            getOptionValue={option => option?.value || ''}
                            isOptionEqualToValue={(option, value) => option?.value === value?.value}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 3 }}>
                          <ControlledTextField
                            name='package_qty'
                            label='Presentation*'
                            control={control}
                            errors={errors}
                            placeholder='Presentation*'
                            onChangeOverride={e => setPackageQuantity(e.target.value)}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 3 }}>
                          <ControlledAutocomplete
                            name='package_uom'
                            label='UOM'
                            control={control}
                            errors={errors}
                            options={uomList?.map(item => ({ label: item.unit_name, value: item.id })) || []}
                            onInputChange={value => unitListSearch(value)}
                            onItemClear={() => unitListSearch('')}
                            getOptionLabel={option => option?.label || ''}
                            getOptionValue={option => option?.value || ''}
                            isOptionEqualToValue={(option, value) => option?.value === value?.value}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 3 }}>
                          <ControlledAutocomplete
                            name='product_form'
                            label='Product Form*'
                            control={control}
                            errors={errors}
                            options={productForm?.map(item => ({ label: item?.label, value: item.id })) || []}
                            onInputChange={value => productFormSearch(value)}
                            onItemClear={() => productFormSearch('')}
                            getOptionLabel={option => option?.label || ''}
                            getOptionValue={option => option?.value || ''}
                            isOptionEqualToValue={(option, value) => option?.value === value?.value}
                          />
                        </Grid>

                        {medicineType !== 'non_medical' && (
                          <Grid item size={{ xs: 12, sm: 12 }}>
                            <FormGroup>
                              <Grid
                                container
                                item
                                xs={12}
                                sm={12}
                                spacing={2}
                                sx={{
                                  alignItems: 'center'
                                }}
                              >
                                <Grid item size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                                  Salt Composition
                                  {pharmacyRole && (
                                    <IconButton
                                      aria-label='capture screenshot'
                                      color='primary'
                                      onClick={() => addNewSalt()}
                                    >
                                      <Icon icon='mdi:plus' />
                                    </IconButton>
                                  )}
                                </Grid>
                              </Grid>
                              {fields.map((field, index) => (
                                <Grid container spacing={5} key={field.id} sx={{ my: 2 }}>
                                  <Grid item size={{ xs: 10, sm: 4 }}>
                                    <ControlledAutocomplete
                                      name={`salts[${index}].salt_id`}
                                      label='Salt Name'
                                      control={control}
                                      errors={errors}
                                      options={
                                        saltsList
                                          ?.map(s => ({ label: s.label, value: s.salt_id }))
                                          .filter(o => {
                                            const selectedIds =
                                              watchedSalts
                                                ?.map((s, i) => (i !== index ? s?.salt_id?.value : null))
                                                .filter(Boolean) || []

                                            return !selectedIds.includes(o.value)
                                          }) || []
                                      }
                                      onInputChange={value => saltsListSearch(value)}
                                      onItemClear={() => saltsListSearch('')}
                                      getOptionLabel={option => option?.label || ''}
                                      getOptionValue={option => option?.value || ''}
                                      isOptionEqualToValue={(option, value) => option?.value === value?.value}
                                    />
                                  </Grid>
                                  <Grid item size={{ xs: 10, sm: 4 }}>
                                    <ControlledTextField
                                      name={`salts[${index}].salt_qty`}
                                      label='Strength'
                                      control={control}
                                      errors={errors}
                                      placeholder='Strength'
                                    />
                                  </Grid>

                                  <Grid
                                    item
                                    xs={4}
                                    sx={{
                                      alignSelf: 'center',
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

                        <Grid item size={{ xs: 12, sm: 12 }}>
                          <div>Others</div>
                        </Grid>

                        <Grid item size={{ xs: 12, sm: 6 }}>
                          <ControlledAutocomplete
                            name='drug_class'
                            label='Drug Class'
                            control={control}
                            errors={errors}
                            options={drugsClassList?.map(item => ({ label: item?.label, value: item.id })) || []}
                            onInputChange={value => drugClassListSearch(value)}
                            onItemClear={() => drugClassListSearch('')}
                            getOptionLabel={option => option?.label || ''}
                            getOptionValue={option => option?.value || ''}
                            isOptionEqualToValue={(option, value) => option?.value === value?.value}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 6 }}>
                          <ControlledAutocomplete
                            name='storage'
                            label='Storage'
                            control={control}
                            errors={errors}
                            options={storageList?.map(item => ({ label: item.label, value: item.id })) || []}
                            onInputChange={value => storageListSearch(value)}
                            onItemClear={() => storageListSearch('')}
                            getOptionLabel={option => option?.label || ''}
                            getOptionValue={option => option?.value || ''}
                            isOptionEqualToValue={(option, value) => option?.value === value?.value}
                          />
                        </Grid>

                        <Grid item size={{ xs: 12, sm: 3 }}>
                          <ControlledSelect
                            name='controlled_substance'
                            label='Controlled Substances'
                            control={control}
                            errors={errors}
                            options={[
                              { label: 'Yes', value: '1' },
                              { label: 'No', value: '0' }
                            ]}
                            getOptionLabel={option => option.label}
                            getOptionValue={option => option.value}
                            onChangeExtra={e => {
                              const selectedValue = e.target.value
                              if (selectedValue === '1') {
                                setValue('prescription_required', '1')
                              } else {
                                setValue('prescription_required', '0')
                              }
                              clearErrors('prescription_required')
                            }}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 3 }}>
                          <ControlledSelect
                            name='prescription_required'
                            label='Prescription Required'
                            control={control}
                            errors={errors}
                            options={[
                              { label: 'Yes', value: '1' },
                              { label: 'No', value: '0' }
                            ]}
                            getOptionLabel={option => option.label}
                            getOptionValue={option => option.value}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 6 }}>
                          <ControlledAutocomplete
                            name='category'
                            label='Category'
                            control={control}
                            errors={errors}
                            multiple={true}
                            options={productCategoryOptions}
                            getOptionLabel={option => option?.label || ''}
                            getOptionValue={option => option?.value || ''}
                            isOptionEqualToValue={(option, value) => option?.value === value?.value}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 6 }}>
                          <ControlledTextArea
                            name='side_effects'
                            label='Common Side Effects'
                            control={control}
                            errors={errors}
                            rows={4}
                          />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 6 }}>
                          <ControlledTextArea name='uses' label='Uses' control={control} errors={errors} rows={4} />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 6 }}>
                          <ControlledTextArea
                            name='safety_advice'
                            label='Safety Advice'
                            control={control}
                            errors={errors}
                            rows={4}
                          />
                        </Grid>

                        <Grid item size={{ xs: 12, sm: 6 }}>
                          <ControlledTextField
                            name='url'
                            label='Reference URL'
                            control={control}
                            errors={errors}
                            placeholder='URL'
                          />
                          <ControlledCheckBox
                            name='priority'
                            label='Critical'
                            control={control}
                            errors={errors}
                            sx={{ my: 4 }}
                            labelStyle={{ fontWeight: 400 }}
                            onChangeOverride={checked => {
                              if (checked) {
                                setValue('priority', 'critical')
                              } else {
                                setValue('priority', '')
                              }
                            }}
                          />
                        </Grid>

                        <Grid item size={{ xs: 12 }}>
                          <Card>
                            <CardHeader title='Add Product Image' />
                            <CardContent>
                              <FileUploaderSingle
                                onImageUpload={onImageUpload}
                                image={uploadedImage}
                                files={files}
                                onRemoveImage={handleRemoveImage}
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item size={{ xs: 12 }}>
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

                          <UserSnackbar
                            status={openSnackbar}
                            message={snackbarMessage}
                            severity={severity}
                            handleClose={handleClose}
                          />
                        </Grid>
                      </Grid>
                    </form>
                  </PageCardLayout>
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
