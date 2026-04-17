'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import Card from '@mui/material/Card'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

import { getComponentBySlug, type ComponentProp } from '../../registry'

// ── Real component imports ──
import AnimalCard from 'src/views/utility/AnimalCard'
import AnimalCardBasic from 'src/views/utility/AnimalCardBasic'
import AnimalLabelCard from 'src/views/utility/AnimalLabelCard'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import UserCard from 'src/views/utility/UserCard'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'
import FallbackImage from 'src/views/utility/FallbackImage'
import ObservationCard from 'src/views/utility/ObservationCard'
import MedicineCard from 'src/views/utility/MedicineCard'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'
import BottomActionBar from 'src/views/utility/BottomActionBar'
import SearchComponent from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'
import SiteSectionEnclosureCard from 'src/views/utility/SiteSectionEnclosureCard'
import CustomAccordion from 'src/views/utility/CustomAccordion'
import InfoDisplayGrid from 'src/views/utility/InfoDisplayGrid'
import FormFieldLabel from 'src/views/utility/FormFieldLabel'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import ImagePreview from 'src/views/utility/ImagePreview'
import SpeciesIllustrationCard from 'src/views/utility/SpeciesIllustrationCard'
import NewMediaCard from 'src/views/utility/NewMediaCard'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterDrawer from 'src/components/FilterDrawer'
import CommonDrawerBox from 'src/components/CommonDrawerBox'
import { useForm } from 'react-hook-form'
import RichTextEditor from 'src/components/RichTextEditor'
// InputwithMultipleValues has broken source — preview disabled

// Tables
import CommonTable from 'src/views/table/data-grid/CommonTable'
import ReactTable from 'src/views/table/ReactTable'

// Form fields
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledCheckBox from 'src/views/forms/form-fields/ControlledCheckBox'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'
import ControlledRadioGroup from 'src/views/forms/form-fields/ControlledRadioGroup'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledFileUpload from 'src/views/forms/form-fields/ControlledFileUpload'
import _ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
const ControlledSelectWithTextField = _ControlledSelectWithTextField as any
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import SingleDatePicker from 'src/components/SingleDatePicker'
// CommonDateRangePickers & CustomOptionDateRangePickers use next/router — no preview in App Router
import CustomDateRangePicker from 'src/components/custom-date-picker/CustomDateRangePicker'
import EmptyStateBox from 'src/components/EmptyStateBox'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import CustomSwitchTabs from 'src/components/CustomSwitchTabs'
import TabsWithMenu from 'src/views/pages/housing/utils/TabsWithMenu'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'
import CommonDialogBox from 'src/components/CommonDialogBox'

/** Default dummy data for each component keyed by slug */
const DEFAULTS: Record<string, Record<string, any>> = {
  'animal-card': { 'data.default_icon': '/images/branding/Antz_logomark_h_color.svg', 'data.animal_id': 'AID-2024-0042', 'data.local_identifier_name': 'Tag ID', 'data.local_identifier_value': 'TGR-001', 'data.common_name': 'African Lion', 'data.scientific_name': 'Panthera leo', 'data.sex': 'male', 'data.type': 'individual', 'data.is_primary': '1', 'data.age': '5 years', 'data.weight': '190 kg', 'data.breed_name': 'Asiatic', 'data.morph_name': 'Golden', 'data.user_enclosure_name': 'Savanna Hall', 'data.section_name': 'South Wing', 'data.site_name': 'Main Zoo' },
  'animal-card-basic': { image: '/images/branding/Antz_logomark_h_color.svg', name: 'red panda', scientificName: 'ailurus fulgens', age: '3 years', gender: 'female' },
  'animal-label-card': { title: 'Amoxicillin', subTitle: 'Antibiotic', secondSubTitle: '500mg per dose', icon: '/images/branding/Antz_logomark_h_color.svg', bgColor: '#f0f0f0' },
  'species-card': { 'species.default_icon': '/images/branding/Antz_logomark_h_color.svg', 'species.common_name': 'African Elephant', 'species.scientific_name': 'Loxodonta africana', 'species.is_primary': '1' },
  'user-card': { name: 'Dr. Naseer', uid: 'user-001', image: '', role: 'Zoo Veterinarian' },
  'custom-filter-drawer': { title: 'Filter Animals' },
  'filter-drawer': {},
  'common-drawer-box': { title: 'Shipment Details' },
  'confirmation-dialog': { title: 'Delete Animal?', description: 'This action cannot be undone. The animal record will be permanently removed.', icon: 'mdi:delete-outline', iconColor: '#FF4D49', ConfirmationText: 'Delete', cancelText: 'Cancel', loading: false, allowCancel: true },
  'observation-card': { title: 'Feeding Observation', description: 'Ate well,All items consumed,Good appetite', dateTime: '2024-03-15T14:30:00Z' },
  'medicine-card': { name: 'Penicillin', description: 'Antibiotic for bacterial infections', pending: 5, icon: '/images/branding/Antz_logomark_h_color.svg', pendingColor: '#d32f2f', control_substance: '1', prescription_required: '1' },
  'pharmacy-product-card': { title: 'Aspirin', subTitle: 'Pain Reliever', secondSubTitle: '500mg tablets', icon: '/images/branding/Antz_logomark_h_color.svg', bgColor: '#f0f0f0' },
  'empty-state-box': { text: 'No animals found in this enclosure', imageSrc: '/images/branding/Antz_logomark_h_color.svg' },
  'site-section-enclosure-card': { enclosureName: 'Savanna Hall', sectionName: 'South Wing', siteName: 'Main Zoo' },
  'toaster': { message: 'Animal record saved successfully!', type: 'success' },
  'search': { value: '', placeholder: 'Search animals...' },
  'media-card': { fileUrl: '/images/branding/Antz_logomark_h_color.svg', fileName: 'animal_photo.jpg', 'user.user_name': 'Dr. Naseer', 'user.created_at': '2024-03-01T10:30:00Z', width: 280, height: 200, showTitle: true, showTitleIcon: false, isDeleteLoading: false },
  'species-illustration-card': { 'eggDetails.default_icon': '/images/branding/Antz_logomark_h_color.svg', 'eggDetails.default_common_name': 'Golden Eagle', 'eggDetails.complete_name': 'Aquila chrysaetos', width: 300 },
  'image-preview': { imageSrc: '/images/branding/Antz_logomark_h_color.svg', 'imageDetails.name': 'animal_photo.jpg', 'imageDetails.created_at': '2024-03-01T10:30:00Z', altText: 'preview', width: 250, height: 180, loader: false },
  'fallback-avatar': { src: '', size: 'large' },
  'fallback-image': { src: '', fallback: '/images/branding/Antz_logomark_h_color.svg', alt: 'Preview', width: 200, height: 150 },
  'user-avatar-details': { user_name: 'Sarah Smith', date: '2024-03-01T10:30:00Z', description: 'Senior Veterinarian', role: 'Animal Care', size: 'large', dateType: 'created' },
  'filter-button-notification': { label: 'Advanced Filter', icon: 'mage:filter', appliedFiltersCount: 3, disabled: false },
  'form-field-label': { text: 'Animal Name *', variant: 'subtitle1' },
  'text-ellipsis-with-modal': { text: 'Panthera tigris — The Bengal Tiger is one of the most iconic big cats found in the Indian subcontinent and Southeast Asia.' },
  'custom-accordion': { title: 'Medical Records' },
  'bottom-action-bar': { submitLabel: 'SAVE', cancelLabel: 'DISCARD' },
  'no-data-found': { variant: 'Meerkat', height: 150, width: 150 },
  'rich-text-editor': { label: 'Notes', placeholder: 'Start typing...', minHeight: 200 },
  'controlled-text-field': { label: 'Animal Name', required: true, type: 'text', disabled: false, readOnly: false },
  'controlled-text-area': { label: 'Observation Notes', rows: 4, disabled: false, readOnly: false },
  'controlled-select': { label: 'Species', required: true },
  'controlled-autocomplete': { label: 'Search Species', loading: false, multiple: false },
  'controlled-checkbox': { label: 'I confirm this record is accurate', labelPlacement: 'end', size: 'medium', disabled: false },
  'controlled-switch': { label: 'Enable notifications', labelPosition: 'end', size: 'medium', disabled: false },
  'controlled-radio-group': { label: 'Priority', row: true, disabled: false },
  'controlled-date-picker': { label: 'Date of Birth', disabled: false },
  'controlled-time-picker': { label: 'Feeding Time', format: 'hh:mm A', ampm: true, disabled: false },
  'controlled-file-upload': { label: 'Upload Document', acceptFileTypes: '.pdf,.doc,.docx,.jpg,.jpeg,.png' },
  'controlled-select-with-text-field': { label: 'Weight', placeholder: 'Enter value' },
  'confirmation-checkbox': { label: 'I agree', title: 'Confirm Action', description: 'Please confirm you want to proceed.' },
  'common-table': { loading: false },
  'react-table': { headerName: 'Animals', loading: false },
  'input-with-multiple-values': { name: 'demo-tags' },
  'pickers-custom-input': { label: 'Select Date', readOnly: false },
  'single-date-picker': { dateFormat: 'dd-MMM-yyyy', disabled: false },
  'custom-date-range-picker': { label: 'Select Date Range', monthsShown: 2, disableFutureDates: false, selectFutureDates: false },
  'common-date-range-pickers': { showFutureDates: false, showAllTime: false, useCustomText: false, customText: '' },
  'custom-option-date-range-pickers': { showFutureDates: false, showAllTime: false, useCustomText: false, customText: '' },
  'custom-switch-tabs': { value: 'overview' },
  'tabs-with-menu': { selectedTab: 'sections' },
  'confirm-dialog-box': { title: 'Save Changes?', description: 'You have unsaved changes. Do you want to save before leaving?' },
  'common-dialog-box': { title: 'Add New Record', loading: false },
}

/** Build nested object from flat dot-notation keys */
function buildNestedObject(flat: Record<string, any>, prefix: string): Record<string, any> {
  const result: Record<string, any> = {}
  const p = prefix + '.'
  Object.entries(flat).forEach(([key, val]) => {
    if (key.startsWith(p)) {
      result[key.slice(p.length)] = val
    }
  })
  return result
}

function generateCode(compName: string, propValues: Record<string, any>, propDefs: ComponentProp[]): string {
  const topLevel = propDefs.filter(p => !p.name.includes('.'))
  const nested = propDefs.filter(p => p.name.includes('.'))
  const lines = [`<${compName}`]

  // Group nested props
  const groups: Record<string, ComponentProp[]> = {}
  nested.forEach(p => {
    const parent = p.name.split('.')[0]
    if (!groups[parent]) groups[parent] = []
    groups[parent].push(p)
  })

  Object.entries(groups).forEach(([parent, children]) => {
    lines.push(`  ${parent}={{`)
    children.forEach(p => {
      const key = p.name.split('.').slice(1).join('.')
      const val = propValues[p.name]
      if (val === undefined || val === '') return
      lines.push(`    ${key}: '${val}',`)
    })
    lines.push('  }}')
  })

  topLevel.forEach(p => {
    if (groups[p.name]) return
    const val = propValues[p.name]
    if (val === undefined || val === '') return

    if (p.type.includes('=>') || p.type.includes('void')) {
      const handler = p.name === 'onClose' || p.name === 'close' ? '() => setOpen(false)' : `handle${p.name.charAt(0).toUpperCase()}${p.name.slice(1)}`
      lines.push(`  ${p.name}={${handler}}`)
    } else if (p.type === 'boolean' || typeof val === 'boolean') {
      lines.push(val ? `  ${p.name}` : `  ${p.name}={false}`)
    } else if (typeof val === 'number') {
      lines.push(`  ${p.name}={${val}}`)
    } else {
      lines.push(`  ${p.name}="${val}"`)
    }
  })

  lines.push('/>')
  return lines.join('\n')
}

const PlaygroundPage = () => {
  const params = useParams()
  const router = useRouter()
  const theme = useTheme()
  const slug = (params?.component ?? '') as string

  const comp = useMemo(() => getComponentBySlug(slug), [slug])

  const [activeTab, setActiveTab] = useState(0)
  const [copied, setCopied] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { control, formState: { errors: formErrors } } = useForm({ defaultValues: { demoText: 'African Lion', demoTextArea: 'Observation notes', demoSelect: '', demoCheckbox: false, demoSwitch: true, demoRadio: 'low' } })

  const sampleTableColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'species', headerName: 'Species', flex: 1 },
    { field: 'status', headerName: 'Status', width: 120 }
  ]
  const sampleTableRows = [
    { id: 1, name: 'Simba', species: 'African Lion', status: 'Active' },
    { id: 2, name: 'Dumbo', species: 'Asian Elephant', status: 'Healthy' },
    { id: 3, name: 'Ming', species: 'Red Panda', status: 'Monitoring' }
  ]

  const editableProps = useMemo(() => {
    if (!comp) return []
    // Show all props that have a control OR are simple string/boolean/number (not callbacks, not ReactNode)
    return comp.props.filter(p => {
      if (p.control) return true
      if (p.type.includes('=>') || p.type.includes('void') || p.type === 'ReactNode') return false
      if (p.type === 'object' && !p.name.includes('.')) return false // skip parent object, show children
      if (p.type === 'Array' || p.type.startsWith('Array')) return false
      return true
    })
  }, [comp])

  const getInitialValues = useCallback(() => {
    const values: Record<string, any> = {}
    if (!comp) return values

    // Start with slug-specific defaults
    const slugDefaults = DEFAULTS[slug] ?? {}
    Object.assign(values, slugDefaults)

    // Fill in from prop definitions
    comp.props.forEach(p => {
      if (values[p.name] !== undefined) return // already set by slug defaults
      if (p.default) {
        if (p.type === 'boolean') values[p.name] = p.default === 'true'
        else values[p.name] = p.default.replace(/'/g, '')
      }
    })

    return values
  }, [comp, slug])

  const [propValues, setPropValues] = useState<Record<string, any>>(getInitialValues)

  if (!comp) {
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <Typography variant='h6'>Component not found</Typography>
        <Button onClick={() => router.push('/component-library')} sx={{ mt: 2 }}>Back to Library</Button>
      </Box>
    )
  }

  const code = generateCode(comp.name, propValues, comp.props)

  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true) }
  const handleReset = () => setPropValues(getInitialValues())
  const updateProp = (name: string, value: any) => setPropValues(prev => ({ ...prev, [name]: value }))

  /** Render the REAL component with current propValues */
  const renderLivePreview = () => {
    const v = propValues
    const noop = () => {}

    const LIVE: Record<string, React.ReactNode> = {
      'animal-card': <AnimalCard data={buildNestedObject(v, 'data')} size={v.size} edit={v.edit} valueColor={v.valueColor} onWeightClick={v.onWeightClick ? noop : undefined} maxWidth={v.maxWidth} />,
      'animal-card-basic': <AnimalCardBasic image={v.image} name={v.name} scientificName={v.scientificName} age={v.age} gender={v.gender} />,
      'animal-label-card': <AnimalLabelCard title={v.title} subTitle={v.subTitle} secondSubTitle={v.secondSubTitle} icon={v.icon} bgColor={v.bgColor || theme.palette.customColors.trackBg} onClick={noop} />,
      'species-card': <SpeciesCard species={buildNestedObject(v, 'species') as any} />,
      'user-card': <UserCard name={v.name} uid={v.uid || 'demo'} image={v.image} role={v.role} radio={{ checked: true, onChange: noop }} />,
      'user-avatar-details': <UserAvatarDetails user_name={v.user_name || 'Sarah Smith'} date={v.date || '2024-03-01T10:30:00Z'} description={v.description} role={v.role} size={v.size || 'large'} show_time dateType={v.dateType || 'created'} />,
      'fallback-avatar': <FallbackAvatar src={v.src} size={v.size || 'large'} onLoad={noop} onError={noop} />,
      'fallback-image': <FallbackImage src={v.src || ''} fallback={v.fallback || '/images/branding/Antz_logomark_h_color.svg'} sx={{ width: v.width ? Number(v.width) : 200, height: v.height ? Number(v.height) : 150, borderRadius: '8px' }} alt={v.alt || 'Preview'} />,
      'observation-card': <ObservationCard title={v.title} description={v.description} dateTime={v.dateTime} containerStyle={{}} />,
      'medicine-card': <MedicineCard name={v.name} description={v.description} pending={v.pending} icon={v.icon} pendingColor={v.pendingColor} control_substance={v.control_substance} prescription_required={v.prescription_required} />,
      'pharmacy-product-card': <PharmacyProductCard title={v.title} subTitle={v.subTitle} secondSubTitle={v.secondSubTitle} icon={v.icon} bgColor={v.bgColor || theme.palette.customColors.trackBg} onClick={noop} prescriptionRequired={v.prescriptionRequired} controlSubstance={v.controlSubstance} />,
      'bottom-action-bar': <Box sx={{ position: 'relative', width: 500, height: 80 }}><BottomActionBar onSubmit={noop} onCancel={noop} submitLabel={v.submitLabel || 'SAVE'} cancelLabel={v.cancelLabel || 'DISCARD'}>{null}</BottomActionBar></Box>,
      'search': <SearchComponent value={v.value || ''} onChange={noop} placeholder={v.placeholder} width={350} />,
      'no-data-found': <NoDataFound variant={v.variant || 'Meerkat'} height={v.height} width={v.width} />,
      'site-section-enclosure-card': <SiteSectionEnclosureCard enclosureName={v.enclosureName} sectionName={v.sectionName} siteName={v.siteName} />,
      'custom-accordion': <Box sx={{ width: 400 }}><CustomAccordion id='demo' title={v.title || 'Medical Records'} docsCount={null} expanded={false} onChange={noop} editable={false} handleEditClick={noop} type='document'><Typography variant='body2'>Accordion content</Typography></CustomAccordion></Box>,
      'info-display-grid': <InfoDisplayGrid cardsData={[{ label: 'Age', value: v['cardsData.0.value'] || '5 years' }, { label: 'Weight', value: v['cardsData.1.value'] || '190 kg' }, { label: 'Species', value: v['cardsData.2.value'] || 'African Lion' }] as any} showSeparator={v.showSeparator} displayVertically={v.displayVertically} />,
      'form-field-label': <FormFieldLabel text={v.text || 'Animal Name *'} variant={v.variant || 'subtitle1'} />,
      'filter-button-notification': <FilterButtonWithNotification label={v.label || 'Filter'} icon={v.icon || 'mage:filter'} iconPosition={v.iconPosition || 'start'} appliedFiltersCount={(v.appliedFiltersCount ? Number(v.appliedFiltersCount) : 3) as any} onClick={noop} disabled={!!v.disabled} />,
      'image-preview': <ImagePreview imageSrc={v.imageSrc || '/images/branding/Antz_logomark_h_color.svg'} imageDetails={{ name: v['imageDetails.name'] || 'photo.jpg', created_at: v['imageDetails.created_at'] || '2024-03-01T10:30:00Z' }} onClose={noop} altText={v.altText || 'preview'} width={v.width ? Number(v.width) : 250} height={v.height ? Number(v.height) : 180} loader={!!v.loader} />,
      'rich-text-editor': <Box sx={{ width: 500 }}><RichTextEditor value={v.value || ''} onChange={noop} label={v.label || 'Notes'} placeholder={v.placeholder || 'Start typing...'} minHeight={v.minHeight ? Number(v.minHeight) : 200} /></Box>,
      // input-with-multiple-values: source component has broken state — preview disabled
      'pickers-custom-input': <TextField fullWidth label={v.label || 'Select Date'} size='small' placeholder='dd-MMM-yyyy' slotProps={{ input: { readOnly: !!v.readOnly } }} />,

      // Controlled Form Fields
      'controlled-text-field': <Box sx={{ width: 400 }}><ControlledTextField name='demoText' label={v.label || 'Animal Name'} control={control} errors={formErrors} required={!!v.required} disabled={!!v.disabled} readOnly={!!v.readOnly} type={v.type || 'text'} /></Box>,
      'controlled-text-area': <Box sx={{ width: 400 }}><ControlledTextArea name='demoTextArea' label={v.label || 'Observation Notes'} control={control} errors={formErrors} rows={v.rows ? Number(v.rows) : 4} disabled={!!v.disabled} readOnly={!!v.readOnly} /></Box>,
      'controlled-select': <Box sx={{ width: 400 }}><ControlledSelect name='demoSelect' label={v.label || 'Species'} control={control} errors={formErrors} options={['Bengal Tiger', 'African Elephant', 'Red Panda'] as any} required={!!v.required} /></Box>,
      'controlled-autocomplete': <Box sx={{ width: 400 }}><ControlledAutocomplete name='demoSelect' label={v.label || 'Search Species'} control={control} errors={formErrors} options={[{ label: 'Bengal Tiger', value: 'tiger' }, { label: 'African Elephant', value: 'elephant' }, { label: 'Red Panda', value: 'panda' }] as any} loading={!!v.loading} multiple={!!v.multiple} /></Box>,
      'controlled-checkbox': <ControlledCheckBox name='demoCheckbox' label={v.label || 'I confirm this record is accurate'} control={control} disabled={!!v.disabled} labelPlacement={v.labelPlacement || 'end'} size={v.size || 'medium'} gap={0 as any} />,
      'controlled-switch': <ControlledSwitch name='demoSwitch' label={v.label || 'Enable notifications'} control={control} disabled={!!v.disabled} labelPosition={v.labelPosition || 'end'} size={v.size || 'medium'} />,
      'controlled-radio-group': <ControlledRadioGroup name='demoRadio' label={v.label || 'Priority'} control={control} options={[{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' }] as any} row={!!v.row} disabled={!!v.disabled} defaultValue='low' />,
      'controlled-date-picker': <Box sx={{ width: 400 }}><ControlledDatePicker name='demoDate' control={control} label={v.label || 'Date of Birth'} disabled={!!v.disabled} /></Box>,
      'controlled-time-picker': <Box sx={{ width: 400 }}><ControlledTimePicker name='demoTime' control={control} label={v.label || 'Feeding Time'} format={v.format || 'hh:mm A'} ampm={v.ampm !== false} disabled={!!v.disabled} /></Box>,
      'controlled-file-upload': <Box sx={{ width: 400 }}><ControlledFileUpload name='demoFile' control={control} label={v.label || 'Upload Document'} errors={formErrors} color={theme.palette.primary.main} acceptFileTypes={v.acceptFileTypes || '.pdf,.doc,.docx,.jpg,.jpeg,.png'} /></Box>,
      'controlled-select-with-text-field': <Box sx={{ width: 400 }}><ControlledSelectWithTextField textFieldName='demoValue' selectFieldName='demoUnit' control={control} errors={formErrors} label={v.label || 'Weight'} placeholder={v.placeholder || 'Enter value'} options={['kg', 'g', 'lb'] as any} /></Box>,
      'confirmation-checkbox': <ConfirmationCheckBox color={theme.palette.primary.main} label={v.label || 'I agree'} value={false} setValue={noop} title={v.title || 'Confirm Action'} description={v.description || 'Please confirm you want to proceed.'} />,

      // Tables
      'common-table': <Box sx={{ width: '100%', height: 350 }}><CommonTable indexedRows={sampleTableRows} columns={sampleTableColumns as any} total={sampleTableRows.length} paginationModel={{ page: 0, pageSize: 5 }} setPaginationModel={noop} handleSortModel={noop} handleSearch={noop} searchValue='' loading={!!v.loading} pageSizeOptions={[5, 10]} /></Box>,
      'react-table': <Box sx={{ width: '100%' }}><ReactTable rows={sampleTableRows as any} columns={[{ accessorKey: 'name', header: 'Name', size: 200 }, { accessorKey: 'species', header: 'Species', size: 200 }, { accessorKey: 'status', header: 'Status', size: 120 }] as any} rowCount={sampleTableRows.length} headerName={v.headerName || 'Animals'} loading={!!v.loading} onRowClick={noop} onSortChange={noop} onSearch={noop} sx={{}} style={{}} tableContainerSx={{}} tableContainerStyle={{}} /></Box>,
      'single-date-picker': <SingleDatePicker date={new Date()} onChangeHandler={noop} name='demo-date' popperPlacement='bottom-start' dateFormat={v.dateFormat || 'dd-MMM-yyyy'} disabled={!!v.disabled} maxDate={null as any} size={null as any} />,
      'custom-date-range-picker': (() => { const p: any = { label: v.label || 'Select Date Range', monthsShown: v.monthsShown ? Number(v.monthsShown) : 2, onChange: noop, disableFutureDates: !!v.disableFutureDates, selectFutureDates: !!v.selectFutureDates }; return <CustomDateRangePicker {...p} /> })(),
      'common-date-range-pickers': (
        <Box sx={{ textAlign: 'center', p: 3 }}>
          <Icon icon='mdi:calendar-range' fontSize={48} color={theme.palette.customColors.Tertiary} style={{ marginBottom: 12 }} />
          <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 1 }}>CommonDateRangePickers</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>Preset ranges: Today, Yesterday, Last 7/30/180 days, All Time, Custom Range</Typography>
          <Chip label='Uses next/router — interactive preview only in Pages Router' size='small' color='warning' variant='outlined' />
        </Box>
      ),
      'custom-option-date-range-pickers': (
        <Box sx={{ textAlign: 'center', p: 3 }}>
          <Icon icon='mdi:calendar-clock' fontSize={48} color={theme.palette.customColors.Tertiary} style={{ marginBottom: 12 }} />
          <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 1 }}>CustomOptionDateRangePickers</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>Range picker with single-date toggle mode</Typography>
          <Chip label='Uses next/router — interactive preview only in Pages Router' size='small' color='warning' variant='outlined' />
        </Box>
      ),
      'species-illustration-card': <Box sx={{ width: v.width ? Number(v.width) : 300 }}><SpeciesIllustrationCard eggDetails={{ default_icon: v['eggDetails.default_icon'] || '/images/branding/Antz_logomark_h_color.svg', default_common_name: v['eggDetails.default_common_name'] || 'Golden Eagle', complete_name: v['eggDetails.complete_name'] || 'Aquila chrysaetos' }} theme={theme} /></Box>,
      'media-card': <NewMediaCard fileUrl={v.fileUrl || '/images/branding/Antz_logomark_h_color.svg'} fileName={v.fileName || 'animal_photo.jpg'} user={{ created_at: v['user.created_at'] || '2024-03-01T10:30:00Z', user_profile: { user_full_name: v['user.user_name'] || 'Dr. Naseer', user_profile_pic: '' } } as any} width={v.width ? Number(v.width) : 280} height={v.height ? Number(v.height) : 200} showTitle={v.showTitle !== false} showTitleIcon={!!v.showTitleIcon} isDeleteLoading={!!v.isDeleteLoading} downloadUrl={v.downloadUrl || null} />,
      'empty-state-box': <EmptyStateBox imageSrc={v.imageSrc || '/images/branding/Antz_logomark_h_color.svg'} text={v.text || 'No animals found'} />,
      'text-ellipsis-with-modal': <Box sx={{ width: 200 }}><TextEllipsisWithModal text={v.text || 'Panthera tigris — The Bengal Tiger is one of the most iconic big cats.'} maxWidth={200} /></Box>,
      'custom-switch-tabs': <CustomSwitchTabs options={[{ label: 'Overview', value: 'overview' }, { label: 'Medical', value: 'medical' }, { label: 'Diet', value: 'diet' }] as any} value={v.value || 'overview'} onChange={noop} />,
      'tabs-with-menu': <TabsWithMenu tabs={[{ labelKey: 'Sections', value: 'sections' }, { labelKey: 'Species', value: 'species' }, { labelKey: 'Notes', value: 'notes' }, { labelKey: 'Media', value: 'media' }, { labelKey: 'Users', value: 'users' }]} selectedTab={v.selectedTab || 'sections'} onTabChange={noop} />,
      'custom-filter-drawer': (
        <>
          <Button variant='contained' onClick={() => setDialogOpen(true)} startIcon={<Icon icon='mdi:dock-right' fontSize={18} />}>Open Filter Drawer</Button>
          <CustomFilterDrawer open={dialogOpen} onClose={() => setDialogOpen(false)} title={v.title || 'Filter Animals'} onApply={() => setDialogOpen(false)} onClearAll={noop} filterLists={['Species', 'Status', 'Location']} selectedOptions={{ Species: ['Bengal Tiger'], Status: [] }} selectedItem='Species' onSelectItem={noop} />
        </>
      ),
      'filter-drawer': (
        <>
          <Button variant='contained' onClick={() => setDialogOpen(true)} startIcon={<Icon icon='mdi:dock-right' fontSize={18} />}>Open Filter Drawer</Button>
          <FilterDrawer open={dialogOpen} onClose={() => setDialogOpen(false)} selectedItem='Species' onSelectItem={noop} filterLists={['Species', 'Enclosure', 'Status']} handleApplyFilter={() => setDialogOpen(false)} handleClearFilter={noop}>
            <Typography variant='body2' sx={{ p: 2 }}>Filter content here</Typography>
          </FilterDrawer>
        </>
      ),
      'common-drawer-box': (
        <>
          <Button variant='contained' onClick={() => setDialogOpen(true)} startIcon={<Icon icon='mdi:dock-right' fontSize={18} />}>Open Drawer</Button>
          <CommonDrawerBox title={v.title || 'Shipment Details'} drawerStatus={dialogOpen} close={() => setDialogOpen(false)} imageUrl='/images/branding/Antz_logomark_h_color.svg' totalStores={5} totalQuantity={120} totalBatches={8} totalValue='₹45,000' contentComponent={<Box sx={{ p: 3 }}><Typography variant='body2' color='text.secondary'>Drawer content goes here</Typography></Box>} style={{}} width={560} />
        </>
      ),
      'confirmation-dialog': (
        <>
          <Button variant='contained' onClick={() => setDialogOpen(true)} startIcon={<Icon icon='mdi:eye-outline' fontSize={18} />}>Open Dialog Preview</Button>
          <ConfirmationDialog title={v.title} description={v.description} icon={v.icon} iconColor={v.iconColor} dialogBoxStatus={dialogOpen} onClose={() => setDialogOpen(false)} confirmAction={() => setDialogOpen(false)} ConfirmationText={v.ConfirmationText} cancelText={v.cancelText} loading={v.loading} allowCancel={v.allowCancel} />
        </>
      ),
      'confirm-dialog-box': (
        <>
          <Button variant='contained' onClick={() => setDialogOpen(true)} startIcon={<Icon icon='mdi:eye-outline' fontSize={18} />}>Open Dialog Preview</Button>
          <ConfirmDialogBox title={v.title || 'Save Changes?'} open={dialogOpen} closeDialog={() => setDialogOpen(false)} action={() => setDialogOpen(false)} content={<Typography variant='body2' sx={{ p: 4, textAlign: 'center' }}>{v.description || 'You have unsaved changes.'}</Typography>} dialogActions={null} />
        </>
      ),
      'common-dialog-box': (
        <>
          <Button variant='contained' onClick={() => setDialogOpen(true)} startIcon={<Icon icon='mdi:eye-outline' fontSize={18} />}>Open Dialog Preview</Button>
          <CommonDialogBox title={v.title || 'Add New Record'} dialogBoxStatus={dialogOpen} close={() => setDialogOpen(false)} formComponent={null} noWidth={false} style={{}} dialogWithMaxWidth={false} loader={v.loading || false} />
        </>
      ),
    }

    const live = LIVE[slug]
    if (live) return live

    // Fallback
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Icon icon='mdi:puzzle-outline' fontSize={40} color={theme.palette.primary.main} style={{ marginBottom: 8 }} />
        <Typography variant='subtitle2' fontWeight={600}>{comp.name}</Typography>
        <Typography variant='caption' color='text.secondary'>Live preview not available for this component</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link underline='hover' color='primary' sx={{ cursor: 'pointer' }} onClick={() => router.push('/component-library')}>Component Library</Link>
        <Link underline='hover' color='primary' sx={{ cursor: 'pointer' }} onClick={() => router.push(`/component-library/${slug}`)}>{comp.name}</Link>
        <Typography color='text.secondary'>Playground</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: theme.palette.customColors.OnBackground, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon='mdi:play-circle-outline' color={theme.palette.primary.main} fontSize={20} />
          </Box>
          <Typography variant='h6' fontWeight={600}>{comp.name} — Playground</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant='outlined' size='small' startIcon={<Icon icon='mdi:refresh' fontSize={16} />} onClick={handleReset}>Reset</Button>
          <Button variant='contained' size='small' startIcon={<Icon icon='mdi:content-copy' fontSize={16} />} onClick={handleCopy}>Copy Code</Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, borderBottom: `1px solid ${theme.palette.customColors.SurfaceVariant}`, '& .MuiTab-root': { textTransform: 'none', fontWeight: 500 } }}>
        <Tab label='Interactive' />
        <Tab label='Code' />
      </Tabs>

      {activeTab === 0 && (
        <Box sx={{ display: 'flex', gap: 0, height: 'calc(100vh - 280px)' }}>
          {/* Props Controls Panel */}
          <Card sx={{ width: 360, flexShrink: 0, borderRadius: '10px 0 0 10px', border: `1px solid ${theme.palette.customColors.SurfaceVariant}`, boxShadow: 'none', overflow: 'auto' }}>
            <Box sx={{ px: 3, py: 2, display: 'flex', gap: 1, alignItems: 'center', backgroundColor: theme.palette.customColors.tableHeaderBg, borderBottom: `1px solid ${theme.palette.customColors.SurfaceVariant}`, position: 'sticky', top: 0, zIndex: 1 }}>
              <Icon icon='mdi:tune-vertical' color={theme.palette.primary.main} fontSize={16} />
              <Typography variant='subtitle2' fontWeight={600}>Props Controls</Typography>
              <Chip label={`${editableProps.length} props`} size='small' sx={{ ml: 'auto', height: 20, fontSize: 10 }} />
            </Box>

            {editableProps.map(prop => (
              <Box key={prop.name} sx={{ px: 3, py: 1.5, borderBottom: `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
                {prop.control === 'boolean' || prop.type === 'boolean' ? (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant='body2' fontWeight={500} color='primary' sx={{ fontFamily: 'monospace', fontSize: 13 }}>{prop.name}</Typography>
                      {prop.required && <Chip label='required' size='small' sx={{ height: 16, fontSize: 9, ml: 1, backgroundColor: theme.palette.error.main, color: theme.palette.primary.contrastText }} />}
                    </Box>
                    <Switch size='small' checked={!!propValues[prop.name]} onChange={e => updateProp(prop.name, e.target.checked)} />
                  </Box>
                ) : prop.control === 'select' ? (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                      <Typography variant='body2' fontWeight={500} color='primary' sx={{ fontFamily: 'monospace', fontSize: 13 }}>{prop.name}</Typography>
                      {prop.required && <Chip label='required' size='small' sx={{ height: 16, fontSize: 9, backgroundColor: theme.palette.error.main, color: theme.palette.primary.contrastText }} />}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {prop.options?.map(opt => (
                        <Button key={opt} size='small' variant={propValues[prop.name] === opt ? 'contained' : 'outlined'} onClick={() => updateProp(prop.name, opt)} sx={{ textTransform: 'none', minWidth: 'auto', fontSize: 12 }}>{opt}</Button>
                      ))}
                    </Box>
                  </Box>
                ) : prop.control === 'color' ? (
                  <Box>
                    <Typography variant='body2' fontWeight={500} color='primary' sx={{ fontFamily: 'monospace', fontSize: 13, mb: 1 }}>{prop.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {['#FF4D49', '#37BD69', '#FDB528', '#00AEA4', '#FA6140', '#666CFF'].map(color => (
                        <Box key={color} onClick={() => updateProp(prop.name, color)} sx={{ width: 28, height: 28, borderRadius: '6px', backgroundColor: color, cursor: 'pointer', border: propValues[prop.name] === color ? `2px solid ${color}` : '2px solid transparent', outline: propValues[prop.name] === color ? `2px solid ${theme.palette.customColors.SurfaceVariant}` : 'none' }} />
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                      <Typography variant='body2' fontWeight={500} color='primary' sx={{ fontFamily: 'monospace', fontSize: 13 }}>{prop.name}</Typography>
                      {prop.required && <Chip label='required' size='small' sx={{ height: 16, fontSize: 9, backgroundColor: theme.palette.error.main, color: theme.palette.primary.contrastText }} />}
                      <Typography variant='caption' color='text.disabled' sx={{ ml: 'auto', fontSize: 10 }}>{prop.type}</Typography>
                    </Box>
                    <TextField fullWidth size='small' value={propValues[prop.name] ?? ''} onChange={e => updateProp(prop.name, e.target.value)} placeholder={prop.description} sx={{ '& .MuiOutlinedInput-root': { backgroundColor: theme.palette.customColors.Background, fontSize: 13 } }} />
                  </Box>
                )}
              </Box>
            ))}
          </Card>

          {/* Live Preview Panel */}
          <Box sx={{ flex: 1, borderRadius: '0 10px 10px 0', border: `1px solid ${theme.palette.customColors.SurfaceVariant}`, borderLeft: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: `linear-gradient(180deg, ${theme.palette.customColors.displaybgPrimary} 0%, ${theme.palette.customColors.Background} 50%, ${theme.palette.customColors.displaybgSecondary} 100%)`, position: 'relative', overflow: 'auto', p: 4 }}>
              <Box sx={{ position: 'absolute', top: 12, left: 16, display: 'flex', gap: 1, alignItems: 'center', backgroundColor: theme.palette.background.paper, borderRadius: 20, px: 1.5, py: 0.5, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <Icon icon='mdi:eye-outline' color={theme.palette.primary.main} fontSize={14} />
                <Typography variant='caption' fontWeight={500} color='primary.dark'>Live Preview</Typography>
              </Box>
              {renderLivePreview()}
            </Box>

            {/* Generated Code Strip */}
            <Box sx={{ backgroundColor: theme.palette.customColors.darkBg, flexShrink: 0 }}>
              <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #313244' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Icon icon='mdi:code-tags' color='#A6E3A1' fontSize={14} />
                  <Typography variant='caption' sx={{ color: '#CDD6F4' }} fontWeight={500}>Generated Code</Typography>
                </Box>
                <Button size='small' startIcon={<Icon icon='mdi:clipboard-text-outline' fontSize={12} />} onClick={handleCopy} sx={{ color: '#A6E3A1', fontSize: 11, textTransform: 'none' }}>Copy</Button>
              </Box>
              <Box sx={{ px: 2, pb: 2 }}>
                <pre style={{ margin: 0, fontFamily: "'Inter', monospace", fontSize: 12, lineHeight: 1.8, color: '#CDD6F4', whiteSpace: 'pre-wrap' }}>{code}</pre>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {activeTab === 1 && (
        <Card sx={{ border: `1px solid ${theme.palette.customColors.SurfaceVariant}`, boxShadow: 'none', overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            <Typography variant='subtitle2' fontWeight={600}>Full Component Code</Typography>
            <Button size='small' startIcon={<Icon icon='mdi:content-copy' fontSize={14} />} onClick={handleCopy}>Copy</Button>
          </Box>
          <Box sx={{ p: 3, backgroundColor: theme.palette.customColors.darkBg }}>
            <pre style={{ margin: 0, fontFamily: "'Inter', monospace", fontSize: 13, lineHeight: 2, color: '#CDD6F4' }}>{code}</pre>
          </Box>
        </Card>
      )}

      <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity='success' onClose={() => setCopied(false)}>Code copied to clipboard!</Alert>
      </Snackbar>
    </Box>
  )
}

export default PlaygroundPage
