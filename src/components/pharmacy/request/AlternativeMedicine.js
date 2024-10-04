import React from 'react'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import FormHelperText from '@mui/material/FormHelperText'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import Autocomplete from '@mui/material/Autocomplete'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import { LoadingButton } from '@mui/lab'
import toast from 'react-hot-toast'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import { Button, Tooltip } from '@mui/material'
import { CardContent, Card } from '@mui/material'
import Divider from '@mui/material/Divider'

// ** React Imports
import { useState, useEffect, useCallback } from 'react'
import { debounce } from 'lodash'

import { getMedicineList, getGenericMedicineList } from 'src/lib/api/pharmacy/getMedicineList'

import { addAlternativeMedicine } from 'src/lib/api/pharmacy/getRequestItemsList'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { AddButton, RequestCancelButton } from 'src/components/Buttons'

function AlternativeMedicine({ parentId, updateRequestItems, existingListItems, closeAlternativeMedicineDialog }) {
  const initialNestedRowMedicine = {
    request_item_medicine_id: '',
    medicine_name: '',
    request_item_qty: '',
    request_item_leaf_id: '',
    priority_item: 'Normal',
    control_substance: false,
    control_substance_file: '',
    prescription_required: false,
    prescription_required_file: '',
    package: '',
    manufacture: '',
    unit_price: '',
    genericName: '',
    alternate_comments: '',
    request_alt_parent_id: parentId?.request_item_id,
    availAbleQty: ''
  }
  const [optionsMedicineList, setOptionsMedicineList] = useState([])
  const [nestedRowMedicine, setNestedRowMedicine] = useState(initialNestedRowMedicine)
  const [itemErrors, setItemErrors] = useState({})
  const [duplicateMedError, setDuplicateMedError] = useState('')
  const [submitLoader, setSubmitLoader] = useState(false)
  const [tabStatus, setTabStatus] = useState('By product')
  const [existingMedicinesList, setExistingMedicinesList] = useState([])

  const validate = values => {
    const itemErrors = {}
    if (!values.medicine_name || values.medicine_name === '') {
      itemErrors.medicine_name = 'This field is required'
    }
    if (!values.request_item_qty) {
      itemErrors.request_item_qty = 'This field is required'
    }

    if (!values.request_item_qty) {
      itemErrors.request_item_qty = 'This field is required'
    }

    if (Number.isInteger(nestedRowMedicine.request_item_qty) || Number(values.request_item_qty) <= 0) {
      itemErrors.request_item_qty = 'Enter valid Quantity'
    }

    if (!values.priority_item) {
      itemErrors.priority_item = 'This field is required'
    }

    if (values.prescription_required === true) {
      if (values.prescription_required_file.length === 0) {
        itemErrors.prescription_required_file = 'This field is required'
      }
    }

    return itemErrors
  }

  const getOptionStyle = options => {
    const sameMedicine = existingMedicinesList.find(item => item.stock_item_id === options)

    return sameMedicine ? true : false
  }

  //  ****** debounce
  const fetchMedicineData = async searchText => {
    try {
      const params = {
        sort: 'asc',
        q: searchText,
        limit: 20,
        active: true
      }

      const searchResults = await getMedicineList({ params: params })
      if (searchResults?.data?.list_items.length > 0) {
        let optionMedListFromApi = searchResults?.data?.list_items?.map(item => ({
          value: item.id,
          name: item.name,
          package: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
          label: `${item.name} (${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}) `,
          manufacture: item.manufacturer_name,
          control_substance: item.controlled_substance === '1' ? true : false,
          status: item?.active === '0' ? 0 : 1,
          prescription_required: item?.prescription_required === '1' ? true : false,
          unit_price: item?.unit_price ? item?.unit_price : 0,
          genericName: item?.generic_name,
          availAbleQty: item?.available_qty
        }))
        setOptionsMedicineList(optionMedListFromApi)
        setItemErrors({})
      }
    } catch (e) {
      console.log('error', e)
    }
  }

  const searchMedicineData = useCallback(
    debounce(async searchText => {
      try {
        await fetchMedicineData(searchText)
      } catch (error) {
        console.error(error)
      }
    }, 500),
    []
  )

  const fetchGenericMedicineData = async searchText => {
    try {
      const params = {
        sort: 'asc',
        q: '',
        limit: 20,
        active: true,
        generic: searchText
      }

      const searchResults = await getGenericMedicineList({ params: params })
      if (searchResults?.data?.list_items.length > 0) {
        setOptionsMedicineList(
          searchResults?.data?.list_items?.map(item => ({
            value: item.id,
            genericName: item?.generic_name,
            name: item?.name,
            package: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
            label: `${item.name} (${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}) `,
            manufacture: item.manufacturer_name,
            control_substance: item.controlled_substance === '1' ? true : false,
            status: item?.active === '0' ? 0 : 1,
            prescription_required: item?.prescription_required === '1' ? true : false,
            unit_price: item?.unit_price ? item?.unit_price : 0,
            availAbleQty: item?.available_qty
          }))
        )
        setItemErrors({})
      }
    } catch (e) {
      console.log('error', e)
    }
  }

  const searchGenericMedicineData = useCallback(
    debounce(async searchText => {
      try {
        await fetchGenericMedicineData(searchText)
      } catch (error) {
        console.error(error)
      }
    }, 500),
    []
  )
  useEffect(() => {
    let requestItemsArray = []

    existingListItems?.request_item_details.forEach(item => {
      requestItemsArray.push({
        id: item.id,
        stock_item_id: item.stock_item_id
      })

      if (item?.alt_parent && item?.alt_parent?.length > 0) {
        item.alt_parent.forEach(altItem => {
          requestItemsArray.push({
            id: altItem.id,
            stock_item_id: altItem.stock_item_id
          })
        })
      }
    })

    console.log('exixting', requestItemsArray)
    setExistingMedicinesList(requestItemsArray)
    fetchMedicineData('')
  }, [])

  //  ****** debounce
  const submitItems = () => {
    const HasErrors =
      !nestedRowMedicine.medicine_name ||
      !nestedRowMedicine.request_item_qty ||
      !nestedRowMedicine.priority_item ||
      !Number.isInteger(Number(nestedRowMedicine.request_item_qty)) ||
      Number(nestedRowMedicine.request_item_qty) === 0 ||
      Number(nestedRowMedicine.request_item_qty) < 0

    if (HasErrors) {
      setItemErrors(validate(nestedRowMedicine))

      return
    }

    if (nestedRowMedicine.prescription_required === true) {
      if (nestedRowMedicine.prescription_required_file.length === 0) {
        setItemErrors(validate(nestedRowMedicine))

        return
      }
    }

    setItemErrors({})
    postItemsData()
  }

  const postItemsData = async () => {
    setSubmitLoader(true)
    if (parentId) {
      try {
        const response = await addAlternativeMedicine(nestedRowMedicine, parentId?.parentEndPointId)
        if (response?.success) {
          toast.success(response?.message)
          setNestedRowMedicine(initialNestedRowMedicine)
          setSubmitLoader(false)
          updateRequestItems()

          // Router.push(`/pharmacy/request/${response?.data}`)
        } else {
          setSubmitLoader(false)
          toast.error(response?.message)
        }
      } catch (error) {
        setSubmitLoader(false)

        console.log('error', error)
      }
    }
  }

  return (
    <form style={{ width: '650px' }}>
      <Divider sx={{ mt: -6 }} />
      <Typography sx={{ my: 4, fontSize: '16px', fontWeight: '500' }}>Requested Medicine</Typography>
      <Card
        sx={{
          mb: 10,
          width: '100%',
          backgroundColor: 'customColors.lightBg',
          border: '1px solid #00D6C9'
        }}
      >
        <CardContent>
          <Grid container spacing={2}>
            <Grid
              item
              xs={12}
              sx={{ display: 'flex', flexDirection: 'column', backgroundColor: 'customColors.lightBg' }}
            >
              <Typography sx={{ color: 'customColors.textLabel' }}>
                Product Name: <strong>{parentId?.product}</strong>
              </Typography>
              <Typography>
                Quantity requested: <strong>{parentId?.qty_requested}</strong>
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Divider />

      <Grid sx={{ my: 6 }} xs={12}>
        <Grid item sx={{ display: 'flex', justifyItems: 'center', justifyContent: 'center', gap: 4 }} xs={12} sm={12}>
          <Typography
            variant='button' // Use the button variant for styling
            onClick={() => setTabStatus('By product')}
            sx={{
              cursor: 'pointer',
              borderBottom: tabStatus === 'By product' ? '5px solid' : '',
              color: 'primary.main', // Ensure this matches your button's color
              padding: '8px 16px' // Match the button padding
            }}
          >
            By Product Name
          </Typography>
          <Typography
            variant='button' // Use the button variant for styling
            onClick={() => setTabStatus('By generic')}
            sx={{
              cursor: 'pointer',
              borderBottom: tabStatus === 'By generic' ? '5px solid' : '',
              color: 'primary.main', // Ensure this matches your button's color
              padding: '8px 16px' // Match the button padding
            }}
          >
            By Generic Name
          </Typography>
        </Grid>
      </Grid>
      <Grid container sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} item xs={12}>
        {tabStatus === 'By product' ? (
          <Grid item xs={12} sm={12}>
            <FormControl fullWidth>
              <Autocomplete
                id='autocomplete-controlled'
                options={optionsMedicineList}
                renderOption={(props, option) => (
                  <li
                    {...props}
                    style={{
                      opacity: getOptionStyle(option.value) === false ? 1 : 0.5,

                      pointerEvents: getOptionStyle(option.value) === false ? 'auto' : 'none'
                    }}
                  >
                    <Box>
                      <Typography>{option.name}</Typography>
                      <Typography variant='body2'>{option.package}</Typography>
                      <Typography variant='body2'>{option.manufacture}</Typography>
                    </Box>
                  </li>
                )}
                value={nestedRowMedicine.medicine_name ? nestedRowMedicine.medicine_name : ''}
                onChange={(event, newValue) => {
                  setNestedRowMedicine({
                    ...nestedRowMedicine,
                    medicine_name: newValue?.name,
                    request_item_medicine_id: newValue?.value,
                    control_substance: newValue?.control_substance,
                    prescription_required: newValue?.prescription_required,
                    package: newValue?.package,
                    manufacture: newValue?.manufacture,
                    genericName: newValue?.genericName,
                    unit_price: newValue?.unit_price,
                    availAbleQty: newValue?.availAbleQty
                  })
                  setDuplicateMedError('')
                  setItemErrors({})
                }}
                onKeyUp={e => {
                  searchMedicineData(e.target.value)
                  setItemErrors({})
                }}
                onBlur={() => {
                  fetchMedicineData('')
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder='Search by product name'
                    label='Search by Product Name*'
                    error={Boolean(itemErrors.medicine_name)}
                  />
                )}
              />
              {/* {nestedRowMedicine.medicine_name && (
                <Grid container item sx={{ my: 2 }}>
                  <Tooltip title={nestedRowMedicine.package}>
                    <Chip
                      label={nestedRowMedicine.package}
                      color='primary'
                      variant='outlined'
                      size='sm'
                      sx={{ mr: 2, fontSize: 11, height: '22px', width: 'full' }}
                    />
                  </Tooltip>

                  <Tooltip title={nestedRowMedicine.manufacture}>
                    <Chip
                      label={nestedRowMedicine.manufacture}
                      color='primary'
                      variant='outlined'
                      size='sm'
                      sx={{ mr: 2, fontSize: 11, height: '22px', width: 'full' }}
                    />
                  </Tooltip>
                </Grid>
              )} */}
              {itemErrors.medicine_name && (
                <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                  This field is required
                </FormHelperText>
              )}
              {duplicateMedError && (
                <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                  {duplicateMedError}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
        ) : (
          <Grid item xs={12} sm={12}>
            <FormControl fullWidth>
              <Autocomplete
                id='autocomplete-controlled'
                options={optionsMedicineList}
                renderOption={(props, option) => (
                  <li
                    {...props}
                    style={{
                      opacity: getOptionStyle(option.value) === false ? 1 : 0.5,

                      pointerEvents: getOptionStyle(option.value) === false ? 'auto' : 'none'
                    }}
                  >
                    <Box>
                      <Typography>{option.genericName ? option.genericName : 'Generic name not available'}</Typography>
                      <Typography variant='body2'>{`Product - ${option.name}`}</Typography>

                      <Typography variant='body2'>{option.package}</Typography>
                      <Typography variant='body2'>{option.manufacture}</Typography>
                    </Box>
                  </li>
                )}
                value={nestedRowMedicine.genericName ? nestedRowMedicine.genericName : ''}
                onChange={(event, newValue) => {
                  setNestedRowMedicine({
                    ...nestedRowMedicine,
                    medicine_name: newValue?.name,
                    request_item_medicine_id: newValue?.value,
                    control_substance: newValue?.control_substance,
                    prescription_required: newValue?.prescription_required,
                    package: newValue?.package,
                    manufacture: newValue?.manufacture,
                    unit_price: newValue?.unit_price,
                    genericName: newValue?.genericName,
                    availAbleQty: newValue?.availAbleQty
                  })
                  setDuplicateMedError('')
                  setItemErrors({})
                }}
                onKeyUp={e => {
                  searchGenericMedicineData(e.target.value)

                  setItemErrors({})
                }}
                onBlur={() => {}}
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder='Search by Generic name'
                    label='Search by Generic Name*'
                    error={Boolean(itemErrors.medicine_name)}
                  />
                )}
                isOptionEqualToValue={(option, value) => {
                  return option?.genericName === value
                }}
                getOptionLabel={option => {
                  return option?.genericName || nestedRowMedicine?.genericName || ''
                }}
              />
              {/* {nestedRowMedicine.medicine_name && (
                <Grid container item sx={{ my: 2 }}>
                  <Tooltip title={nestedRowMedicine.package}>
                    <Chip
                      label={nestedRowMedicine.package}
                      color='primary'
                      variant='outlined'
                      size='sm'
                      sx={{ mr: 2, fontSize: 11, height: '22px', width: 'full' }}
                    />
                  </Tooltip>

                  <Tooltip title={nestedRowMedicine.manufacture}>
                    <Chip
                      label={nestedRowMedicine.manufacture}
                      color='primary'
                      variant='outlined'
                      size='sm'
                      sx={{ mr: 2, fontSize: 11, height: '22px', width: 'full' }}
                    />
                  </Tooltip>
                </Grid>
              )} */}
              {itemErrors.medicine_name && (
                <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                  This field is required
                </FormHelperText>
              )}
              {duplicateMedError && (
                <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                  {duplicateMedError}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
        )}
        {nestedRowMedicine?.medicine_name && (
          <Box
            sx={{
              backgroundColor: '#F2FFF8', // Light green background
              padding: '16px',
              borderRadius: '8px',
              marginTop: '5px',
              border: '0.5px solid #37BD69',
              borderRadius: '8px'
            }}
          >
            <Typography sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px', mb: 1 }}>
              Available Packing:{' '}
              <span style={{ fontWeight: 400, fontSize: '12px', color: '#1F515B' }}>{nestedRowMedicine?.package}</span>
            </Typography>
            <Typography sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px', mb: 1 }}>
              Manufactured by:{' '}
              <span style={{ fontWeight: 400, fontSize: '12px', color: '#1F515B' }}>
                {nestedRowMedicine?.manufacture}
              </span>
            </Typography>
            {nestedRowMedicine?.availAbleQty && (
              <Typography sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px' }}>
                Availability:{' '}
                <span style={{ fontWeight: 400, fontSize: '12px', color: '#1F515B' }}>
                  {nestedRowMedicine?.availAbleQty}
                </span>
              </Typography>
            )}
          </Box>
        )}

        <Grid item xs={12} sm={12} sx={{ mt: 3 }}>
          <FormControl fullWidth>
            <TextField
              type='number'
              value={nestedRowMedicine.request_item_qty}
              error={Boolean(itemErrors.request_item_qty)}
              label='Quantity*'
              onChange={event => {
                setNestedRowMedicine({ ...nestedRowMedicine, request_item_qty: event.target.value })
                setItemErrors({})
              }}
            />
            {itemErrors?.request_item_qty && (
              <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                {/* This field is required */}
                {itemErrors?.request_item_qty}
              </FormHelperText>
            )}

            {nestedRowMedicine.unit_price > 0 ? (
              <Box sx={{ mx: 1, my: 2, display: 'flex', gap: 2 }}>
                <Chip
                  label={`Unit Price - ${nestedRowMedicine.unit_price}`}
                  color='primary'
                  variant='outlined'
                  size='sm'
                  sx={{ mr: 2, fontSize: 12, height: '32px', borderRadius: '16px' }}
                />
                <Chip
                  label={`Total Quantity Price - ${nestedRowMedicine.unit_price * nestedRowMedicine.request_item_qty}`}
                  color='primary'
                  variant='outlined'
                  size='sm'
                  sx={{ mr: 2, fontSize: 12, height: '32px', borderRadius: '16px' }}
                />
              </Box>
            ) : null}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={1}></Grid>
        <Grid item xs={12} sm={12}>
          <FormControl fullWidth>
            <TextField
              type='text'
              value={nestedRowMedicine.alternate_comments}
              error={Boolean(itemErrors.alternate_comments)}
              label='Alternate comments'
              onChange={event => {
                setNestedRowMedicine({ ...nestedRowMedicine, alternate_comments: event.target.value })
                setItemErrors({})
              }}
            />
            {itemErrors?.alternate_comments && (
              <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                {/* This field is required */}
                {itemErrors?.alternate_comments}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={12}>
          <Typography>Priority</Typography>
          <RadioGroup
            row
            aria-label='controlled'
            name='controlled'
            value={nestedRowMedicine?.priority_item}
            onChange={event => {
              setNestedRowMedicine({ ...nestedRowMedicine, priority_item: event.target.value })
            }}
          >
            <FormControlLabel value='high' control={<Radio />} label='High' />
            <FormControlLabel value='Normal' control={<Radio />} label='Normal' />
          </RadioGroup>
        </Grid>

        {/* // file uploader */}
        {/* <Grid item xs={12} sm={1}></Grid> */}

        {nestedRowMedicine.control_substance === true ? (
          nestedRowMedicine.control_substance_file ? (
            <Grid item xs={12} sm={12}>
              {nestedRowMedicine.control_substance_file?.type === 'application/pdf' ? (
                <Chip
                  label={nestedRowMedicine.control_substance_file?.name}
                  color='secondary'
                  onDelete={() => {
                    setNestedRowMedicine({
                      ...nestedRowMedicine,

                      // control_substance: false,
                      control_substance_file: ''
                    })
                  }}
                  deleteIcon={<Icon icon='mdi:delete-outline' />}
                />
              ) : nestedRowMedicine.control_substance_file?.type === 'image/png' ||
                nestedRowMedicine.control_substance_file?.type === 'image/jpeg' ? (
                <>
                  <Chip
                    label={nestedRowMedicine.control_substance_file?.name}
                    avatar={
                      <Avatar
                        alt={nestedRowMedicine.control_substance_file?.name}
                        src={
                          nestedRowMedicine.control_substance_file
                            ? URL.createObjectURL(nestedRowMedicine.control_substance_file)
                            : ''
                        }
                      />
                    }
                    onDelete={() => {
                      setNestedRowMedicine({
                        ...nestedRowMedicine,

                        // control_substance: false,
                        control_substance_file: ''
                      })
                    }}
                  />
                </>
              ) : (
                <Chip
                  label={nestedRowMedicine.control_substance_file}
                  avatar={<Avatar alt='image' src={nestedRowMedicine?.control_substance_file} />}
                  onDelete={() => {
                    setNestedRowMedicine({
                      ...nestedRowMedicine,

                      // control_substance: false,
                      control_substance_file: ''
                    })
                  }}
                />
              )}
            </Grid>
          ) : (
            <Grid item xs={12} sm={12}>
              <Typography sx={{ mb: 2 }}>Attach details (Mandatory for controlled substances)</Typography>
              <FormControl fullWidth>
                <TextField
                  type='file'
                  accept='.pdf, .jpeg, .jpg, .png'
                  error={Boolean(itemErrors.control_substance_file)}
                  onChange={e => {
                    // const file = e.target.files[0]
                    // setNestedRowMedicine({ ...nestedRowMedicine, control_substance_file: file })
                    // setItemErrors({})
                    const file = e.target.files[0]
                    if (!file) return
                    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
                    if (allowedTypes.includes(file.type)) {
                      setNestedRowMedicine(prevState => ({
                        ...prevState,
                        control_substance_file: file
                      }))
                      setItemErrors({})
                    } else {
                      setItemErrors({
                        control_substance_file: 'File type not allowed. Please upload a PDF, JPEG, or PNG.'
                      })
                      e.target.value = ''
                    }
                  }}
                />
                {itemErrors?.control_substance_file && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    {itemErrors?.control_substance_file}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
          )
        ) : null}
        {nestedRowMedicine.prescription_required === true ? (
          nestedRowMedicine.prescription_required_file ? (
            <Grid item xs={12} sm={12}>
              {nestedRowMedicine.prescription_required_file?.type === 'application/pdf' ? (
                <Chip
                  label={nestedRowMedicine.prescription_required_file?.name}
                  color='secondary'
                  onDelete={() => {
                    setNestedRowMedicine({
                      ...nestedRowMedicine,

                      // control_substance: false,
                      prescription_required_file: ''
                    })
                  }}
                  deleteIcon={<Icon icon='mdi:delete-outline' />}
                />
              ) : nestedRowMedicine.prescription_required_file?.type === 'image/png' ||
                nestedRowMedicine.prescription_required_file?.type === 'image/jpeg' ? (
                <>
                  <Chip
                    label={nestedRowMedicine.prescription_required_file?.name}
                    avatar={
                      <Avatar
                        alt={nestedRowMedicine.prescription_required_file?.name}
                        src={
                          nestedRowMedicine.prescription_required_file
                            ? URL.createObjectURL(nestedRowMedicine.prescription_required_file)
                            : ''
                        }
                      />
                    }
                    onDelete={() => {
                      setNestedRowMedicine({
                        ...nestedRowMedicine,

                        // control_substance: false,
                        prescription_required_file: ''
                      })
                    }}
                  />
                </>
              ) : (
                <Chip
                  label={nestedRowMedicine.prescription_required_file}
                  avatar={<Avatar alt='image' src={nestedRowMedicine.prescription_required_file} />}
                  onDelete={() => {
                    setNestedRowMedicine({
                      ...nestedRowMedicine,

                      // control_substance: false,
                      prescription_required_file: ''
                    })
                  }}
                />
              )}
            </Grid>
          ) : (
            <Grid item xs={12} sm={12}>
              <Typography sx={{ mb: 2 }}>Attach prescription </Typography>
              <FormControl fullWidth>
                <TextField
                  type='file'
                  accept='.pdf, .jpeg, .jpg, .png'
                  error={Boolean(itemErrors.prescription_required_file)}
                  onChange={e => {
                    const file = e.target.files[0]
                    if (!file) return
                    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
                    if (allowedTypes.includes(file.type)) {
                      setNestedRowMedicine(prevState => ({
                        ...prevState,
                        prescription_required_file: file
                      }))
                      setItemErrors({})
                    } else {
                      setItemErrors({
                        prescription_required_file: 'File type not allowed. Please upload a PDF, JPEG, or PNG.'
                      })
                      e.target.value = ''
                    }
                  }}
                />
                {itemErrors?.prescription_required_file && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    {itemErrors?.prescription_required_file}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
          )
        ) : null}
      </Grid>
      <Grid sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <LoadingButton
          sx={{ my: 6 }} // Flex property ensures both buttons are of equal width
          size='large'
          onClick={() => {
            closeAlternativeMedicineDialog()
          }}
          variant='outlined'
        >
          Cancel
        </LoadingButton>
        <LoadingButton
          sx={{ my: 6, width: '100px' }} // Flex property ensures both buttons are of equal width
          size='large'
          onClick={() => {
            submitItems()
          }}
          variant='contained'
          loading={submitLoader}
        >
          Add
        </LoadingButton>
      </Grid>
    </form>
  )
}

export default AlternativeMedicine
