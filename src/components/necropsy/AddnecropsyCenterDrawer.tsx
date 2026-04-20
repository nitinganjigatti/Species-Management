import { yupResolver } from '@hookform/resolvers/yup'
import { Box, Button, CircularProgress, Drawer, IconButton, Typography, useTheme } from '@mui/material'
import { Theme } from '@mui/material/styles'
import React, { FC, memo, useCallback, useEffect, useState } from 'react'
import { useForm, Control, FieldErrors } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import { addUpdateNecropsyCenter } from 'src/lib/api/necropsy'
import { debounce } from 'lodash'
import * as Yup from 'yup'
import Toaster from 'src/components/Toaster'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { useTranslation } from 'react-i18next'

interface SiteOption {
  label: string
  value: string | number
}

interface FormValues {
  necropsy_center_name: string
  description: string
  site: SiteOption | null
}

interface EditData {
  id?: number
  name?: string
  description?: string
  site_id?: number | string
  site_name?: string
  is_active?: number
}

interface AddNecropsyCenterDrawerProps {
  open: boolean
  setOpen: (open: boolean) => void
  editData?: EditData | null
  setEditData?: ((data: EditData | null) => void) | null
  onSuccess?: (() => void) | null
}

interface AddUpdatePayload {
  name: string
  description: string
  site_id: string | number
  entity_type: string
  is_external: number
  is_active?: number
}

const defaultValues: FormValues = {
  necropsy_center_name: '',
  description: '',
  site: null
}

const AddnecropsyCenterDrawer: FC<AddNecropsyCenterDrawerProps> = ({
  open,
  setOpen,
  editData = null,
  setEditData = null,
  onSuccess = null
}) => {
  const { t } = useTranslation()
  const theme = useTheme<Theme>()
  const isEditMode = Boolean(editData)

  const schema = Yup.object().shape({
    necropsy_center_name: Yup.string()
      .trim()
      .required(t('necropsy_module.necropsy_center_name_is_required'))
      .min(3, t('necropsy_module.necropsy_center_name_must_be_at_least_3_characters'))
      .max(100, t('necropsy_module.necropsy_center_name_must_not_exceed_100_characters')),
    description: Yup.string().trim().max(500, t('description_must_not_exceed_500_characters')).nullable(),
    site: Yup.object()
      .shape({
        label: Yup.string(),
        value: Yup.string()
      })
      .nullable()
  })

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema) as any,
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [siteLoading, setSiteLoading] = useState<boolean>(false)
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([])
  const [siteInputText, setSiteInputText] = useState<string>('')

  useEffect(() => {
    if (editData && open) {
      const formData: FormValues = {
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

  const isSiteInvalid = siteInputText.trim() !== '' && !selectedSite

  const isSubmitDisabled =
    !necropsyCenterName || necropsyCenterName.trim().length < 2 || Boolean(errors.necropsy_center_name) || isSiteInvalid

  const fetchSites = useCallback(
    debounce(async (query: string) => {
      try {
        setSiteLoading(true)

        const params: Record<string, string | number> = {
          page_no: 1,
          limit: 10
        }
        if (query && query.trim() !== '') {
          params.q = query
        }
        const res = await getZooWiseSiteLists(params)

        const sites: SiteOption[] =
          res?.data?.result?.length > 0
            ? res.data.result.map((item: { site_name?: string; site_id?: number | string }) => ({
                label: item?.site_name || '',
                value: item?.site_id || ''
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

  const onClose = (): void => {
    reset(defaultValues)
    setSiteOptions([])
    setSiteInputText('')
    if (setEditData) {
      setEditData(null)
    }
    setOpen(false)
  }

  const onSubmit = async (data: FormValues): Promise<void> => {
    try {
      setSubmitLoader(true)

      const payload: AddUpdatePayload = {
        name: data.necropsy_center_name?.trim(),
        description: data.description?.trim() || '',
        site_id: data.site?.value || '',
        entity_type: 'necropsy_centre',
        is_external: 0
      }

      const status = isEditMode ? 'update' : 'add'
      const necropsyId = isEditMode ? editData?.id : undefined

      if (isEditMode) {
        payload.is_active = editData?.is_active ?? 1
      }

      const response = await addUpdateNecropsyCenter(payload, status, necropsyId)

      const isSuccess = isEditMode ? response?.status : response?.success

      if (isSuccess) {
        Toaster({
          type: 'success',
          message: isEditMode
            ? t('necropsy_module.necropsy_center_updated_successfully')
            : t('necropsy_module.necropsy_center_added_successfully')
        })
        if (onSuccess) {
          onSuccess()
        }
        onClose()
      } else {
        Toaster({
          type: 'error',
          message: response?.message || t('necropsy_module.something_went_wrong')
        })
      }
    } catch (error: any) {
      console.error('Error saving necropsy center:', error)
      Toaster({
        type: 'error',
        message: error?.message || t('necropsy_module.something_went_wrong')
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
              backgroundColor: (theme.palette as any).customColors.OnPrimary,
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
            borderBottom: `1px solid ${(theme.palette as any).customColors.OutlineVariant}`
          }}
        >
          <Typography
            variant='h6'
            sx={{ fontWeight: 500, fontSize: '24px', color: (theme.palette as any).customColors.OnSurfaceVariant }}
          >
            {isEditMode ? t('necropsy_module.edit_necropsy_center') : t('necropsy_module.add_necropsy_center')}
          </Typography>
          <IconButton onClick={onClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            background: (theme.palette as any).customColors.OnPrimary,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            minHeight: 0,
            p: 6
          }}
        >
          <ControlledTextField
            name='necropsy_center_name'
            label={t('necropsy_module.necropsy_center_name') + ' *'}
            placeholder={t('necropsy_module.enter_necropsy_center_name')}
            control={control as Control<FormValues>}
            errors={errors as FieldErrors<FormValues>}
            required
          />
          <ControlledTextArea
            name='description'
            label={t('description')}
            placeholder={t('enter_description_optional')}
            control={control as Control<FormValues>}
            errors={errors as FieldErrors<FormValues>}
            rows={3}
          />
          <ControlledAutocomplete
            name='site'
            label={t('site')}
            control={control as Control<FormValues>}
            errors={errors as FieldErrors<FormValues>}
            options={siteOptions}
            loading={siteLoading}
            showIcons={false}
            onInputChange={(query: string) => {
              setSiteInputText(query)

              if (query !== siteInputText) {
                fetchSites(query)
              }
            }}
            onChangeOverride={(value: SiteOption | null) => {
              setSiteInputText(value?.label || '')
            }}
            onItemClear={() => {
              setSiteOptions([])
              setSiteInputText('')
            }}
            autocompleteProps={{
              noOptionsText: siteInputText.trim() ? t('site_not_found') : t('type_to_search'),
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
              color: (theme.palette as any).customColors.OnPrimaryContainer,
              borderColor: (theme.palette as any).customColors.OnPrimaryContainer
            }}
            onClick={onClose}
          >
            {t('cancel')}
          </Button>
          <Button
            variant='contained'
            fullWidth
            color='primary'
            disabled={isSubmitDisabled || submitLoader}
            sx={{ p: 3, fontWeight: 600, backgroundColor: (theme.palette as any).customColors.OnPrimaryContainer }}
            onClick={handleSubmit(onSubmit)}
          >
            {submitLoader ? <CircularProgress size={24} /> : isEditMode ? t('update') : t('add')}
          </Button>
        </Box>
      </Drawer>
    </>
  )
}

export default memo(AddnecropsyCenterDrawer)
