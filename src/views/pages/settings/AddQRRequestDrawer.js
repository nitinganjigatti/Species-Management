import { useEffect, useState, useContext } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { AuthContext } from 'src/context/AuthContext'
import { getAllSections } from 'src/lib/api/housing'

const schema = yup.object().shape({
  request_type: yup.string().required('Please select a request type'),
  site_id: yup.string().when('request_type', {
    is: val => val === 'site' || val === 'section',
    then: schema => schema.required('Please select a site'),
    otherwise: schema => schema.notRequired()
  }),
  section_id: yup.string().when('request_type', {
    is: 'section',
    then: schema => schema.required('Please select a section'),
    otherwise: schema => schema.notRequired()
  })
})

const AddQRRequestDrawer = props => {
  const { openDrawer, setOpenDrawer, handleSubmitData, loading } = props
  const theme = useTheme()
  const authData = useContext(AuthContext)

  // Get sites from auth context
  const sites = authData?.userData?.user?.zoos?.[0]?.sites || []

  const [sections, setSections] = useState([])
  const [loadingSections, setLoadingSections] = useState(false)

  const defaultValues = {
    request_type: 'all',
    site_id: '',
    section_id: ''
  }

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const requestType = watch('request_type')
  const selectedSiteId = watch('site_id')

  // Fetch sections when site is selected
  useEffect(() => {
    if (selectedSiteId && requestType === 'section') {
      const fetchSections = async () => {
        setLoadingSections(true)
        try {
          const response = await getAllSections({
            site_id: selectedSiteId,
            basic_only: 1
          })
          if (response?.success && response?.data) {
            setSections(response.data)
          }
        } catch (error) {
          console.error('Error fetching sections:', error)
        } finally {
          setLoadingSections(false)
        }
      }
      fetchSections()
    } else {
      setSections([])
    }
  }, [selectedSiteId, requestType])

  // Reset fields when request type changes
  useEffect(() => {
    if (requestType === 'all') {
      setValue('site_id', '')
      setValue('section_id', '')
    }
    if (requestType === 'site') {
      setValue('section_id', '')
    }
  }, [requestType, setValue])

  const onSubmit = async params => {
    const payload = {
      request_type: params.request_type,
      site_id: params.site_id || null,
      section_id: params.section_id || null
    }
    await handleSubmitData(payload)
  }

  const handleClose = () => {
    reset(defaultValues)
    setOpenDrawer(false)
  }

  return (
    <Drawer
      anchor='right'
      open={openDrawer}
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', '550px'] } }}
    >
      <Box sx={{ bgcolor: theme.palette.customColors.lightBg, width: '100%', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 4,
            bgcolor: theme.palette.customColors.lightBg
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Icon icon='mdi:qrcode-plus' fontSize={28} />
            <Typography variant='h6'>Add New Request</Typography>
          </Box>
          <IconButton size='small' onClick={handleClose}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>

        {/* Form */}
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Box
            sx={{
              mx: 4,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              backgroundColor: theme.palette.background.paper,
              borderRadius: '8px',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Request Type */}
            <FormControl error={Boolean(errors.request_type)}>
              <FormLabel sx={{ mb: 2, color: theme.palette.text.primary, fontSize: '14px', fontWeight: 500 }}>
                Generate QR for*
              </FormLabel>
              <Controller
                name='request_type'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <RadioGroup value={value} onChange={onChange}>
                    <FormControlLabel
                      value='all'
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography sx={{ fontWeight: 500 }}>All Enclosures</Typography>
                          <Typography variant='caption' sx={{ color: theme.palette.text.secondary }}>
                            Generate QR codes for all enclosures in the zoo
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 2, alignItems: 'flex-start', '& .MuiRadio-root': { mt: -1 } }}
                    />
                    <FormControlLabel
                      value='site'
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography sx={{ fontWeight: 500 }}>Select Site</Typography>
                          <Typography variant='caption' sx={{ color: theme.palette.text.secondary }}>
                            Generate QR codes for all enclosures in a specific site
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 2, alignItems: 'flex-start', '& .MuiRadio-root': { mt: -1 } }}
                    />
                    <FormControlLabel
                      value='section'
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography sx={{ fontWeight: 500 }}>Select Section</Typography>
                          <Typography variant='caption' sx={{ color: theme.palette.text.secondary }}>
                            Generate QR codes for all enclosures in a specific section
                          </Typography>
                        </Box>
                      }
                      sx={{ alignItems: 'flex-start', '& .MuiRadio-root': { mt: -1 } }}
                    />
                  </RadioGroup>
                )}
              />
              {errors.request_type && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors.request_type.message}</FormHelperText>
              )}
            </FormControl>

            {/* Site Dropdown - for 'site' or 'section' type */}
            {(requestType === 'site' || requestType === 'section') && (
              <Controller
                name='site_id'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    select
                    fullWidth
                    label='Select Site*'
                    value={value}
                    onChange={e => {
                      onChange(e)
                      setValue('section_id', '')
                    }}
                    error={Boolean(errors.site_id)}
                    helperText={errors.site_id?.message}
                  >
                    {sites.length > 0 ? (
                      sites.map(site => (
                        <MenuItem key={site.site_id} value={site.site_id}>
                          {site.site_name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No sites available</MenuItem>
                    )}
                  </TextField>
                )}
              />
            )}

            {/* Section Dropdown - for 'section' type */}
            {requestType === 'section' && (
              <Controller
                name='section_id'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    select
                    fullWidth
                    label='Select Section*'
                    value={value}
                    onChange={onChange}
                    error={Boolean(errors.section_id)}
                    helperText={errors.section_id?.message}
                    disabled={loadingSections || !selectedSiteId}
                  >
                    {loadingSections ? (
                      <MenuItem disabled>Loading...</MenuItem>
                    ) : !selectedSiteId ? (
                      <MenuItem disabled>Please select a site first</MenuItem>
                    ) : sections.length > 0 ? (
                      sections.map(section => (
                        <MenuItem key={section.section_id} value={section.section_id}>
                          {section.section_name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No sections available</MenuItem>
                    )}
                  </TextField>
                )}
              />
            )}
          </Box>

          {/* Submit Button */}
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              right: 0,
              width: ['100%', '550px'],
              p: 4,
              bgcolor: theme.palette.background.paper,
              borderTop: `1px solid ${theme.palette.divider}`
            }}
          >
            <LoadingButton fullWidth variant='contained' type='submit' size='large' loading={loading}>
              Submit Request
            </LoadingButton>
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddQRRequestDrawer
