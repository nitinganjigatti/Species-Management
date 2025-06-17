import { yupResolver } from '@hookform/resolvers/yup'
import {
  Autocomplete,
  Button,
  CircularProgress,
  debounce,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  TextField,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useCallback, useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { getProductList } from 'src/lib/api/pharmacy/dispenseProduct'
import { getNewRackList } from 'src/lib/api/pharmacy/getRackList'
import { addStockItem, getConfigMedicine, getShelvesList } from 'src/lib/api/pharmacy/getStockItem'
import RenderUtility from 'src/utility/render'
import * as Yup from 'yup'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'

const defaultValues = {
  stock_id: null,
  locations: [
    {
      config_id: null,
      rack_id: '',
      shelf_id: ''
    }
  ]
}

const schema = Yup.object().shape({
  stock_id: Yup.object().required('Product Name is required'),
  locations: Yup.array().of(
    Yup.object().shape({
      rack_id: Yup.string().required('Rack is required'),
      shelf_id: Yup.string().required('Shelf is required')
    })
  )
})

const AddMedicineDialog = ({ close, setDialogCheck, productData, selectedPharmacy, setProductData, dialogCheck }) => {
  const [products, setProducts] = useState([])
  const [racks, setRacks] = useState([])
  const [shelves, setShelves] = useState([])
  const [defaultRack, setDefaultRack] = useState([])
  const [defaultShelf, setDefaultShelf] = useState([])
  const [submitLoader, setSubmitLoader] = useState(false)
  const [existingMedConfig, setExistingMedConfig] = useState([])
  const [configErrors, setConfigErrors] = useState({})
  const [isConfigLoading, setIsConfigLoading] = useState(false)

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    trigger
  } = useForm({
    defaultValues: defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    reValidateMode: 'onSubmit',
    mode: 'onSubmit'
  })

  const stockIdValue = watch('stock_id')

  const { fields, append, remove, insert, replace } = useFieldArray({
    control,
    name: 'locations'
  })

  useEffect(() => {
    if (productData) {
      // Directly set the product from productData
      reset({
        stock_id: {
          label: productData.stock_name,
          value: productData.stock_item_id,
          status: 1
        },
        locations: productData?.racks.map(rack => ({
          config_id: rack?.config_id,
          rack_id: rack?.rack_id,
          shelf_id: rack?.shelf_id
        }))
      })

      // Set default rack and shelf values
      const rackValues = productData?.racks.map(rack => ({
        rack_id: rack?.rack_id,
        rack_name: rack?.rack_name
      }))

      const shelfValues = productData?.racks.map(rack => ({
        shelf_id: rack?.shelf_id,
        shelf_name: rack?.shelf_name
      }))

      setDefaultRack(rackValues)
      setDefaultShelf(shelfValues)

      // Fetch existing medicine config
      getMedicineConfig({ stockId: productData?.stock_item_id })
    }
  }, [productData, selectedPharmacy?.id])

  useEffect(() => {
    if (!productData) {
      try {
        getProductList({ params: { sort: 'asc', q: '', limit: 50 } }).then(res => {
          if (res?.data?.list_items?.length > 0) {
            setProducts(
              res?.data?.list_items?.map(item => ({
                label: item.name,
                value: item.id,
                status: item?.active === '0' ? 0 : 1,
                generic_name: item?.generic_name
              }))
            )
          }
        })
      } catch (error) {
        console.error(error)
      }
    }
  }, [productData])

  const searchProductData = useCallback(
    debounce(async searchText => {
      if (!productData) {
        try {
          await getProductList({ params: { sort: 'asc', q: searchText, limit: 50 } }).then(res => {
            if (res?.data?.list_items?.length > 0) {
              setProducts(
                res?.data?.list_items?.map(item => ({
                  label: item.name,
                  value: item.id,
                  stock_type: item.stock_type,
                  unit_price: item.unit_price,
                  status: item?.active === '0' ? 0 : 1,
                  manufacture: item?.manufacturer_name,
                  packageDetails: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
                  control_substance: item.controlled_substance === '1' ? true : false
                }))
              )
            }
          })
        } catch (error) {
          console.error(error)
        }
      }
    }, 500),
    [productData]
  )

  const getMedicineConfig = useCallback(
    async ({ stockId }) => {
      try {
        setIsConfigLoading(true)
        const params = {}
        const response = await getConfigMedicine({ id: stockId, params })
        if (response?.success) {
          setExistingMedConfig(response?.data?.racks)
        }
      } catch (error) {
        console.error('Cannot get medicine config list', error)
      } finally {
        setIsConfigLoading(false)
      }
    },
    [selectedPharmacy?.id]
  )

  useEffect(() => {
    const getRacksLists = async () => {
      try {
        const response = await getNewRackList()
        if (response?.data.length > 0) {
          setRacks(
            response?.data?.map(item => ({
              ...item,
              rack_id: item?.id,
              rack_name: item?.name
            }))
          )
        }
      } catch (error) {
        console.error('Error fetching rack list:', error)
      }
    }
    getRacksLists()
  }, [selectedPharmacy?.id])

  const getShelves = useCallback(
    async ({ rackId }) => {
      try {
        const params = {}
        const response = await getShelvesList({ id: rackId, params })
        if (response?.data?.list_items.length > 0) {
          setShelves(
            response?.data?.list_items?.map(item => ({
              shelf_id: item?.id,
              shelf_name: item?.name
            }))
          )
        }
      } catch (error) {
        console.error('Cannot fetch Shelves List', error)
      }
    },
    [selectedPharmacy?.id]
  )

  const onSubmit = async data => {
    // Trigger validation before submitting
    const isValid = await trigger()
    if (!isValid) return

    const id = data?.stock_id?.value
    setSubmitLoader(true)

    try {
      let payload = []

      if (productData === null) {
        // For new product configuration
        payload = data.locations.map(loc => ({
          config_id: null,
          rack_id: Number(loc.rack_id),
          shelf_id: Number(loc.shelf_id)
        }))
      } else if (productData) {
        // For existing product configuration
        const existingConfigs = existingMedConfig || []
        const existingConfigsMap = new Map()
        const deletedConfigs = []
        const updatedConfigs = new Set()

        // Create map of existing configurations
        existingConfigs.forEach(config => {
          const key = `${String(config.rack_id)}-${String(config.shelf_id)}`
          existingConfigsMap.set(key, config)
        })

        // Process each location in the form
        data.locations.forEach(loc => {
          const rackId = String(loc.rack_id)
          const shelfId = String(loc.shelf_id)
          const configKey = `${rackId}-${shelfId}`

          // Check if this is an existing config
          const existingConfig = existingConfigsMap.get(configKey)

          if (existingConfig) {
            // If rack_id or shelf_id has changed, it's an edit
            if (existingConfig.rack_id !== Number(rackId) || existingConfig.shelf_id !== Number(shelfId)) {
              // Find the original config by checking all existing configs
              const originalConfig = existingConfigs.find(config => config.config_id === existingConfig.config_id)

              if (originalConfig) {
                payload.push({
                  config_id: originalConfig.config_id,
                  rack_id: Number(rackId),
                  shelf_id: Number(shelfId)
                })
                updatedConfigs.add(originalConfig.config_id)
              }
            }
          } else {
            // Check if this is an update of an existing config
            const isUpdate = existingConfigs.some(config => {
              const isUpdated = config.config_id === loc.config_id
              if (isUpdated) {
                updatedConfigs.add(config.config_id)
              }

              return isUpdated
            })

            if (isUpdate) {
              // This is an update of an existing config
              payload.push({
                config_id: loc.config_id,
                rack_id: Number(rackId),
                shelf_id: Number(shelfId)
              })
            } else {
              // This is a completely new config
              payload.push({
                config_id: null,
                rack_id: Number(rackId),
                shelf_id: Number(shelfId)
              })
            }
          }
        })

        // Find deleted configurations
        existingConfigs.forEach(config => {
          const isInForm = data.locations.some(loc => loc.config_id === config.config_id)

          if (!isInForm && !updatedConfigs.has(config.config_id)) {
            deletedConfigs.push(config.config_id)
          }
        })

        // Add deleted configs to payload if any exist
        if (deletedConfigs.length > 0) {
          payload.push({
            deleted: deletedConfigs
          })
        }
      }

      const response = await addStockItem({ id, payload })
      if (response?.success === true) {
        toast.success(productData ? 'Configuration Updated Successfully' : 'Configuration Added Successfully')
        setDialogCheck(!dialogCheck)
        reset(defaultValues)
        close()
        setProductData(null)
      }
      setSubmitLoader(false)
    } catch (error) {
      console.log(error)
      setSubmitLoader(false)
    }
  }

  const isConfigExists = (rack_id, shelf_id) => {
    if (!rack_id || !shelf_id) return false

    return existingMedConfig.some(
      item => String(item.rack_id) === String(rack_id) && String(item.shelf_id) === String(shelf_id)
    )
  }

  return (
    <>
      <Grid container spacing={2} sx={{
        justifyContent: 'center'
      }}>
        <Grid item size={{ xs: 12, md: 12, sm: 12 }}>
          {isConfigLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <CircularProgress />
            </Box>
          ) : (
            <form component='form' autoComplete='off' sx={{ width: '100%', my: 3 }} onSubmit={handleSubmit(onSubmit)}>
              {/* Product Detail */}
              <Box sx={{ mb: 4 }}>
                <Typography sx={{ color: 'customColors.customTextColorGray2', fontSize: '14px', fontWeight: 700 }}>
                  Product Detail
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth sx={{ mb: 4 }}>
                    <Controller
                      name='stock_id'
                      control={control}
                      render={({ field }) => (
                        <>
                          <Autocomplete
                            forcePopupIcon={false}
                            noOptionsText='Type to search'
                            options={products}
                            value={field.value}
                            disabled={Boolean(productData)}
                            onChange={(event, newValue) => {
                              field.onChange(newValue)
                              if (newValue?.value) {
                                getMedicineConfig({ stockId: newValue.value }) // fetch configs for selected product
                              }
                              setExistingMedConfig([]) // clear previous configs until new fetch completes
                            }}
                            onInputChange={(event, newInputValue) => {
                              if (event && !productData) searchProductData(newInputValue)
                            }}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label='Product Name*'
                                placeholder={productData ? productData.name : 'Search & Select'}
                                error={Boolean(errors.stock_id)}
                              />
                            )}
                            renderOption={(props, option) => (
                              <li
                                {...props}
                                style={{
                                  opacity: option.status ? 1 : 0.5,
                                  pointerEvents: option.status ? 'auto' : 'none'
                                }}
                              >
                                <Box>
                                  <Typography>{option.label}</Typography>
                                  <Typography variant='body2'>
                                    {option.generic_name ? option.generic_name : 'NA'}
                                  </Typography>
                                </Box>
                              </li>
                            )}
                          />
                          {errors.stock_id && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors.stock_id?.message || 'Product Name is required'}
                            </FormHelperText>
                          )}
                        </>
                      )}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              {/* Product Location */}
              <Box sx={{ mb: 2, mt: 4 }}>
                <Typography sx={{ color: 'customColors.customTextColorGray2', fontSize: '14px', fontWeight: 700 }}>
                  Product Location
                </Typography>
              </Box>
              {fields.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 4,
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <Typography sx={{ color: 'text.secondary', mb: 2 }}>No configuration exists</Typography>
                  <Button
                    variant='outlined'
                    startIcon={<Icon icon='mdi:plus' />}
                    onClick={() => {
                      append({ config_id: null, rack_id: '', shelf_id: '' })
                      setDefaultRack(prev => [...prev, null])
                      setDefaultShelf(prev => [...prev, null])
                    }}
                  >
                    Add Configuration
                  </Button>
                </Box>
              ) : (
                fields.map((field, index) => (
                  <Grid
                    container
                    spacing={2}
                    key={field.id}
                    sx={{
                      alignItems: 'flex-start',
                      mb: 0
                    }}>
                    {/* Rack Field */}
                    <Grid item size={{ xs: 12, sm: 5 }}>
                      <FormControl fullWidth sx={{ mb: 6 }}>
                        <Controller
                          name={`locations[${index}].rack_id`}
                          control={control}
                          render={({ field: { field, onChange } }) => (
                            <>
                              <Autocomplete
                                value={defaultRack != null && defaultRack.length > 0 ? defaultRack[index] : null}
                                disablePortal
                                forcePopupIcon={false}
                                id={`locations[${index}].rack_id`}
                                disabled={!stockIdValue}
                                noOptionsText='Type to search'
                                options={racks}
                                getOptionLabel={option => option?.rack_name}
                                isOptionEqualToValue={(option, value) =>
                                  parseInt(option?.rack_id) === parseInt(value?.rack_id)
                                }
                                onChange={(e, val) => {
                                  if (val === null) {
                                    var rack = defaultRack
                                    rack[index] = null
                                    setDefaultRack(rack)

                                    setConfigErrors(prev => {
                                      const newErrors = { ...prev }
                                      delete newErrors[index]

                                      return newErrors
                                    })

                                    return onChange('')
                                  } else {
                                    var rack = defaultRack
                                    rack[index] = { rack_id: val?.rack_id, rack_name: val?.rack_name }
                                    setDefaultRack(prev => {
                                      const newArr = [...prev]
                                      newArr[index] = val ? { rack_id: val.rack_id, rack_name: val.rack_name } : null

                                      return newArr
                                    })
                                    getShelves({ rackId: val?.rack_id })

                                    return onChange(val.rack_id)
                                  }
                                }}
                                renderInput={params => (
                                  <TextField
                                    {...params}
                                    label='Rack*'
                                    placeholder='Search & Select'
                                    error={Boolean(errors?.locations?.[index]?.rack_id)}
                                  />
                                )}
                              />
                              {errors?.locations?.[index]?.rack_id && (
                                <FormHelperText sx={{ color: 'error.main' }}>
                                  {errors?.locations?.[index]?.rack_id?.message}
                                </FormHelperText>
                              )}
                              {configErrors[index] && (
                                <FormHelperText sx={{ color: 'error.main', fontSize: '14px' }}>
                                  {configErrors[index]}
                                </FormHelperText>
                              )}
                            </>
                          )}
                        />
                      </FormControl>
                    </Grid>

                    {/* Shelf Field */}
                    <Grid item size={{ xs: 12, sm: 5 }}>
                      <FormControl fullWidth sx={{ mb: 4 }}>
                        <Controller
                          name={`locations[${index}].shelf_id`}
                          control={control}
                          render={({ field: { field, onChange } }) => (
                            <>
                              <Autocomplete
                                value={defaultShelf != null && defaultShelf.length > 0 ? defaultShelf[index] : null}
                                disablePortal
                                disabled={!stockIdValue}
                                forcePopupIcon={false}
                                id={`locations[${index}].shelf_id`}
                                noOptionsText='Type to search'
                                options={shelves.filter(option => {
                                  const selectedShelfIds = defaultShelf.map(shelf => shelf?.shelf_id)

                                  return !selectedShelfIds.includes(option.shelf_id)
                                })}
                                getOptionLabel={option => option?.shelf_name}
                                isOptionEqualToValue={(option, value) =>
                                  parseInt(option?.shelf_id) === parseInt(value?.shelf_id)
                                }
                                onChange={(e, val) => {
                                  if (val === null) {
                                    var shelf = defaultShelf
                                    shelf[index] = null
                                    setDefaultShelf(shelf)

                                    setConfigErrors(prev => {
                                      const newErrors = { ...prev }
                                      delete newErrors[index]

                                      return newErrors
                                    })

                                    return onChange('')
                                  } else {
                                    var shelf = defaultShelf
                                    shelf[index] = { shelf_id: val?.shelf_id, shelf_name: val?.shelf_name }
                                    setDefaultShelf(prev => {
                                      const newArr = [...prev]
                                      newArr[index] = val
                                        ? { shelf_id: val.shelf_id, shelf_name: val.shelf_name }
                                        : null

                                      return newArr
                                    })

                                    // Get the rack_id for this index
                                    const rack_id = defaultRack[index]?.rack_id
                                    const shelf_id = val.shelf_id

                                    if (!productData && isConfigExists(rack_id, shelf_id)) {
                                      setConfigErrors(prev => ({
                                        ...prev,
                                        [index]: 'This rack and shelf config already exists'
                                      }))
                                    } else {
                                      setConfigErrors(prev => ({ ...prev, [index]: null }))
                                    }

                                    return onChange(val.shelf_id)
                                  }
                                }}
                                renderInput={params => (
                                  <TextField
                                    {...params}
                                    label='Shelf*'
                                    placeholder='Search & Select'
                                    error={Boolean(errors?.locations?.[index]?.shelf_id)}
                                  />
                                )}
                              />
                              {errors?.locations?.[index]?.shelf_id && (
                                <FormHelperText sx={{ color: 'error.main' }}>
                                  {errors?.locations?.[index]?.shelf_id?.message}
                                </FormHelperText>
                              )}
                            </>
                          )}
                        />
                      </FormControl>
                    </Grid>
                    <Grid
                      item
                      size={{ xs: 12, sm: 2 }}
                      sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'flex-start',
                        height: '100%',
                        mt: 0
                      }}
                    >
                      {index === fields.length - 1 && (
                        <IconButton
                          color='success'
                          onClick={() => {
                            append({ config_id: null, rack_id: '', shelf_id: '' })
                            setDefaultRack(prev => [...prev, null])
                            setDefaultShelf(prev => [...prev, null])
                          }}
                          disabled={!defaultRack[index] || !defaultShelf[index]}
                          sx={{ height: '50px', width: '50px', borderRadius: '50%' }}
                        >
                          <Icon icon='mdi:add' fontSize={22} />
                        </IconButton>
                      )}

                      <IconButton
                        color='error'
                        onClick={() => {
                          remove(index)
                          setDefaultRack(prev => prev.filter((_, i) => i !== index))
                          setDefaultShelf(prev => prev.filter((_, i) => i !== index))

                          setConfigErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors[index]
                            const updatedErrors = {}
                            Object.entries(newErrors).forEach(([key, val]) => {
                              const keyNum = Number(key)
                              updatedErrors[keyNum > index ? keyNum - 1 : keyNum] = val
                            })

                            return updatedErrors
                          })
                        }}
                        sx={{ height: '50px', width: '50px', borderRadius: '50%' }}
                      >
                        <Icon icon='mdi:delete' fontSize={22} />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))
              )}

              <Divider sx={{ my: 4 }} />
              <Grid
                container
                spacing={2}
                sx={{
                  justifyContent: 'flex-end',
                  mt: 2
                }}>
                <Grid item size={{ xs: 12, sm: 'auto' }}>
                  <Box>
                    <Button
                      variant='outlined'
                      size='large'
                      onClick={() => {
                        reset()
                        close()
                        setProductData(null)
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, sm: 'auto' }}>
                  <Button
                    variant='contained'
                    color='primary'
                    type='submit'
                    size='large'
                    fullWidth
                    disabled={submitLoader || Object.values(configErrors).some(Boolean)}
                  >
                    {submitLoader ? <CircularProgress size={24} /> : productData === null ? 'Save' : 'Update'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          )}
        </Grid>
      </Grid>
    </>
  );
}

export default AddMedicineDialog
