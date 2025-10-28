import {
  Autocomplete,
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  debounce,
  Divider,
  Drawer,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import { Box, display } from '@mui/system'
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import Icon from 'src/@core/components/icon'
import CloseIcon from '@mui/icons-material/Close'
import { Controller, useForm, useFieldArray } from 'react-hook-form'
import { LoadingButton } from '@mui/lab'
import {
  DeleteBannerById,
  DeleteBreed,
  DeleteType,
  UpdateHybrid,
  UpdateSpecies,
  UploadBannerImages,
  addBreed,
  addHybrid,
  addLocality,
  addMutation,
  addSpecies,
  getBreed,
  getLocalityById,
  getLocalityList,
  getMutationById,
  getMutationList,
  getSearchTaxonomyList,
  getSpeciesVernacularData
} from 'src/lib/api/species'
import toast from 'react-hot-toast'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { ClearIcon } from '@mui/x-date-pickers'
import DialogConfirmation from 'src/components/utility/DialogConfirmation'
import { CheckBox } from '@mui/icons-material'

const AddSpeciesSlideBar = ({
  handleSidebarClose,
  openDrawer,
  setOpenDrawer,
  // fetchTaxonomy,
  // taxonomy,
  editVernacularNames,
  editName,
  fetchTableData,
  tsnId,
  status,
  setStatus,
  commonName,
  editCommonId,
  rows,
  speciesImage,
  BannerImages,
  setBannerImages
}) => {
  const [displayProfile, setDisplayProfile] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [searchLocality, setSeachLocality] = useState('')
  const [vernacularData, setVernacularData] = useState([])
  const [selectedImages, setSelectedImages] = useState([])
  const [defaultTaxonomy, setDefaultTaxonomy] = useState(null)
  const [selectedValues, setSelectedValues] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [selectedLocality, setSelectedLocality] = useState([])
  const [morphData, setMorphData] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [breedList, setBreedList] = useState([])
  const [morphList, setMorphList] = useState([])
  const [localityData, setLocalityData] = useState([])
  const [localityList, setLocalityList] = useState([])
  const [crossText, setCrossText] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMorphOpen, setDialogMorphOpen] = useState(false)
  const [dialogLocalityOpen, setDialogLocalityOpen] = useState(false)
  const [taxonomyName, setTaxonomyName] = useState('')
  const [filterId, setFilterId] = useState([])
  const [localityFilterId, setLocalityFilterId] = useState([])
  const [taxonomy, setTaxonomy] = useState([])

  const fileInputRef = React.useRef(null)
  const inputRef = useRef(null)

  const schema = yup.object().shape({
    // tsn_id: yup.string().required('Please choose Taxonomy')
  })

  const defaultValues = {
    tsn_id: '',
    taxonomyFields: [
      {
        taxonomy_id: '',
        scientific_name: '',
        common_name: ''
      }
    ],
    taxonomy_id: '',
    vernacular_id: '',
    species_image: '',
    scientificName: '',
    banner_images: [],
    vernacular_name: '',
    breed_name: '',
    morph: [],
    locality: []
  }

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const prefillDefault = { taxonomy_id: tsnId, scientific_name: editName, common_name: '' }
  const prefillHybrid = { taxonomy_id: tsnId, scientific_name: editName, common_name: '' }

  const addEventSidebarOpen = () => {
    setOpenDrawer(true)
  }

  console.log('Submitted Values >>', getValues())

  const fetchSpeciesVernacularData = async taxonomy => {
    try {
      const response = await getSpeciesVernacularData(taxonomy?.taxonomy_id)
      setVernacularData(response?.data)
    } catch (error) {
      console.error('Error fetching species data:', error)
      setVernacularData(null)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = e => {
    const files = e.target.files
    const imagesArray = []
    const filesArray = []

    let filesRead = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      const reader = new FileReader()
      reader.onload = event => {
        imagesArray.push(reader.result)
        filesArray.push(file)

        console.log('Files >', filesArray)

        filesRead++

        if (filesRead === files.length) {
          setSelectedImages(imagesArray)
          setValue('banner_images', filesArray)
        }
      }

      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [searchValue, searchLocality])

  const handleRemoveImage = async image => {
    try {
      if (image?.id) {
        const response = await DeleteBannerById(image)
        if (response?.success) {
          const updatedBannerImages = BannerImages.filter(img => img.id !== image.id)
          setBannerImages(updatedBannerImages)
        } else {
          console.log('Error in Deleting:', response?.error)
        }
      } else {
        const updatedImages = selectedImages.filter(img => img !== image)
        setValue('banner_images', updatedImages) // Assuming this updates your form state
        setSelectedImages(updatedImages)
      }
    } catch (error) {
      console.log('Error:', error)
    }
  }

  const handleAddRemove1Image = indexToRemove => {
    const updatedImages = selectedImages.filter((image, index) => index !== indexToRemove)
    setValue('banner_images', updatedImages)
    setSelectedImages(updatedImages)
  }

  const handleInputImageChange = file => {
    const reader = new FileReader()
    const { files } = file.target
    if (files && files.length !== 0) {
      if (files[0] !== '') {
        reader.onload = () => {
          setDisplayProfile(reader?.result)
        }

        reader.readAsDataURL(files[0])
      }

      setValue('species_image', files[0])
    }
  }

  useEffect(() => {
    if (status === 'hybrid' && editName) {
      const fetchData = async () => {
        const response = await getBreed(tsnId)
        if (response?.data.length > 0) {
          setBreedList(response?.data)
        }
      }
      fetchData()
    }
  }, [])

  useEffect(() => {
    if (status === 'hybrid' && editName) {
      const mutationFetchData = async () => {
        const response = await getMutationById(tsnId)
        if (response?.data.length > 0) {
          setSelectedItems(response?.data)
          setFilterId(response?.data)
        }
      }
      mutationFetchData()
    }
  }, [])

  useEffect(() => {
    if (status === 'hybrid' && editName) {
      const localityFetchData = async () => {
        const response = await getLocalityById(tsnId)
        if (response?.data.length > 0) {
          setSelectedLocality(response?.data)
          setLocalityFilterId(response?.data)
        }
      }
      localityFetchData()
    }
  }, [])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'taxonomyFields'
  })

  console.log('Fields >', fields)

  const handleAddField = () => {
    // setDefaultTaxonomy(null)
    // Append the new field with default values
    append({
      taxonomy_id: ''
    })
    setCrossText(true)
    setTaxonomy([])
  }

  const handleRemoveTextField = index => {
    console.log('Field Value >>', index)
    console.log('taxonomyName', taxonomyName)

    remove(index)

    const formValues = getValues()
    const fieldValues = fields
    console.log('Fields Final >>', fieldValues)

    let scientificNames = formValues['scientificName']
    let commonNames = formValues['vernacular_name']

    if (typeof scientificNames === 'string' && typeof commonNames === 'string') {
      const fieldToRemove = fieldValues[index]
      let scientificNameToRemove = fieldToRemove?.scientific_name
      let commonNameToRemove = fieldToRemove?.common_name

      if (!scientificNameToRemove || !commonNameToRemove) {
        const scientificParts = scientificNames.split(/\s+X\s+/)
        const commonParts = commonNames.split(/\s+X\s+/)

        if (scientificParts.length > 1) {
          scientificNameToRemove = scientificParts.pop()
          scientificNames = scientificParts.join(' X ')
        }

        if (commonParts.length > 1) {
          commonNameToRemove = commonParts.pop()
          commonNames = commonParts.join(' X ')
        }
      }

      if (scientificNameToRemove && commonNameToRemove) {
        const scientificregex = new RegExp(`\\s+X\\s+${scientificNameToRemove}\\b\\s*`, 'g')
        const commonregex = new RegExp(`\\s+X\\s+${commonNameToRemove}\\b\\s*`, 'g')

        scientificNames = scientificNames.replace(scientificregex, '').trim()
        commonNames = commonNames.replace(commonregex, '').trim()

        setValue('scientificName', scientificNames)
        setValue('vernacular_name', commonNames)
      }
    }
  }

  const handleCheckboxChange = (event, item) => {
    const itemName = item.sub_taxon_name

    if (event.target.checked) {
      if (!selectedItems.some(selectedItem => selectedItem.sub_taxon_name === itemName)) {
        setSelectedItems([...selectedItems, item])
      }
    } else {
      setSelectedItems(selectedItems.filter(selectedItem => selectedItem.sub_taxon_name !== itemName))
    }
  }

  const handleLocalityCheckboxChange = (event, item) => {
    const itemName = item.sub_taxon_name
    if (event.target.checked) {
      if (!selectedLocality.some(selected => selected.sub_taxon_name === itemName)) {
        setSelectedLocality([...selectedLocality, item])
      }
    } else {
      setSelectedLocality(selectedLocality.filter(selected => selected.sub_taxon_name !== itemName))
    }
  }

  const handleRemoveBreed = async (event, id) => {
    event.stopPropagation()
    const params = {
      selected_id: id,
      sub_taxon_type: 'breed',
      taxonomy_id: tsnId
    }
    const response = await DeleteType(params)
    if (response.success) {
      const updatedBreed = breedList.filter(item => item.sub_taxon_id !== id)
      setBreedList(updatedBreed)
    }
  }

  const handleRemoveItem = async (event, item) => {
    event.stopPropagation()
    const params = {
      selected_id: item.sub_taxon_id,
      sub_taxon_type: 'morph',
      taxonomy_id: tsnId
    }

    const response = await DeleteType(params)
    if (response.success) {
      const updatedBreed = selectedItems.filter(item1 => item1.sub_taxon_id !== item?.sub_taxon_id)
      setSelectedItems(updatedBreed)
    }
  }

  const handleLocalityRemoveItem = async (event, item) => {
    event.stopPropagation()
    const params = {
      selected_id: item?.sub_taxon_id,
      sub_taxon_type: 'locality',
      taxonomy_id: tsnId
    }
    const response = await DeleteType(params)
    if (response.success) {
      const updatedBreed = selectedLocality.filter(item1 => item1.sub_taxon_id !== item?.sub_taxon_id)
      setSelectedLocality(updatedBreed)
    }
    // setSelectedLocality(selectedLocality.filter(item => item.sub_taxon_name !== itemToRemove.sub_taxon_name))
  }

  const onSubmit = async val => {
    val.vernacular_id = val.vernacular_id !== undefined && val.vernacular_id !== '' ? val.vernacular_id : null

    val.vernacular_name = val.vernacular_name ? val.vernacular_name : ''

    const payload = {
      tsn_id: val.tsn_id,
      vernacular_id: val?.vernacular_id ? val?.vernacular_id : null,
      vernacular_name: val.vernacular_name ? val.vernacular_name : '',
      scientificName: val.scientificName,
      species_image: val.species_image ? val.species_image : '',
      banner_images: val.banner_images ? val.banner_images : [],
      zoo_id: 11
    }

    if (status === 'hybrid') {
      if (editName) {
        const payload = {
          taxonomy_id: tsnId,
          scientific_name: val?.scientificName,
          morph: selectedItems,
          common_name: commonName,
          species_image: displayProfile
            ? val?.species_image
            : {
                name: speciesImage.split('uploads/')[1],
                type: 'image/*',
                uri: speciesImage
              },
          zoo_id: 11
        }
        if (val.banner_images && val.banner_images.length > 0) {
          const Bannerparams = {
            tsn_id: tsnId,
            banner_images: val.banner_images
          }

          const bannerUploadResponse = await UploadBannerImages(Bannerparams)
          if (!bannerUploadResponse.success) {
            toast.error('Unable to upload banner images')
            return
          }
        }
        const response = await UpdateHybrid(payload, tsnId)
        if (response?.success) {
          toast.success('Hybrid Updated Successfully')
          setOpenDrawer(false)
          fetchTableData('', '', '', status)
        } else {
          toast.error('Taxonomy already updated')
          setOpenDrawer(false)
        }
      } else {
        const payload = {
          taxonomy_id: val.taxonomy_id,
          scientific_name: val.scientificName,
          common_name: val.vernacular_name,
          species_image: val.species_image,
          banner_images: val.banner_images ? val.banner_images : [],
          zoo_id: 11
        }

        const response = await addHybrid(payload)

        if (response?.success) {
          toast.success('Hybrid Added Successfully')
          setOpenDrawer(false)
          fetchTableData('', '', '', status)
        } else {
          toast.error('Taxonomy already added')
          setOpenDrawer(false)
        }
      }
    } else if (editName && tsnId) {
      const payload = {
        tsn_id: tsnId,
        vernacular_id:
          Array.isArray(val?.vernacular_id) && val?.vernacular_id.length === 1 && val?.vernacular_id[0] === null
            ? editCommonId
            : val?.vernacular_id,
        scientificName: editName,
        species_image: displayProfile
          ? val?.species_image
          : {
              name: speciesImage.split('uploads/')[1],
              type: 'image/*',
              uri: speciesImage
            },
        zoo_id: 11
      }

      if (val?.vernacular_name) {
        payload['vernacular_name'] = val?.vernacular_name
      }
      console.log('Payload >>', payload)

      if (val.banner_images && val.banner_images.length > 0) {
        const Bannerparams = {
          tsn_id: tsnId,
          banner_images: val.banner_images
        }

        const bannerUploadResponse = await UploadBannerImages(Bannerparams)
        if (!bannerUploadResponse.success) {
          toast.error('Unable to upload banner images')
          return
        }
      }

      const response = await UpdateSpecies(payload, tsnId)
      if (response.success) {
        toast.success('Species Updated Successfully ')
        setOpenDrawer(false)
        fetchTableData()
      } else {
        toast.error('Unable to Update the Species')
      }
    } else {
      const response = await addSpecies(payload)

      if (response?.success) {
        toast.success('Species Added Successfully')
        setOpenDrawer(false)
        fetchTableData()
      } else {
        toast.error('Taxonomy already added')
        setOpenDrawer(false)
      }
    }
  }

  console.log('Hybrid Edit Values >', editName)

  useEffect(() => {
    if (editName) {
      const nameParts = editName.split('X')
      nameParts.forEach((part, index) => {
        // Assuming prefillHybrid should match parts
        setValue(`taxonomyFields[${index}].scientific_name`, prefillHybrid.scientific_name)
        setValue(`taxonomyFields[${index}].common_name`, prefillHybrid.common_name)
      })
    }
  }, [editName, prefillHybrid])
  console.log('Breed List >>', breedList)

  console.log('Getv >>>>>', getValues())

  useEffect(() => {
    if (editName) {
      setValue('tsn_id', tsnId)
      setValue('scientificName', editName)
      setValue('species_image', speciesImage)
      const filteredVernacularNames = editVernacularNames.filter(item => item.id === editCommonId)
      const selectedId = filteredVernacularNames.length > 0 && filteredVernacularNames[0].id
      console.log('Filter >>', filteredVernacularNames, selectedId)
      setValue('vernacular_id', filteredVernacularNames[0]?.id)
    }
  }, [editName, editVernacularNames])

  console.log('Taxonomy Value >>', taxonomyName)

  const handleAddBreed = async () => {
    try {
      const formValues = getValues()
      console.log('Form Values >>', formValues)

      const params = {
        taxonomy_id: formValues.tsn_id,
        breed_name: formValues.breed_name
      }

      const response = await addBreed(params)
      if (response?.success) {
        setDialogOpen(false)

        const getResponse = await getBreed(formValues.tsn_id)
        console.log('Get Response >>', getResponse)

        if (getResponse?.data.length > 0) {
          setBreedList(getResponse?.data)
        } else {
          toast.error('Failed to fetch breed list')
        }
      } else {
        toast.error('Error adding breed')
        setOpenDrawer(false)
      }
    } catch (error) {
      console.error('Error in handleAddBreed:', error)
      toast.error('Some Error Found')
    }
    setValue('breed_name', '')
  }

  const handleMorphCard = async event => {
    event.stopPropagation()
    setSearchValue('')
    setDialogOpen(false)
    setDialogMorphOpen(true)
    const response = await getMutationList()
    if (response?.data?.length > 0) {
      setMorphList(response?.data)
      setMorphData(response?.data)
    } else {
      toast.error('Something went wrong ')
    }
  }

  const handlelocalityCard = async event => {
    event.stopPropagation()
    setDialogOpen(false)
    setSeachLocality('')
    setDialogMorphOpen(false)
    setDialogLocalityOpen(true)
    const response = await getLocalityList()
    if (response?.data?.length > 0) {
      setLocalityList(response?.data)
      setLocalityData(response?.data)
    } else {
      toast.error('Something went wrong ')
    }
  }

  const handleAdd = async () => {
    console.log('Seelcted Check List >>', selectedItems)

    const selectedIds = selectedItems.map(item => item.sub_taxon_id)
    const newFilterIds = filterId.map(item => item.sub_taxon_id)

    // Combine old and new items
    const combinedItems = [...selectedIds, ...newFilterIds]

    const itemCounts = combinedItems.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1
      return acc
    }, {})

    const uniqueItems = Object.keys(itemCounts).filter(item => itemCounts[item] === 1)
    console.log('Unique Non-Repeating Items >>> ', uniqueItems)

    setDialogMorphOpen(false)
    const formValues = getValues()

    const params = {
      taxonomy_id: formValues.tsn_id,
      sub_taxon_type: 'morph',
      selected_id: uniqueItems ? uniqueItems : selectedIds
      // new_items: filterName
    }

    const response = await addMutation(params)
    if (response.success) {
      toast.success('Mutation added Successfully')
    } else {
      toast.error('failed to add Mutation')
    }
  }

  const handlelocalityAdd = async () => {
    setDialogLocalityOpen(false)
    const formValues = getValues()

    // const filterId = selectedLocality?.map(item => item.sub_taxon_id)
    const selectedIds = selectedLocality.map(item => item.sub_taxon_id)
    const newFilterIds = localityFilterId.map(item => item.sub_taxon_id)

    // Combine old and new items
    const combinedItems = [...selectedIds, ...newFilterIds]

    const itemCounts = combinedItems.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1
      return acc
    }, {})

    const uniqueItems = Object.keys(itemCounts).filter(item => itemCounts[item] === 1)
    console.log('Unique Non-Repeating Items >>> ', uniqueItems)

    const params = {
      taxonomy_id: formValues.tsn_id,
      sub_taxon_type: 'locality',
      selected_id: uniqueItems ? uniqueItems : selectedIds
    }
    const response = await addLocality(params)
    if (response?.success) {
      setLocalityList(response?.data)
    } else {
      toast.error('failed to add Locality')
    }
  }
  console.log('e>>', searchValue, morphList)

  const handleSearchValue = e => {
    const newValue = e.target.value.toLowerCase()
    setSearchValue(newValue)
    if (newValue === '') {
      setMorphList(morphData)
    } else {
      const filteredArr = morphList.filter(item => item.sub_taxon_name.toLowerCase().includes(newValue))
      setMorphList(filteredArr)
    }
  }

  const handlelocalitySearchValue = e => {
    const newValue = e.target.value.toLowerCase()
    setSeachLocality(newValue)
    if (newValue === '') {
      setLocalityList(localityData)
    } else {
      const filteredArr = localityList.filter(item => item.sub_taxon_name.toLowerCase().includes(newValue))
      setLocalityList(filteredArr)
    }
  }

  const fetchTaxonomy = useCallback(
    debounce(async q => {
      try {
        const params = {
          q
        }
        const response = await getSearchTaxonomyList(params)
        if (response?.data?.length) {
          setTaxonomy(response.data)
        }
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  return (
    <>
      <Drawer
        anchor='right'
        open={openDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: ['100%', 420], transitionDuration: '1s' } }}
      >
        {status === 'species' ? (
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              backgroundColor: 'background.default',
              p: theme => theme.spacing(3, 3.255, 3, 5.255)
            }}
          >
            {editName ? <Typography> Edit Species </Typography> : <Typography> Add New Species </Typography>}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleSidebarClose}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',

              justifyContent: 'space-between',
              backgroundColor: 'background.default',
              p: theme => theme.spacing(3, 3.255, 3, 5.255)
            }}
          >
            {editName ? <Typography sx={{ ml: 1 }}> Edit Hybrid </Typography> : <Typography> Add Hybrid </Typography>}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleSidebarClose}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>
        )}

        {status === 'species' ? (
          <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
            <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              {/* <FormControl fullWidth>
                <Controller
                  name='tsn_id'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => {
                    <Autocomplete
                      id='tsn_id'
                      name='tsn_id'
                      value={editName ? prefillDefault : defaultTaxonomy}
                      options={editName ? [prefillDefault] : taxonomy}
                      getOptionLabel={option => `${option.common_name} (${option.scientific_name})`}
                      isOptionEqualToValue={(option, value) => {
                        return option ? option.taxonomy_id === value.taxonomy_id : tsnId
                      }}
                      onChange={(e, val) => {
                        console.log('Value ?', val)
                        setDefaultTaxonomy(val ? val : '')
                        if (val) {
                          fetchSpeciesVernacularData(val)
                        }
                        field.onChange(val ? val.taxonomy_id : tsnId)
                        setValue('scientificName', val ? val?.scientific_name : editName)
                      }}
                      onKeyUp={e => {
                        if (e.target.value.length >= 3) {
                          fetchTaxonomy(e.target.value)
                        }
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Choose Taxonomy*'
                          placeholder='Enter at least 3 characters'
                          disabled={editName && true}
                          error={Boolean(errors.tsn_id)}
                        />
                      )}
                    />
                  }}
                />
                {errors.tsn_id && <FormHelperText sx={{ color: 'error.main' }}>{errors.tsn_id.message}</FormHelperText>}
              </FormControl> */}

              <FormControl fullWidth sx={{ mb: 4, mt: 4 }}>
                <Controller
                  name='tsn_id'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Autocomplete
                      name='tsn_id'
                      value={editName ? prefillDefault : defaultTaxonomy}
                      disablePortal
                      placeholder='Choose Taxonomy'
                      id='tsn_id'
                      options={taxonomy?.length > 0 ? taxonomy : []}
                      getOptionLabel={option => `${option.common_name} (${option.scientific_name})`}
                      isOptionEqualToValue={(option, value) => {
                        return option ? option.taxonomy_id === value.taxonomy_id : tsnId
                      }}
                      onChange={(e, val) => {
                        console.log('Value ?', val)
                        setDefaultTaxonomy(val ? val : '')
                        if (val) {
                          fetchSpeciesVernacularData(val)
                        }
                        onChange(val ? val.taxonomy_id : tsnId)
                        setValue('scientificName', val ? val?.scientific_name : editName)
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          onChange={e => {
                            if (e.target.value.length >= 3) {
                              fetchTaxonomy(e?.target?.value)
                            }
                          }}
                          label='Choose Taxonomy *'
                          placeholder='Enter at least 3 characters'
                          disabled={editName && true}
                          error={Boolean(errors.tsn_id)}
                        />
                      )}
                    />
                  )}
                />
                {errors.tsn_id && <FormHelperText sx={{ color: 'error.main' }}>{errors.tsn_id.message}</FormHelperText>}
              </FormControl>

              <Box>
                <Avatar
                  sx={{
                    mt: 8,
                    width: '110px',
                    height: '110px',
                    position: 'relative',
                    left: '100px',
                    cursor: 'pointer'
                  }}
                  name='species_image'
                >
                  <input
                    id='fileInput' // Add an id to the input element
                    type='file'
                    accept='image/*'
                    onChange={e => handleInputImageChange(e)}
                    name='species_image'
                    style={{
                      opacity: 0,
                      position: 'absolute',
                      height: '200px',
                      width: '200px',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      zIndex: 1
                    }}
                  />
                  {(displayProfile || speciesImage) && (
                    <img
                      src={displayProfile ? displayProfile : speciesImage}
                      width='110'
                      height='110'
                      alt='Profile'
                      style={{
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                    />
                  )}
                </Avatar>
                <Typography variant='body2' sx={{ mt: 4, ml: 22 }}>
                  {displayProfile ? 'Change Display Picture' : 'Add Display Picture'}
                </Typography>
              </Box>
              <Box>
                <FormControl fullWidth sx={{ mt: 6 }}>
                  <Typography sx={{ mt: 1 }}>Scientific Name</Typography>

                  <Controller
                    name='scientificName'
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <>
                        {console.log('valu>>', value)}
                        <TextField
                          sx={{ mt: 2 }}
                          value={editName ? editName : value}
                          disabled={editName && true}
                          onChange={onChange}
                          placeholder='Scientific Name'
                          error={Boolean(errors.scientificName)}
                          name='scientificName'
                        />
                      </>
                    )}
                  />
                  {errors.scientificName && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.scientificName.message}</FormHelperText>
                  )}
                </FormControl>
              </Box>
              <Box>
                <FormControl fullWidth sx={{ mt: 6 }}>
                  <Typography>Common Names</Typography>

                  <FormControl fullWidth>
                    {editVernacularNames.length > 0 ? (
                      (console.log('Veenacular ??', editVernacularNames),
                      (
                        <>
                          <Controller
                            name='vernacular_id'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => {
                              const filteredVernacularNames = editVernacularNames.filter(item =>
                                rows.some(row => row.default_common_name_id === item.id)
                              )

                              const selectedId =
                                value || (filteredVernacularNames.length > 0 && filteredVernacularNames[0].id)

                              return (
                                <>
                                  <Select
                                    sx={{ mt: 2 }}
                                    fullWidth
                                    value={selectedId !== null ? selectedId : ''}
                                    error={Boolean(errors.vernacular_id)}
                                    onChange={e => onChange(e.target.value)}
                                    renderValue={selected => {
                                      if (!selected) {
                                        return <em>Select Vernacular</em>
                                      }
                                      // Find the selected vernacular name based on selected value
                                      const selectedVernacular = editVernacularNames.find(item =>
                                        item.id ? item.id === selected : item.id === selected
                                      )
                                      return selectedVernacular ? selectedVernacular.vernacular_name : ''
                                    }}
                                  >
                                    {editVernacularNames?.map((item, index) => (
                                      <MenuItem key={index} value={item.id}>
                                        {item.vernacular_name}
                                      </MenuItem>
                                    ))}
                                  </Select>

                                  <Typography sx={{ ml: '140px', mt: 5 }}>or</Typography>
                                </>
                              )
                            }}
                          />

                          {errors.vernacular_id && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors.vernacular_id.message}</FormHelperText>
                          )}
                        </>
                      ))
                    ) : (
                      <>
                        {vernacularData.length > 0 && (
                          <>
                            <Controller
                              name='vernacular_id'
                              control={control}
                              rules={{ required: true }}
                              render={({ field: { value, onChange } }) => (
                                <>
                                  <Select
                                    sx={{ mt: 2 }}
                                    fullWidth
                                    value={value || ''}
                                    error={Boolean(errors.vernacular_id)}
                                    onChange={e => {
                                      const selectedId = e.target.value
                                      onChange(selectedId)
                                      setSelectedValues(selectedId)
                                    }}
                                    renderValue={selected => {
                                      if (!selected) {
                                        return <em>Select Vernacular</em>
                                      }
                                      const selectedVernacular = vernacularData.find(item => item.vern_id === selected)
                                      return selectedVernacular ? selectedVernacular.vernacular_name : ''
                                    }}
                                  >
                                    {vernacularData.map((item, index) => (
                                      <MenuItem key={index} value={item.vern_id}>
                                        {item.vernacular_name}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </>
                              )}
                            />
                            {errors.vernacular_id && (
                              <FormHelperText sx={{ color: 'error.main' }}>
                                {errors.vernacular_id.message}
                              </FormHelperText>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </FormControl>

                  {vernacularData.length > 0 && <Typography sx={{ ml: '140px', mt: 5 }}>or</Typography>}
                  <Controller
                    name='vernacular_name'
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        sx={{ mt: 2 }}
                        value={value || ''}
                        error={Boolean(errors.vernacular_name)}
                        onChange={onChange}
                        placeholder=' Enter Common Name'
                        name='vernacular_name'
                      />
                    )}
                  />
                  {errors.vernacular_name && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.vernacular_name.message}</FormHelperText>
                  )}
                </FormControl>
              </Box>
              <Box>
                <input
                  type='file'
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  name='banner_images'
                  multiple
                  onChange={handleFileChange}
                />
                <Button fullWidth sx={{ mt: 9, height: '50px' }} variant='contained' onClick={handleButtonClick}>
                  Add Gallery Images
                </Button>
                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'row' }}>
                  {BannerImages.length > 0
                    ? [...BannerImages, ...selectedImages].map((image, index) => (
                        <Box key={index} sx={{ position: 'relative', marginRight: 2, margin: 4 }}>
                          <img
                            src={image.image_url ? image.image_url : image}
                            alt={`Image ${index}`}
                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                          />
                          <IconButton
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              width: 30,
                              height: 30,
                              mb: 5,
                              color: 'white',
                              backgroundColor: 'rgba(0, 0, 0, 0.5)'
                            }}
                            onClick={() => handleRemoveImage(image)}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      ))
                    : selectedImages.map((image, index) => (
                        <Box key={index} sx={{ position: 'relative', marginRight: 2, margin: 4 }}>
                          <img
                            src={image}
                            alt={`Image ${index}`}
                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                          />
                          <IconButton
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              width: 30,
                              height: 30,
                              mb: 5,
                              color: 'white',
                              backgroundColor: 'rgba(0, 0, 0, 0.5)'
                            }}
                            onClick={() => handleRemoveImage(image)}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      ))}
                </Box>
              </Box>

              <Typography variant='body' sx={{ fontSize: '13px' }}>
                Add images in JPG or PNG format only. Preferrable dimension of the image is 2000 width x 1250 height
              </Typography>
              <Box>
                <Button fullWidth sx={{ mt: 8, height: '50px' }} size='medium' type='submit' variant='contained'>
                  Submit
                </Button>
              </Box>
            </form>
          </Box>
        ) : (
          <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
            <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              {console.log('Field Type', fields)}
              {console.log('prefilled >>', prefillHybrid)}
              {fields.map((field, index) => (
                <React.Fragment key={field.id}>
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <Controller
                      name={`taxonomyFields[${index}].taxonomy_id`}
                      control={control}
                      rules={{ required: true }}
                      defaultValue={editName ? prefillHybrid[index]?.taxonomy_id : defaultTaxonomy}
                      render={({ field }) => (
                        <Autocomplete
                          id={`taxonomyFields[${index}].taxonomy_id`}
                          value={editName ? prefillHybrid : taxonomy.find(option => option.taxonomy_id === field.value)}
                          options={editName ? [prefillHybrid] : taxonomy}
                          getOptionLabel={option => `${option.common_name} (${option.scientific_name})`}
                          isOptionEqualToValue={(option, value) =>
                            option ? option.taxonomy_id === value.taxonomy_id : false
                          }
                          onChange={(e, val) => {
                            setDefaultTaxonomy(val ? val : '')
                            field.onChange(val ? val.taxonomy_id : null)
                            if (val) {
                              setValue(`taxonomyFields[${index}].scientific_name`, val.scientific_name)
                              setValue(`taxonomyFields[${index}].common_name`, val.common_name)
                            }
                            const formValues = getValues()
                            let combinedScientificName = formValues.scientificName
                            if (val && val.scientific_name) {
                              if (crossText) {
                                combinedScientificName += ' X'
                              }
                              combinedScientificName += ` ${val.scientific_name} `
                            }
                            let combinedCommonName = formValues.vernacular_name
                            if (val && val.common_name) {
                              if (crossText) {
                                combinedCommonName += ' X'
                              }
                              combinedCommonName += ` ${val.common_name}`
                            }

                            setValue('taxonomy_id', formValues?.taxonomyFields[0].taxonomy_id)
                            setValue('scientificName', combinedScientificName.trim())
                            setValue('vernacular_name', combinedCommonName.trim())
                          }}
                          onKeyUp={e => {
                            if (e.target.value.length >= 3) {
                              fetchTaxonomy(e.target.value)
                            }
                          }}
                          clearIcon={<ClearIcon onClick={() => handleRemoveTextField(index)} />}
                          renderInput={params => (
                            <>
                              {index !== 0 ? (
                                <>
                                  <Typography variant='h6' sx={{ textAlign: 'center' }}>
                                    X
                                  </Typography>
                                  <TextField
                                    {...params}
                                    name='taxonomy_id'
                                    label={`Choose Taxonomy ${index + 1}`}
                                    placeholder='Enter at least 3 characters'
                                    variant='outlined'
                                    fullWidth
                                    disabled={editName && true}
                                  />
                                </>
                              ) : (
                                <TextField
                                  {...params}
                                  name='taxonomy_id'
                                  label={`Choose Taxonomy ${index + 1}`}
                                  placeholder='Enter at least 3 characters'
                                  variant='outlined'
                                  fullWidth
                                  disabled={editName && true}
                                />
                              )}
                            </>
                          )}
                        />
                      )}
                    />
                    {errors?.taxonomyFields?.[index]?.tsn_id && (
                      <FormHelperText sx={{ color: 'error.main' }}>
                        {errors?.taxonomyFields?.[index]?.tsn_id.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </React.Fragment>
              ))}

              {!editName && (
                <Box sx={{ textAlign: 'center', mt: 2, fontSize: '14px' }} onClick={handleAddField}>
                  <Typography>Choose Taxonomy</Typography>
                </Box>
              )}

              <Box>
                <FormControl fullWidth sx={{ mt: 6 }}>
                  <Typography sx={{ mt: 1 }}>Scientific Name</Typography>
                  <Controller
                    name='scientificName'
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <>
                        {console.log('valu>>', value)}
                        <TextField
                          sx={{ mt: 2 }}
                          value={editName ? editName : value}
                          disabled={editName && true}
                          onChange={onChange}
                          placeholder='Scientific Name'
                          error={Boolean(errors.scientificName)}
                          name='scientificName'
                        />
                      </>
                    )}
                  />
                  {errors.scientificName && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.scientificName.message}</FormHelperText>
                  )}
                </FormControl>
              </Box>
              <Box>
                <FormControl fullWidth sx={{ mt: 6 }}>
                  <Typography sx={{ mt: 1 }}>Common Name</Typography>
                  <Controller
                    name='vernacular_name'
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <>
                        {console.log('valu>>', value)}
                        <TextField
                          sx={{ mt: 2 }}
                          value={commonName ? commonName : value}
                          disabled={editName && true}
                          onChange={onChange}
                          placeholder='Common Name'
                          error={Boolean(errors.scientificName)}
                          name='vernacular_name'
                        />
                      </>
                    )}
                  />
                  {errors.scientificName && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.scientificName.message}</FormHelperText>
                  )}
                </FormControl>
              </Box>
              {editName && (
                <>
                  <Typography sx={{ ml: '145px', mt: 3 }}>or</Typography>
                  <Controller
                    name=''
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        sx={{ mt: 2 }}
                        fullWidth
                        value={value || ''}
                        error={Boolean(errors.vernacular_name)}
                        onChange={onChange}
                        placeholder=' Enter Common Name'
                        name='vernacular_name'
                      />
                    )}
                  />
                  {errors.vernacular_name && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.vernacular_name.message}</FormHelperText>
                  )}

                  <Box
                    sx={{ mt: 7, cursor: 'pointer' }}
                    onClick={() => {
                      setDialogOpen(true)
                    }}
                  >
                    <Card>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          {' '}
                          <CardHeader
                            title={
                              breedList.length > 0
                                ? `${breedList.length} ${breedList.length === 1 ? 'Breed' : 'Breeds'}`
                                : 'Select Breed'
                            }
                          />
                        </Box>

                        <Box
                          sx={{ mt: 5, mr: 4 }}
                          onClick={() => {
                            setDialogOpen(true)
                          }}
                        >
                          <IconButton
                            size='small'
                            sx={{ color: 'text.primary' }}
                            onClick={() => {
                              setDialogOpen(true)
                            }}
                          >
                            <Icon icon='mdi:plus' fontSize={20} />
                          </IconButton>
                        </Box>
                      </Box>
                      {breedList.length > 0 && (
                        <>
                          <Divider />
                          <CardContent>
                            {breedList?.map((item, index) => {
                              return (
                                <>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box>
                                      {' '}
                                      <Typography>{item?.sub_taxon_name}</Typography>
                                    </Box>
                                    <Box>
                                      <IconButton
                                        size='small'
                                        sx={{ color: 'text.primary' }}
                                        onClick={e => handleRemoveBreed(e, item?.sub_taxon_id)}
                                      >
                                        <Icon icon='mdi:close' fontSize={20} />
                                      </IconButton>
                                    </Box>
                                  </Box>

                                  {index < breedList.length - 1 && <Divider sx={{ mt: 2 }} />}
                                </>
                              )
                            })}
                          </CardContent>
                        </>
                      )}
                    </Card>
                  </Box>

                  <Box
                    sx={{ mt: 7, cursor: 'pointer' }}
                    onClick={event => {
                      handleMorphCard(event)
                    }}
                  >
                    <Card>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <CardHeader
                            title={
                              selectedItems?.length > 0
                                ? `${selectedItems.length} ${selectedItems.length === 1 ? 'Morph' : 'Morphs'}`
                                : 'Select Morph/Mutation'
                            }
                          />
                        </Box>

                        <Box sx={{ mt: 5, mr: 4 }}>
                          <IconButton
                            size='small'
                            sx={{ color: 'text.primary' }}
                            onClick={event => {
                              handleMorphCard(event)
                            }}
                          >
                            <Icon icon='mdi:plus' fontSize={20} />
                          </IconButton>
                        </Box>
                      </Box>
                      <Divider />
                      {selectedItems?.length >= 1 && (
                        <>
                          <CardContent>
                            {selectedItems?.map((item, index) => {
                              console.log('Item >>', item)
                              return (
                                <React.Fragment key={index}>
                                  {/* Use index as key, or better use unique identifiers if available */}
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                    <Box sx={{ ml: 1 }}>
                                      <Typography>{item?.sub_taxon_name}</Typography>
                                    </Box>
                                    <Box>
                                      <IconButton
                                        size='small'
                                        sx={{ color: 'text.primary' }}
                                        onClick={e => handleRemoveItem(e, item)}
                                      >
                                        <Icon icon='mdi:close' fontSize={20} />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                  {index < selectedItems.length - 1 && <Divider sx={{ mt: 1 }} />}
                                </React.Fragment>
                              )
                            })}
                          </CardContent>
                        </>
                      )}
                    </Card>
                  </Box>

                  <Box
                    sx={{ mt: 7, cursor: 'pointer' }}
                    onClick={event => {
                      handlelocalityCard(event)
                    }}
                  >
                    <Card>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <CardHeader
                            title={
                              selectedLocality?.length > 0
                                ? `${selectedLocality.length} ${
                                    selectedLocality.length === 1 ? 'locality' : 'localities'
                                  }`
                                : 'Select Locality'
                            }
                          />
                        </Box>

                        <Box sx={{ mt: 5, mr: 4 }}>
                          <IconButton size='small' sx={{ color: 'text.primary' }}>
                            <Icon icon='mdi:plus' fontSize={20} />
                          </IconButton>
                        </Box>
                      </Box>
                      {selectedLocality?.length > 1 && (
                        <>
                          <Divider />
                          <CardContent>
                            {selectedLocality?.map((item, index) => {
                              console.log('Item >>', item)
                              return (
                                <React.Fragment key={item.id || index}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Box sx={{ mt: 2 }}>
                                      <Typography sx={{ ml: 1 }}>
                                        {item?.sub_taxon_name || 'Fallback text'}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                      <IconButton
                                        size='small'
                                        sx={{ color: 'text.primary' }}
                                        onClick={e => handleLocalityRemoveItem(e, item)}
                                      >
                                        <Icon icon='mdi:close' fontSize={20} />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                  {index < selectedLocality.length - 1 && <Divider sx={{ mt: 2 }} />}
                                </React.Fragment>
                              )
                            })}
                          </CardContent>
                        </>
                      )}
                    </Card>
                  </Box>
                </>
              )}

              <Box>
                <Avatar
                  sx={{
                    mt: 8,
                    width: '110px',
                    height: '110px',
                    position: 'relative',
                    left: '100px',
                    cursor: 'pointer'
                  }}
                  name='species_image'
                >
                  <input
                    id='fileInput'
                    type='file'
                    accept='image/*'
                    onChange={e => handleInputImageChange(e)}
                    name='species_image'
                    style={{
                      opacity: 0,
                      position: 'absolute',
                      height: '200px',
                      width: '200px',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      zIndex: 1
                    }}
                  />
                  {(displayProfile || speciesImage) && (
                    <img
                      src={displayProfile ? displayProfile : speciesImage}
                      width='110'
                      height='110'
                      alt='Profile'
                      style={{
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                    />
                  )}
                </Avatar>
                <Typography variant='body2' sx={{ mt: 4, ml: 22 }}>
                  {displayProfile ? 'Change Display Picture' : 'Add Display Picture'}
                </Typography>
              </Box>
              <Box>
                <input
                  type='file'
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  name='banner_images'
                  multiple
                  onChange={handleFileChange}
                />
                <Button fullWidth sx={{ mt: 9, height: '50px' }} variant='contained' onClick={handleButtonClick}>
                  Add Gallery Images
                </Button>
                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'row' }}>
                  {BannerImages.length > 0
                    ? [...BannerImages, ...selectedImages].map((image, index) => (
                        <Box key={index} sx={{ position: 'relative', marginRight: 2, margin: 4 }}>
                          <img
                            src={image.image_url ? image.image_url : image}
                            alt={`Image ${index}`}
                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                          />
                          <IconButton
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              width: 30,
                              height: 30,
                              mb: 5,
                              color: 'white',
                              backgroundColor: 'rgba(0, 0, 0, 0.5)'
                            }}
                            onClick={() => handleRemoveImage(image)}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      ))
                    : selectedImages.map(
                        (
                          image,
                          index // Render selected images if bannerImages is empty
                        ) => (
                          <Box key={index} sx={{ position: 'relative', marginRight: 2, margin: 4 }}>
                            <img
                              src={image}
                              alt={`Image ${index}`}
                              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                            />
                            <IconButton
                              sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: 30,
                                height: 30,
                                mb: 5,
                                color: 'white',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)'
                              }}
                              onClick={() => handleRemoveImage(image)}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Box>
                        )
                      )}
                </Box>
              </Box>

              <Typography variant='body' sx={{ fontSize: '13px' }}>
                Add images in JPG or PNG format only. Preferrable dimension of the image is 2000 width x 1250 height
              </Typography>
              {dialogOpen && (
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: '350px',
                    // height:"20vh",
                    position: 'fixed',
                    bottom: 0,
                    zIndex: 1,
                    bgcolor: 'white',
                    alignItems: 'center',
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Card sx={{ width: '370px', height: '260px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box sx={{ ml: 1 }}>
                        <CardHeader title='Add New Breed' />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton size='small' sx={{ color: 'text.primary' }} onClick={() => setDialogOpen(false)}>
                          <Icon icon='mdi:close' fontSize={20} />
                        </IconButton>
                      </Box>
                    </Box>

                    <Divider />
                    <CardContent>
                      <Controller
                        name='breed_name'
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            sx={{ mt: 3, width: '340px', mb: 10 }}
                            value={value || ''}
                            error={Boolean(errors.breed_name)}
                            onChange={onChange}
                            placeholder='Breed Name'
                            name='breed_name'
                          />
                        )}
                      />
                    </CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                      <Button variant='outlined' size='small' onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant='outlined'
                        size='small'
                        sx={{ ml: 4 }}
                        onClick={() => {
                          handleAddBreed()
                        }}
                      >
                        Add Breed
                      </Button>
                    </Box>
                  </Card>
                </Box>
              )}

              {dialogMorphOpen && (
                <Box
                  sx={{
                    width: '200%',
                    maxWidth: '350px',
                    height: '50vh',
                    position: 'fixed',
                    bottom: 0,
                    zIndex: 1,
                    bgcolor: 'white',
                    alignItems: 'center',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Card
                    sx={{
                      width: '400px',
                      height: '110%',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: 'background.default',
                      position: 'relative'
                    }}
                  >
                    <Box sx={{ position: 'sticky', zIndex: 2, bgcolor: 'background.default', p: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          position: 'relative',
                          bottom: '10px'
                        }}
                      >
                        <CardHeader sx={{ position: 'relative', right: 0 }} title='Morphs List' />
                        <IconButton
                          size='small'
                          sx={{ color: 'text.primary', mr: 0 }}
                          onClick={() => setDialogMorphOpen(false)}
                        >
                          <Icon icon='mdi:close' fontSize={20} />
                        </IconButton>
                      </Box>
                      <Box>
                        <TextField
                          sx={{ width: '100%', ml: 4, width: '370px', position: 'relative', bottom: '15px' }}
                          placeholder='Search and Select'
                          inputRef={inputRef}
                          value={searchValue}
                          onChange={e => handleSearchValue(e)}
                        />
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        overflowX: 'auto',
                        p: 2
                      }}
                    >
                      {morphList?.length > 0 &&
                        morphList?.map(item => (
                          <Card key={item.sub_taxon_id} sx={{ boxShadow: 'none', mb: 2, ml: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', m: 1 }}>
                              <Typography variant='h6' sx={{ ml: 3, mt: 2 }}>
                                {item?.sub_taxon_name}
                              </Typography>
                              <Checkbox
                                checked={selectedItems.some(
                                  selectedItem => selectedItem.sub_taxon_id === item.sub_taxon_id
                                )}
                                onChange={event => handleCheckboxChange(event, item)}
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          </Card>
                        ))}
                    </Box>
                    <Box
                      sx={{
                        position: 'fixed', // Ensure it's fixed at the bottom of the viewport
                        bottom: 0,
                        zIndex: 1, // Make sure it's above other elements
                        bgcolor: 'background.default',
                        p: 1,
                        width: '389px',
                        ml: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: 20 }}>
                          {selectedItems.length > 0 ? `${selectedItems.length} morphs selected` : 'Select Morphs'}
                        </Typography>
                      </Box>
                      <Box sx={{ position: 'relative', right: '25px' }}>
                        {' '}
                        <Button size='small' variant='outlined' onClick={handleAdd}>
                          Add
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                </Box>
              )}
              <Box
                sx={{
                  // display: 'flex',
                  // justifyContent: 'space-between',
                  alignItems: 'center'
                  // width: '100%',
                  // p: 2
                }}
              ></Box>

              {dialogLocalityOpen && (
                <Box
                  sx={{
                    width: '200%',
                    maxWidth: '350px',
                    height: '50vh',
                    position: 'fixed',
                    bottom: 0,
                    zIndex: 1,
                    bgcolor: 'white',
                    alignItems: 'center',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Card
                    sx={{
                      width: '400px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: 'background.default',
                      position: 'relative'
                    }}
                  >
                    <Box sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: 'background.default', p: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          position: 'relative',
                          bottom: '10px'
                        }}
                      >
                        <CardHeader sx={{ position: 'relative', right: 2 }} title={'Locality List'} />
                        <IconButton
                          size='small'
                          sx={{ color: 'text.primary', mr: 0 }}
                          onClick={() => setDialogLocalityOpen(false)}
                        >
                          <Icon icon='mdi:close' fontSize={20} />
                        </IconButton>
                      </Box>
                      <Box sx={{ mt: 2, ml: 4, position: 'relative', bottom: '20px' }}>
                        <TextField
                          sx={{ width: '98%' }}
                          placeholder='Search and Select'
                          inputRef={inputRef}
                          value={searchLocality}
                          onChange={e => handlelocalitySearchValue(e)}
                        />
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        overflowX: 'auto',
                        p: 2
                      }}
                    >
                      {localityList?.length > 0 &&
                        localityList?.map(item => (
                          <Card
                            key={item.sub_taxon_id}
                            sx={{ boxShadow: 'none', mb: 2, ml: 4, position: 'relative', bottom: '11px' }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', m: 1 }}>
                              <Typography variant='h6' sx={{ mt: 2, ml: 3 }}>
                                {item?.sub_taxon_name}
                              </Typography>
                              <Checkbox
                                checked={selectedLocality.some(
                                  selectedItem => selectedItem.sub_taxon_id === item.sub_taxon_id
                                )}
                                onChange={event => handleLocalityCheckboxChange(event, item)}
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          </Card>
                        ))}
                    </Box>
                    <Box
                      sx={{
                        position: 'fixed',
                        bottom: 0,
                        zIndex: 2,
                        bgcolor: 'background.default',
                        p: 1,
                        width: '389px',
                        ml: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: 20 }}>
                          {selectedLocality.length > 0
                            ? `${selectedLocality.length} locality selected`
                            : 'Select Locality'}
                        </Typography>
                      </Box>
                      <Box sx={{ position: 'relative', right: '25px' }}>
                        <Button size='small' variant='outlined' onClick={handlelocalityAdd}>
                          Add
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                </Box>
              )}
              <Box
                sx={{
                  // display: 'flex',
                  // justifyContent: 'space-between',
                  alignItems: 'center'
                  // width: '100%',
                  // p: 2
                }}
              ></Box>

              <Box>
                <Button fullWidth sx={{ mt: 8, height: '50px' }} size='medium' type='submit' variant='contained'>
                  Submit
                </Button>
              </Box>
            </form>
          </Box>
        )}
      </Drawer>
    </>
  )
}
export default AddSpeciesSlideBar
