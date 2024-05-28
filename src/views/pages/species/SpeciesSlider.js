import {
  Autocomplete,
  Avatar,
  Button,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect, useMemo, useState, useRef } from 'react'
import Icon from 'src/@core/components/icon'
import CloseIcon from '@mui/icons-material/Close'
import { Controller, useForm } from 'react-hook-form'
import { LoadingButton } from '@mui/lab'
import {
  DeleteBannerById,
  UpdateSpecies,
  UploadBannerImages,
  addSpecies,
  getSearchTaxonomyList,
  getSpeciesVernacularData
} from 'src/lib/api/species'
import toast from 'react-hot-toast'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { bn } from 'date-fns/locale'

const AddSpeciesSlideBar = ({
  handleSidebarClose,
  setOpenDrawer,
  fetchTaxonomy,
  taxonomy,
  editVernacularNames,
  editName,
  tsnId,
  commonName,
  editCommonId,
  speciesImage,
  BannerImages,
  setBannerImages
}) => {
  console.log('editValues >>', editVernacularNames, editCommonId)

  console.log('Banner Images >>>', BannerImages)

  const [displayProfile, setDisplayProfile] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [open, setOpen] = useState(false)
  const [vernacularData, setVernacularData] = useState([])
  const [selectedImages, setSelectedImages] = useState([])
  const [defaultTaxonomy, setDefaultTaxonomy] = useState(null)
  const [selectedValues, setSelectedValues] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const fileInputRef = React.useRef(null)

  console.log('EditName>>', editName)

  console.log('Vernacular Names >>', editVernacularNames)

  const schema = yup.object().shape({
    tsn_id: yup.string().required('Taxonomy is Required'),
    scientificName: yup.string().required('Scientific Name is Required')
    // vernacular_id: yup.array().required('Common Name is Required')
    // vernacular_name: yup.string().when('vernacular_id', {
    //   is: vernacularId => !vernacularId,
    //   then: yup.string().required('Vernacular Name is required when Vernacular ID is not provided'),
    //   otherwise: yup.string()
    // })
  })

  const defaultValues = {
    tsn_id: '',
    vernacular_id: '',
    species_image: '',
    scientificName: '',
    banner_images: [],
    vernacular_name: ''
  }

  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    getValues,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const prefillDefault = { taxonomy_id: tsnId, scientific_name: editName, common_name: '' }

  const addEventSidebarOpen = () => {
    setOpenDrawer(true)
  }

  const fetchSpeciesVernacularData = async taxonomy => {
    console.log('test----------------------------------------------')
    try {
      const response = await getSpeciesVernacularData(taxonomy?.taxonomy_id)
      setVernacularData(response?.data) // Set the response data
    } catch (error) {
      console.error('Error fetching species data:', error)
      setVernacularData(null)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = e => {
    debugger
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

        filesRead++

        if (filesRead === files.length) {
          setSelectedImages(imagesArray)
          setValue('banner_images', filesArray)
        }
      }

      reader.readAsDataURL(file)
    }
  }

  console.log('GetValues >>', getValues())

  const handleRemoveImage = async imageId => {
    debugger
    try {
      const response = await DeleteBannerById(imageId)
      if (response?.success) {
        console.log('Image deleted successfully:', imageId)
        console.log('Previous bannerImages:', BannerImages)

        const indexToRemove = BannerImages.findIndex(image => image.id === imageId.id)

        if (indexToRemove !== -1) {
          const updatedBannerImages = [...BannerImages]

          updatedBannerImages.splice(indexToRemove, 1)

          setBannerImages(updatedBannerImages)

          console.log('Updated bannerImages:', BannerImages)
        } else {
          console.log('Image not found in bannerImages array')
        }
      } else {
        console.log('Error in Deleting:', response?.error)
      }
    } catch (error) {
      console.log('Error:', error)
    }
  }

  const handleAddRemoveImage = indexToRemove => {
    const updatedImages = selectedImages.filter((image, index) => index !== indexToRemove)
    setValue('banner_images', updatedImages)
    setSelectedImages(updatedImages)
  }

  const handleInputImageChange = file => {
    debugger
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

  const onSubmit = async val => {
    debugger
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
    console.log('Payload >>', payload)

    if (editName && tsnId) {
      const payload = {
        tsn_id: tsnId,
        vernacular_id:
          Array.isArray(val?.vernacular_id) && val?.vernacular_id.length === 1 && val?.vernacular_id[0] === null
            ? editCommonId
            : val?.vernacular_id,
        scientificName: editName,
        species_image: val?.species_image,
        banner_images: val.banner_images ? val.banner_images : [],
        zoo_id: 11
      }
      if (val?.vernacular_name) {
        payload['vernacular_name'] = val?.vernacular_name
      }
      console.log('Payload >>', payload)
      const Bannerparams = {
        tsn_id: tsnId,
        banner_images: val.banner_images
      }
      // Upload banner images
      const bannerUploadResponse = await UploadBannerImages(Bannerparams)
      if (bannerUploadResponse.success) {
        const response = await UpdateSpecies(payload, tsnId)
        if (response.success) {
          toast.success('Species Updated Successfully ')
          setOpenDrawer(false)
        } else {
          toast.error('Unable to Update the Species')
        }
      } else {
        toast.error('Unable to upload banner images')
      }
    } else {
      const response = await addSpecies(payload)

      if (response?.success) {
        toast.success('Species Added Successfully')
        setOpenDrawer(false)
      } else {
        toast.error('Taxonomy already added')
      }
    }
  }

  useEffect(() => {
    if (editName) {
      setValue('tsn_id', tsnId)
      setValue('scientificName', editName)
      // setValue('species_image', speciesImage)
    }
  }, [])

  // useEffect(() => {
  //   setValue('species_image', displayProfile)
  // }, [displayProfile])

  console.log('selected Values >>', selectedValues)

  console.log('Edit Vernacular Values >', commonName)

  console.log('aiMAGE ?', displayProfile, speciesImage)

  return (
    <>
      <Drawer
        anchor='right'
        open={addEventSidebarOpen}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: ['100%', 400], transitionDuration: '1s' } }}
      >
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
            <IconButton size='small' sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} onClick={handleSidebarClose} />
            </IconButton>
          </Box>
        </Box>

        <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
          <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
            <FormControl fullWidth>
              <Controller
                name='tsn_id'
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                  console.log('tsnId:>>>>>>>>>', tsnId)
                  return (
                    <Autocomplete
                      id='tsn_id'
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
                        setValue('scientificName', val ? val.scientific_name : editName)
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
                  )
                }}
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
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      sx={{ mt: 2 }}
                      value={editName ? editName : value}
                      disabled={editName && true}
                      onChange={onChange}
                      placeholder='Scientific Name'
                      error={Boolean(errors.scientificName)}
                      name='scientificName'
                    />
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
                    <>
                      <Controller
                        name='vernacular_id'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => {
                          console.log('Selected IDs:', value)
                          const selectedId =
                            value ||
                            (editVernacularNames.length > 0
                              ? editVernacularNames[0].vern_id
                                ? editVernacularNames[0].vern_id
                                : editVernacularNames[0].id
                              : null)
                          console.log('Prefill ID:', selectedId)

                          return (
                            <>
                              <Select
                                sx={{ mt: 2 }}
                                fullWidth
                                value={selectedId}
                                error={Boolean(errors.vernacular_id)}
                                onChange={e => {
                                  const selectedId = e.target.value
                                  onChange(selectedId)
                                }}
                                renderValue={selected => {
                                  if (!selected) {
                                    return <em>Select Vernacular</em>
                                  }
                                  const selectedVernacular = editVernacularNames.find(item =>
                                    item.vern_id ? item.vern_id === selected : item.id === selected
                                  )
                                  return selectedVernacular ? selectedVernacular.vernacular_name : ''
                                }}
                              >
                                {editVernacularNames.map((item, index) => (
                                  <MenuItem key={index} value={item.vern_id ? item.vern_id : item.id}>
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
                            <FormHelperText sx={{ color: 'error.main' }}>{errors.vernacular_id.message}</FormHelperText>
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
                {BannerImages.length > 0 // Conditionally rendering based on bannerImages
                  ? BannerImages.map((image, index) => (
                      <Box key={index} sx={{ position: 'relative', marginRight: 2, margin: 4 }}>
                        <img
                          src={image.image_url} // Assuming the URL is stored in 'image_url'
                          alt={`Banner Image ${index}`}
                          style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 4 }}
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
                            onClick={() => handleAddRemoveImage(index)}
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
            <Box>
              <Button fullWidth sx={{ mt: 8, height: '50px' }} size='medium' type='submit' variant='contained'>
                Submit
              </Button>
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}
export default AddSpeciesSlideBar
