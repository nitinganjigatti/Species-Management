import { yupResolver } from '@hookform/resolvers/yup'
import { Box, Button, CircularProgress, Drawer, IconButton, Typography, useTheme } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import { addUpdateNecropsyCenter } from 'src/lib/api/necropsy'
import { debounce } from 'lodash'
import * as Yup from 'yup'
import Toaster from 'src/components/Toaster'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

const defaultValues = {
  necropsy_center_name: '',
  description: '',
  site: null
}

const schema = Yup.object().shape({
  necropsy_center_name: Yup.string()
    .trim()
    .required('Necropsy Center Name is required')
    .min(2, 'Necropsy Center Name must be at least 2 characters')
    .max(100, 'Necropsy Center Name must not exceed 100 characters'),
  description: Yup.string().trim().max(500, 'Description must not exceed 500 characters').nullable(),
  site: Yup.object()
    .shape({
      label: Yup.string(),
      value: Yup.string()
    })
    .nullable()
})

const AddnecropsyCenterDrawer = ({ open, setOpen, editData = null, setEditData = null, onSuccess = null }) => {
  const theme = useTheme()
  const isEditMode = Boolean(editData)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const [submitLoader, setSubmitLoader] = useState(false)
  const [siteLoading, setSiteLoading] = useState(false)
  const [siteOptions, setSiteOptions] = useState([])
  const [siteInputText, setSiteInputText] = useState('')

  // Prefill form when editData is provided
  useEffect(() => {
    if (editData && open) {
      const formData = {
        necropsy_center_name: editData?.name || '',
        description: editData?.description || '',
        site: editData?.site_id
          ? {
              label: editData?.site_name || '',
              value: editData?.site_id
            }
          : null
      }
      reset(formData)
      setSiteInputText(editData?.site_name || '')
    }
  }, [editData, open, reset])

  const necropsyCenterName = watch('necropsy_center_name')
  const selectedSite = watch('site')

  // Site is invalid if user typed something but didn't select a valid option
  const isSiteInvalid = siteInputText.trim() !== '' && !selectedSite

  const isSubmitDisabled =
    !necropsyCenterName || necropsyCenterName.trim().length < 2 || Boolean(errors.necropsy_center_name) || isSiteInvalid

  const fetchSites = useCallback(
    debounce(async query => {
      try {
        setSiteLoading(true)

        const params = {
          page_no: 1,
          limit: 10
        }
        if (query && query.trim() !== '') {
          params.q = query
        }
        const res = await getZooWiseSiteLists(params)

        const sites =
          res?.data?.result?.length > 0
            ? res.data.result.map(item => ({
                label: item?.site_name,
                value: item?.site_id
              }))
            : []
        setSiteOptions(sites)
      } catch (error) {
        console.error('Error fetching sites:', error)
        setSiteOptions([])
      } finally {
        setSiteLoading(false)
      }
    }, 500),
    []
  )

  const onClose = () => {
    reset(defaultValues)
    setSiteOptions([])
    setSiteInputText('')
    if (setEditData) {
      setEditData(null)
    }
    setOpen(false)
  }

  const onSubmit = async data => {
    try {
      setSubmitLoader(true)

      // Define your payload here
      const payload = {
        name: data.necropsy_center_name?.trim(),
        description: data.description?.trim() || '',
        site_id: data.site?.value || '',
        entity_type: 'necropsy_centre',
        is_external: 0
      }

      // Determine status and necropsyId based on mode
      const status = isEditMode ? 'update' : 'add'
      const necropsyId = isEditMode ? editData?.id : ''

      // Add is_active for update operation
      if (isEditMode) {
        payload.is_active = editData?.is_active ?? 1
      }

      const response = await addUpdateNecropsyCenter(payload, status, necropsyId)

      if (response?.status === true) {
        Toaster({
          type: 'success',
          message: isEditMode ? 'Necropsy Center updated successfully' : 'Necropsy Center added successfully'
        })
        if (onSuccess) {
          onSuccess()
        }
        onClose()
      } else {
        Toaster({
          type: 'error',
          message: response?.message || 'Something went wrong'
        })
      }
    } catch (error) {
      console.error('Error saving necropsy center:', error)
      Toaster({
        type: 'error',
        message: error?.message || 'Something went wrong'
      })
    } finally {
      setSubmitLoader(false)
    }
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: '80%', md: 560 },
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.customColors.OnPrimary,
              p: 0
            }
          }
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            pb: 0,
            p: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Typography
            variant='h6'
            sx={{ fontWeight: 500, fontSize: '24px', color: theme.palette.customColors.OnSurfaceVariant }}
          >
            {isEditMode ? 'Edit Necropsy Center' : 'Add Necropsy Center'}
          </Typography>
          <IconButton onClick={onClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            background: theme.palette.customColors.OnPrimary,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            minHeight: 0,
            p: 6
          }}
        >
          <ControlledTextField
            name='necropsy_center_name'
            label='Necropsy Center Name *'
            placeholder='Enter necropsy center name'
            control={control}
            errors={errors}
            required
          />
          <ControlledTextArea
            name='description'
            label='Description'
            placeholder='Enter description (optional)'
            control={control}
            errors={errors}
            rows={3}
          />
          <ControlledAutocomplete
            name='site'
            label='Site'
            control={control}
            errors={errors}
            options={siteOptions}
            loading={siteLoading}
            showIcons={false}
            onInputChange={query => {
              setSiteInputText(query)

              // Only fetch if the query has actually changed
              if (query !== siteInputText) {
                fetchSites(query)
              }
            }}
            onChangeOverride={value => {
              // When a valid selection is made, sync input text with label
              setSiteInputText(value?.label || '')
            }}
            onItemClear={() => {
              setSiteOptions([])
              setSiteInputText('')
            }}
            autocompleteProps={{
              noOptionsText: siteInputText.trim() ? 'Site Not Found' : 'Type to search',
              onOpen: () => {
                if (siteOptions.length === 0) {
                  fetchSites('')
                }
              }
            }}
          />
        </Box>
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            width: '100%',
            p: 5,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            zIndex: 1,
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
            flexShrink: 0,
            display: 'flex',
            gap: 4
          }}
        >
          <Button
            variant='outlined'
            fullWidth
            color='primary'
            sx={{
              p: 3,
              fontWeight: 600,
              color: theme.palette.customColors.OnPrimaryContainer,
              borderColor: theme.palette.customColors.OnPrimaryContainer
            }}
            onClick={onClose}
          >
            CANCEL
          </Button>
          <Button
            variant='contained'
            fullWidth
            color='primary'
            disabled={isSubmitDisabled || submitLoader}
            sx={{ p: 3, fontWeight: 600, backgroundColor: theme.palette.customColors.OnPrimaryContainer }}
            onClick={handleSubmit(onSubmit)}
          >
            {submitLoader ? <CircularProgress size={24} /> : isEditMode ? 'UPDATE' : 'ADD'}
          </Button>
        </Box>
      </Drawer>
    </>
  )
}

export default AddnecropsyCenterDrawer
