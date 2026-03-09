/* eslint-disable lines-around-comment */
import React from 'react'
import { Grid, Typography, Box, Chip, CardContent, Card, Button } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import toast from 'react-hot-toast'
import Divider from '@mui/material/Divider'

// ** React Imports
import { useState, useEffect, useCallback } from 'react'
import { debounce } from 'lodash'

// ** React Hook Form + Yup
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import { getMedicineList, getGenericMedicineList } from 'src/lib/api/pharmacy/getMedicineList'
import { addAlternativeMedicine } from 'src/lib/api/pharmacy/getRequestItemsList'

import RenderUtility from 'src/utility/render'
import { useTheme } from '@emotion/react'
import Utility from 'src/utility'

// ** Controlled Components
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledFileUpload from 'src/views/forms/form-fields/ControlledFileUpload'

// Validation Schema
const schema = yup.object().shape({
  medicine: yup.object().nullable().required('Please select a product'),
  quantity: yup
    .number()
    .typeError('Quantity is required')
    .positive('Quantity must be greater than 0')
    .integer('Quantity must be a whole number')
    .required('Quantity is required'),
  priority: yup.string().required('Please select priority'),
  prescription_file: yup.mixed().when(['control_substance', 'prescription_required'], {
    is: (cs, pr) => cs || pr,
    then: s => s.required('Prescription is required'),
    otherwise: s => s.nullable()
  }),
  alternate_comments: yup.string().nullable(),
  control_substance: yup.boolean(),
  prescription_required: yup.boolean()
})

const defaultValues = {
  medicine: null,
  quantity: '',
  priority: 'Normal',
  prescription_file: null,
  alternate_comments: '',
  control_substance: false,
  prescription_required: false
}

function AlternativeMedicine({ parentId, updateRequestItems, existingListItems, closeAlternativeMedicineDialog }) {
  const theme = useTheme()

  const [optionsMedicineList, setOptionsMedicineList] = useState([])
  const [optionsGenericMedicineList, setOptionsGenericMedicineList] = useState([])
  const [submitLoader, setSubmitLoader] = useState(false)
  const [tabStatus, setTabStatus] = useState('By product')
  const [existingMedicinesList, setExistingMedicinesList] = useState([])

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(schema)
  })

  // Watch values for conditional rendering
  const selectedMedicine = watch('medicine')
  const quantity = watch('quantity')
  const priority = watch('priority')
  const controlSubstance = watch('control_substance')
  const prescriptionRequired = watch('prescription_required')

  const getOptionStyle = option => {
    const sameMedicine = existingMedicinesList.find(item => item.stock_item_id === option.value)

    return sameMedicine || Number(option?.availAbleQty) === 0
  }

  const fetchMedicineData = async searchText => {
    try {
      const params = {
        sort: 'asc',
        q: searchText,
        limit: 20,
        active: true,
        is_specific: 1
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
          prescription_required:
            item?.controlled_substance === '1' ? true : item?.prescription_required === '1' ? true : false,
          unit_price: item?.unit_price ? item?.unit_price : 0,
          genericName: item?.generic_name,
          availAbleQty: item?.available_qty
        }))
        setOptionsMedicineList(optionMedListFromApi)
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
        const medicalProducts = searchResults?.data?.list_items?.filter(el => el.stock_type != 'Non Medical')
        setOptionsGenericMedicineList(
          medicalProducts?.map(item => ({
            value: item.id,
            genericName: item?.generic_name,
            name: item?.name,
            package: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
            label: `${item.name} (${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}) `,
            manufacture: item.manufacturer_name,
            control_substance: item.controlled_substance === '1' ? true : false,
            status: item?.active === '0' ? 0 : 1,
            prescription_required:
              item?.controlled_substance === '1' ? true : item?.prescription_required === '1' ? true : false,
            unit_price: item?.unit_price ? item?.unit_price : 0
          }))
        )
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

    setExistingMedicinesList(requestItemsArray)
    fetchMedicineData('')
    fetchGenericMedicineData('')
  }, [])

  // Handle medicine selection
  const handleMedicineChange = newValue => {
    setValue('control_substance', newValue?.control_substance || false)
    setValue('prescription_required', newValue?.prescription_required || false)
  }

  // Render medicine option with duplicate/unavailable styling
  const renderMedicineOption = (props, option) => {
    const { key, ...otherProps } = props

    return (
      <li
        key={`${option?.value || ''}-${option?.name || option?.genericName}-${option?.package}-${option?.manufacture}`}
        {...otherProps}
        style={{
          opacity: getOptionStyle(option) ? 0.5 : 1,
          pointerEvents: getOptionStyle(option) ? 'none' : 'auto'
        }}
      >
        <Box>
          <Typography>{tabStatus === 'By product' ? option?.name : option?.genericName}</Typography>
          {tabStatus === 'By generic' && <Typography variant='body2'>{`Product - ${option?.name}`}</Typography>}
          <Typography variant='body2'>{option?.package}</Typography>
          <Typography variant='body2'>{option?.manufacture}</Typography>
          {RenderUtility?.renderControlLabel(option?.control_substance === true, 'CS')}
          {RenderUtility?.renderPrescriptionLabel(option?.prescription_required === true, 'PR')}
        </Box>
      </li>
    )
  }

  // Priority button styles
  const getPriorityButtonStyle = (priorityValue, activeColor, borderColor) => ({
    width: { xs: '100%', sm: '192px' },
    height: '46px',
    borderRadius: '8px',
    boxShadow: 'none',
    backgroundColor: priority === priorityValue ? `${activeColor}30` : 'white',
    border:
      priority === priorityValue
        ? `1px solid ${borderColor}`
        : `1.5px solid ${theme.palette.customColors.OutlineVariant}60 !important`,
    '&:hover': {
      backgroundColor: priority === priorityValue ? `${activeColor}30 !important` : 'transparent !important'
    }
  })

  // Form submission
  const handleFormSubmit = async data => {
    // Duplicate check
    if (existingMedicinesList.find(item => item.stock_item_id === data.medicine?.value)) {
      setError('medicine', { type: 'manual', message: 'This medicine already exists' })

      return
    }

    setSubmitLoader(true)

    const file = data.prescription_file

    const payload = {
      request_item_medicine_id: data.medicine?.value,
      medicine_name: data.medicine?.name,
      request_item_qty: data.quantity,
      request_item_leaf_id: '',
      priority_item: data.priority,
      control_substance: data.control_substance,
      control_substance_file: '',
      prescription_required: data.prescription_required,
      prescription_required_file: file instanceof File ? file : file?.file_path || '',
      prescription_required_filename: file instanceof File ? file.name : file?.file_original_name || '',
      package: data.medicine?.package,
      manufacture: data.medicine?.manufacture,
      unit_price: data.medicine?.unit_price,
      genericName: data.medicine?.genericName,
      alternate_comments: data.alternate_comments || '',
      request_alt_parent_id: parentId?.request_item_id,
      availAbleQty: data.medicine?.availAbleQty || ''
    }

    if (parentId) {
      try {
        const response = await addAlternativeMedicine(payload, parentId?.parentEndPointId)
        if (response?.success) {
          toast.success(response?.message)
          setSubmitLoader(false)
          updateRequestItems()
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
    <Box
      component='form'
      onSubmit={handleSubmit(handleFormSubmit)}
      sx={{
        width: { xs: '100%', sm: '500px', md: '650px' }
      }}
    >
      <Divider sx={{ mt: -6 }} />
      <Typography sx={{ my: 4, fontSize: '16px', fontWeight: '500' }}>Requested Medicine</Typography>
      <Card
        sx={{
          mb: 10,
          width: '100%',
          backgroundColor: 'customColors.Surface',
          border: `0.5px solid ${theme.palette.customColors.Secondary}`,
          boxShadow: 'none !important'
        }}
      >
        <CardContent>
          <Grid container spacing={2}>
            <Grid
              item
              size={{ xs: 12 }}
              sx={{ display: 'flex', flexDirection: 'column', backgroundColor: 'customColors.Surface' }}
            >
              <Typography sx={{ color: 'customColors.SecondaryDark' }}>
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

      {/* Tab Switch */}
      <Grid sx={{ my: 6 }} size={{ xs: 12 }}>
        <Grid
          item
          sx={{ display: 'flex', justifyItems: 'center', justifyContent: 'center', gap: 4 }}
          size={{ xs: 12, sm: 12 }}
        >
          <Typography
            variant='button'
            onClick={() => setTabStatus('By product')}
            sx={{
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: tabStatus === 'By product' ? '5px solid' : '',
              color: tabStatus === 'By product' ? 'primary.main' : 'customColors.OnSurfaceVariant',
              padding: '8px 16px'
            }}
          >
            By Product Name
          </Typography>
          <Typography
            variant='button'
            onClick={() => setTabStatus('By generic')}
            sx={{
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: tabStatus === 'By generic' ? '5px solid' : '',
              color: tabStatus === 'By generic' ? 'primary.main' : 'customColors.OnSurfaceVariant',
              padding: '8px 16px'
            }}
          >
            By Generic Name
          </Typography>
        </Grid>
      </Grid>

      <Grid container sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} item size={{ xs: 12 }}>
        {/* Medicine Search */}
        <Grid item size={{ xs: 12, sm: 12 }}>
          <ControlledAutocomplete
            key={tabStatus}
            name='medicine'
            control={control}
            label={tabStatus === 'By product' ? 'Search by Product Name*' : 'Search by Generic Name*'}
            options={tabStatus === 'By product' ? optionsMedicineList : optionsGenericMedicineList}
            getOptionLabel={option => (tabStatus === 'By product' ? option?.name || '' : option?.genericName || '')}
            isOptionEqualToValue={(option, value) => option?.value === value?.value}
            renderOption={renderMedicineOption}
            onChangeOverride={handleMedicineChange}
            onInputChange={(value, reason) => {
              if (reason !== 'input') return

              if (tabStatus === 'By product') {
                searchMedicineData(value)
              } else {
                searchGenericMedicineData(value)
              }
            }}
            onBlur={() => {
              if (tabStatus === 'By product') {
                fetchMedicineData('')
              } else {
                searchGenericMedicineData('')
              }
            }}
            autocompleteProps={{ filterOptions: options => options }}
            errors={errors}
          />
        </Grid>

        {/* Selected Medicine Info */}
        {selectedMedicine?.name && (
          <Box
            sx={{
              backgroundColor: 'customColors.Surface',
              padding: '16px',
              borderRadius: '8px',
              border: `0.5px solid ${theme.palette.primary.main}`
            }}
          >
            <Typography sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px', mb: 1 }}>
              Package:{' '}
              <span style={{ fontWeight: 400, fontSize: '12px', color: 'primary.light' }}>
                {selectedMedicine?.package}
              </span>
            </Typography>
            <Typography sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px', mb: 1 }}>
              Manufactured by:{' '}
              <span style={{ fontWeight: 400, fontSize: '12px', color: 'primary.light' }}>
                {selectedMedicine?.manufacture}
              </span>
            </Typography>
            {selectedMedicine?.availAbleQty && (
              <Typography sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px' }}>
                Availability:{' '}
                <span style={{ fontWeight: 400, fontSize: '12px', color: 'primary.light' }}>
                  {selectedMedicine?.availAbleQty}
                </span>
              </Typography>
            )}
          </Box>
        )}

        {/* Quantity Input */}
        <Grid item size={{ xs: 12, sm: 12 }} sx={{ mt: 3 }}>
          <ControlledTextField
            name='quantity'
            control={control}
            label='Quantity*'
            type='number'
            errors={errors}
            onWheel={event => event.target.blur()}
          />

          {selectedMedicine?.unit_price > 0 && quantity > 0 && (
            <Box sx={{ mx: 1, my: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Chip
                label={`Unit Price - ${Utility?.formatAmountToReadableDigit(Number(selectedMedicine?.unit_price))}`}
                variant='outlined'
                size='small'
                sx={{
                  fontSize: '13px',
                  height: '32px',
                  fontWeight: 400,
                  backgroundColor: 'customColors.Surface',
                  color: 'customColors.OnSurfaceVariant',
                  border: `0.5px solid ${theme.palette.primary.main} !important`
                }}
              />
              <Chip
                label={`Total QTY Price - ${Utility?.formatAmountToReadableDigit(
                  Number(selectedMedicine?.unit_price * quantity)
                )}`}
                variant='outlined'
                size='small'
                sx={{
                  fontSize: '13px',
                  height: '32px',
                  fontWeight: 400,
                  backgroundColor: 'customColors.Surface',
                  color: 'customColors.OnSurfaceVariant',
                  border: `0.5px solid ${theme.palette.primary.main} !important`
                }}
              />
            </Box>
          )}
        </Grid>

        {/* Comments */}
        <Grid item size={{ xs: 12, sm: 12 }}>
          <ControlledTextField name='alternate_comments' control={control} label='Comments' errors={errors} />
        </Grid>

        {/* Prescription Upload */}
        {(controlSubstance || prescriptionRequired) && (
          <Grid item size={{ xs: 12, sm: 12 }}>
            <Typography
              sx={{ mb: 2, mt: 2, fontSize: '16px', fontWeight: 500, color: 'customColors.customTextColorGray2' }}
            >
              Add prescription*
            </Typography>
            <ControlledFileUpload
              name='prescription_file'
              control={control}
              label='Add Prescription *'
              errors={errors}
              acceptFileTypes='.pdf,.jpeg,.jpg,.png'
            />
          </Grid>
        )}
      </Grid>

      {/* Action Buttons */}
      <Grid sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <LoadingButton
          sx={{ my: 6 }}
          size='large'
          onClick={() => {
            closeAlternativeMedicineDialog()
          }}
          variant='outlined'
        >
          Cancel
        </LoadingButton>
        <LoadingButton
          sx={{ my: 6, width: '100px' }}
          size='large'
          type='submit'
          variant='contained'
          loading={submitLoader}
        >
          Add
        </LoadingButton>
      </Grid>
    </Box>
  )
}

export default React.memo(AlternativeMedicine)
