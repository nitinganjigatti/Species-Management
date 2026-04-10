'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import TextField from '@mui/material/TextField'
import { useParams, useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

import { getComponentBySlug, getCategoryColorKey, getCategoryLabel, resolveColorKey, COMPONENT_REGISTRY, type ComponentEntry, type ComponentProp } from '../registry'

// ── Real component imports for live preview ──
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
import RichTextEditor from 'src/components/RichTextEditor'
// InputwithMultipleValues has broken source (state commented out) — preview disabled
import SingleDatePicker from 'src/components/SingleDatePicker'
// CommonDateRangePickers & CustomOptionDateRangePickers use next/router — cannot import in App Router

// Tables
import CommonTable from 'src/views/table/data-grid/CommonTable'
import ReactTable from 'src/views/table/ReactTable'

// Form fields (these need a useForm wrapper)
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
import CustomDateRangePicker from 'src/components/custom-date-picker/CustomDateRangePicker'
import EmptyStateBox from 'src/components/EmptyStateBox'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import CustomSwitchTabs from 'src/components/CustomSwitchTabs'
import TabsWithMenu from 'src/views/pages/housing/utils/TabsWithMenu'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'
import CommonDialogBox from 'src/components/CommonDialogBox'

/** Renders the ACTUAL component from the codebase with dummy data */
function ComponentPreview({ comp, theme }: { comp: ComponentEntry; theme: any }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const slug = comp.slug
  const isPortalComponent = comp.category === 'dialog' || comp.category === 'drawer'

  // For dialogs & drawers, show a trigger button + the actual component (they render as MUI portals)
  if (isPortalComponent) {
    const portalComponents: Record<string, React.ReactNode> = {
      // Dialogs
      'confirmation-dialog': (
        <ConfirmationDialog title='Delete Animal?' description='This action cannot be undone. The animal record and all associated data will be permanently removed.' icon='mdi:delete-outline' iconColor={theme.palette.customColors.errorText} dialogBoxStatus={dialogOpen} onClose={() => setDialogOpen(false)} confirmAction={() => setDialogOpen(false)} ConfirmationText='Delete' cancelText='Cancel' />
      ),
      'confirm-dialog-box': (
        <ConfirmDialogBox title='Save Changes?' open={dialogOpen} closeDialog={() => setDialogOpen(false)} action={() => setDialogOpen(false)} content={<Typography variant='body2' sx={{ p: 4, textAlign: 'center' }}>You have unsaved changes. Do you want to save before leaving?</Typography>} dialogActions={null} />
      ),
      'common-dialog-box': (
        <CommonDialogBox title='Add New Record' dialogBoxStatus={dialogOpen} close={() => setDialogOpen(false)} formComponent={<Typography variant='body2' sx={{ p: 4, textAlign: 'center' }}>Form content goes here</Typography>} noWidth={false} style={{}} dialogWithMaxWidth={false} loader={false} />
      ),
      // Drawers
      'custom-filter-drawer': (
        <CustomFilterDrawer
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title='Filter Animals'
          onApply={() => setDialogOpen(false)}
          onClearAll={() => {}}
          filterLists={['Species', 'Status', 'Location']}
          selectedOptions={{ Species: ['Bengal Tiger'], Status: [] }}
          selectedItem='Species'
          onSelectItem={() => {}}
        />
      ),
      'filter-drawer': (
        <FilterDrawer
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          selectedItem='Species'
          onSelectItem={() => {}}
          filterLists={['Species', 'Enclosure', 'Status']}
          handleApplyFilter={() => setDialogOpen(false)}
          handleClearFilter={() => {}}
        >
          <Typography variant='body2' sx={{ p: 2 }}>Filter content goes here</Typography>
        </FilterDrawer>
      ),
      'common-drawer-box': (
        <CommonDrawerBox
          title='Shipment Details'
          drawerStatus={dialogOpen}
          close={() => setDialogOpen(false)}
          imageUrl='/images/branding/Antz_logomark_h_color.svg'
          totalStores={5}
          totalQuantity={120}
          totalBatches={8}
          totalValue='₹45,000'
          contentComponent={
            <Box sx={{ p: 3 }}>
              <Typography variant='body2' color='text.secondary'>Drawer content goes here — shipment items, details, etc.</Typography>
            </Box>
          }
          style={{}}
          width={560}
        />
      ),
    }

    const label = comp.category === 'dialog' ? 'Dialog' : 'Drawer'

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Button variant='contained' onClick={() => setDialogOpen(true)} startIcon={<Icon icon={comp.category === 'drawer' ? 'mdi:dock-right' : 'mdi:eye-outline'} fontSize={18} />}>
          Open {comp.name}
        </Button>
        <Typography variant='caption' color='text.secondary'>Click to see the actual {label.toLowerCase()}</Typography>
        {portalComponents[slug] ?? null}
      </Box>
    )
  }

  // useForm for controlled form field previews
  const { control, formState: { errors } } = useForm({ defaultValues: { demoText: 'African Lion', demoTextArea: 'Animal observation notes go here', demoSelect: '', demoCheckbox: false, demoSwitch: true, demoRadio: 'option1' } })

  // Sample table data
  const sampleColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'species', headerName: 'Species', flex: 1 },
    { field: 'status', headerName: 'Status', width: 120 }
  ]
  const sampleRows = [
    { id: 1, name: 'Simba', species: 'African Lion', status: 'Active' },
    { id: 2, name: 'Dumbo', species: 'Asian Elephant', status: 'Healthy' },
    { id: 3, name: 'Ming', species: 'Red Panda', status: 'Monitoring' },
    { id: 4, name: 'Raja', species: 'Bengal Tiger', status: 'Active' },
    { id: 5, name: 'Nala', species: 'African Lion', status: 'Healthy' }
  ]

  const PREVIEW_MAP: Record<string, React.ReactNode> = {
    // ── Views ──
    'animal-card': (
      <AnimalCard data={{ default_icon: '/images/branding/Antz_logomark_h_color.svg', animal_id: 'AID-2024-0042', local_identifier_name: 'Tag ID', local_identifier_value: 'TGR-001', common_name: 'African Lion', scientific_name: 'Panthera leo', sex: 'male', type: 'individual', is_primary: '1', age: '5 years', weight: '190 kg', breed_name: 'Asiatic', morph_name: 'Golden', user_enclosure_name: 'Savanna Hall', section_name: 'South Wing', site_name: 'Main Zoo' }} />
    ),
    'animal-card-basic': (
      <AnimalCardBasic image='/images/branding/Antz_logomark_h_color.svg' name='red panda' scientificName='ailurus fulgens' age='3 years' gender='female' />
    ),
    'animal-label-card': (
      <AnimalLabelCard title='Amoxicillin' subTitle='Antibiotic' secondSubTitle='500mg per dose' icon='/images/branding/Antz_logomark_h_color.svg' bgColor={theme.palette.customColors.trackBg} onClick={() => {}} />
    ),
    'species-card': (
      <SpeciesCard species={{ default_icon: '/images/branding/Antz_logomark_h_color.svg', common_name: 'African Elephant', scientific_name: 'Loxodonta africana', is_primary: '1' } as any} />
    ),
    'user-card': (
      <UserCard name='Dr. Naseer' uid='user-001' image='' role='Zoo Veterinarian' radio={{ checked: true, onChange: () => {} }} />
    ),
    'user-avatar-details': (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <UserAvatarDetails user_name='Sarah Smith' date='2024-03-01T10:30:00Z' size='small' show_time />
        <UserAvatarDetails user_name='Sarah Smith' date='2024-03-01T10:30:00Z' description='Senior Veterinarian' size='medium' show_time dateType='created' />
        <UserAvatarDetails user_name='Sarah Smith' date='2024-03-01T10:30:00Z' description='Senior Veterinarian' role='Animal Care' size='large' show_time dateType='updated' />
      </Box>
    ),
    'fallback-avatar': (
      <Box sx={{ display: 'flex', gap: 3 }}>
        <FallbackAvatar size='small' onLoad={() => {}} onError={() => {}} />
        <FallbackAvatar size='medium' onLoad={() => {}} onError={() => {}} />
        <FallbackAvatar size='large' onLoad={() => {}} onError={() => {}} />
        <FallbackAvatar size='xlarge' onLoad={() => {}} onError={() => {}} />
      </Box>
    ),
    'fallback-image': (
      <FallbackImage src='' fallback='/images/branding/Antz_logomark_h_color.svg' sx={{ width: 200, height: 150, borderRadius: '8px' }} />
    ),
    'observation-card': (
      <ObservationCard title='Feeding Observation' description='Ate well,All items consumed,Good appetite' dateTime='2024-03-15T14:30:00Z' containerStyle={{}} />
    ),
    'medicine-card': (
      <MedicineCard name='Penicillin' description='Antibiotic for bacterial infections' pending={5} icon='/images/branding/Antz_logomark_h_color.svg' pendingColor={theme.palette.error.dark} control_substance='1' prescription_required='1' />
    ),
    'pharmacy-product-card': (
      <PharmacyProductCard title='Aspirin' subTitle='Pain Reliever' secondSubTitle='500mg tablets' icon='/images/branding/Antz_logomark_h_color.svg' bgColor={theme.palette.customColors.trackBg} onClick={() => {}} prescriptionRequired controlSubstance={false} />
    ),
    'bottom-action-bar': (
      <Box sx={{ position: 'relative', width: 500, height: 80 }}>
        <BottomActionBar onSubmit={() => {}} onCancel={() => {}} submitLabel='SAVE' cancelLabel='DISCARD'>{null}</BottomActionBar>
      </Box>
    ),
    'search': (
      <SearchComponent value='' onChange={() => {}} placeholder='Search animals...' width={350} />
    ),
    'no-data-found': <NoDataFound variant='Meerkat' />,
    'no-medical-data': <NoDataFound variant='Sloth' />,
    'site-section-enclosure-card': (
      <SiteSectionEnclosureCard enclosureName='Savanna Hall' sectionName='South Wing' siteName='Main Zoo' />
    ),
    'custom-accordion': (
      <Box sx={{ width: 400 }}>
        <CustomAccordion id='demo' title='Medical Records' docsCount={3 as any} expanded={false} onChange={() => {}} editable={false} handleEditClick={() => {}} type='document'>
          <Typography variant='body2' color='text.secondary'>Accordion content goes here</Typography>
        </CustomAccordion>
      </Box>
    ),
    'info-display-grid': (
      <InfoDisplayGrid cardsData={[{ label: 'Age', value: '5 years' }, { label: 'Weight', value: '190 kg' }, { label: 'Species', value: 'African Lion' }, { label: 'Breed', value: 'Asiatic' }, { label: 'Sex', value: 'Male' }, { label: 'Status', value: 'Active' }] as any} />
    ),
    'form-field-label': (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormFieldLabel text='Animal Name *' variant='subtitle1' />
        <FormFieldLabel text='Date of Birth' variant='subtitle2' />
      </Box>
    ),
    'filter-button-notification': (
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FilterButtonWithNotification label='Advanced Filter' icon='mage:filter' appliedFiltersCount={3 as any} onClick={() => {}} />
        <FilterButtonWithNotification label='No Filters' icon='mage:filter' appliedFiltersCount={0 as any} onClick={() => {}} disabled />
      </Box>
    ),
    'image-preview': (
      <ImagePreview imageSrc='/images/branding/Antz_logomark_h_color.svg' imageDetails={{ name: 'animal_photo.jpg', created_at: '2024-03-01T10:30:00Z' }} onClose={() => {}} width={250} height={180} loader={false} />
    ),

    // ── Shared Components ──
    'empty-state-box': (
      <EmptyStateBox imageSrc='/images/branding/Antz_logomark_h_color.svg' text='No animals found in this enclosure' />
    ),
    'text-ellipsis-with-modal': (
      <Box sx={{ width: 200 }}>
        <TextEllipsisWithModal text='Panthera tigris — The Bengal Tiger is one of the most iconic big cats found in the Indian subcontinent and Southeast Asia, known for its distinctive orange coat with black stripes.' maxWidth={200} />
      </Box>
    ),
    'custom-switch-tabs': (
      <CustomSwitchTabs options={[{ label: 'Overview', value: 'overview' }, { label: 'Medical', value: 'medical' }, { label: 'Diet', value: 'diet' }, { label: 'History', value: 'history' }] as any} value='overview' onChange={() => {}} />
    ),
    'tabs-with-menu': (
      <TabsWithMenu tabs={[{ labelKey: 'Sections', value: 'sections' }, { labelKey: 'Species', value: 'species' }, { labelKey: 'Notes', value: 'notes' }, { labelKey: 'Media', value: 'media' }, { labelKey: 'Users', value: 'users' }]} selectedTab='sections' onTabChange={() => {}} />
    ),
    // ── Controlled Form Fields (with useForm) ──
    'controlled-text-field': (
      <Box sx={{ width: 400 }}>
        <ControlledTextField name='demoText' label='Animal Name' control={control} errors={errors} required />
      </Box>
    ),
    'controlled-text-area': (
      <Box sx={{ width: 400 }}>
        <ControlledTextArea name='demoTextArea' label='Observation Notes' control={control} errors={errors} rows={4} />
      </Box>
    ),
    'controlled-select': (
      <Box sx={{ width: 400 }}>
        <ControlledSelect name='demoSelect' label='Species' control={control} errors={errors} options={['Bengal Tiger', 'African Elephant', 'Red Panda', 'Asian Lion'] as any} required />
      </Box>
    ),
    'controlled-autocomplete': (
      <Box sx={{ width: 400 }}>
        <ControlledAutocomplete name='demoSelect' label='Search Species' control={control} errors={errors} options={[{ label: 'Bengal Tiger', value: 'tiger' }, { label: 'African Elephant', value: 'elephant' }, { label: 'Red Panda', value: 'panda' }, { label: 'Asian Lion', value: 'lion' }] as any} />
      </Box>
    ),
    'controlled-checkbox': (
      <ControlledCheckBox name='demoCheckbox' label='I confirm this record is accurate' control={control} gap={0 as any} />
    ),
    'controlled-switch': (
      <ControlledSwitch name='demoSwitch' label='Enable notifications' control={control} />
    ),
    'controlled-radio-group': (
      <ControlledRadioGroup name='demoRadio' label='Priority' control={control} options={[{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' }] as any} row defaultValue='low' />
    ),
    'controlled-date-picker': (
      <Box sx={{ width: 400 }}>
        <ControlledDatePicker name='demoDate' control={control} label='Date of Birth' />
      </Box>
    ),
    'controlled-time-picker': (
      <Box sx={{ width: 400 }}>
        <ControlledTimePicker name='demoTime' control={control} label='Feeding Time' />
      </Box>
    ),
    'controlled-file-upload': (
      <Box sx={{ width: 400 }}>
        <ControlledFileUpload name='demoFile' control={control} label='Upload Document' errors={errors} color={theme.palette.primary.main} />
      </Box>
    ),
    'controlled-select-with-text-field': (
      <Box sx={{ width: 400 }}>
<ControlledSelectWithTextField textFieldName='demoValue' selectFieldName='demoUnit' control={control} errors={errors} label='Weight' placeholder='Enter value' options={['kg', 'g', 'lb'] as any} />
      </Box>
    ),
    'confirmation-checkbox': (
      <ConfirmationCheckBox color={theme.palette.primary.main} label='I agree' value={false} setValue={() => {}} title='Confirm Action' description='Please confirm that you want to proceed with this action.' />
    ),

    // ── Tables ──
    'common-table': (
      <Box sx={{ width: '100%', height: 350 }}>
        <CommonTable indexedRows={sampleRows} columns={sampleColumns as any} total={sampleRows.length} paginationModel={{ page: 0, pageSize: 5 }} setPaginationModel={() => {}} handleSortModel={() => {}} handleSearch={() => {}} searchValue='' loading={false} pageSizeOptions={[5, 10]} />
      </Box>
    ),
    'react-table': (
      <Box sx={{ width: '100%' }}>
        <ReactTable rows={sampleRows as any} columns={[{ accessorKey: 'name', header: 'Name', size: 200 }, { accessorKey: 'species', header: 'Species', size: 200 }, { accessorKey: 'status', header: 'Status', size: 120 }] as any} rowCount={sampleRows.length} headerName='Animals' loading={false} onRowClick={() => {}} onSortChange={() => {}} onSearch={() => {}} sx={{}} style={{}} tableContainerSx={{}} tableContainerStyle={{}} />
      </Box>
    ),

    // Dialogs are handled above with toggle button — not in PREVIEW_MAP
    'rich-text-editor': (
      <Box sx={{ width: 500 }}>
        <RichTextEditor value='' onChange={() => {}} label='Notes' placeholder='Start typing...' minHeight={180} />
      </Box>
    ),
    // input-with-multiple-values: source component has broken state — preview disabled
    'pickers-custom-input': (
      <TextField fullWidth label='Select Date' size='small' placeholder='dd-MMM-yyyy' slotProps={{ input: { readOnly: true, endAdornment: <Icon icon='mdi:calendar' fontSize={18} /> } }} />
    ),
    'single-date-picker': (
      <SingleDatePicker date={new Date()} onChangeHandler={() => {}} name='demo-date' popperPlacement='bottom-start' maxDate={null as any} size={null as any} />
    ),
    'custom-date-range-picker': (
      <CustomDateRangePicker label='Select Date Range' monthsShown={2} onChange={() => {}} disableFutureDates={false as any} open={undefined as any} />
    ),
    'common-date-range-pickers': (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Icon icon='mdi:calendar-range' fontSize={48} color={theme.palette.customColors.Tertiary} style={{ marginBottom: 12 }} />
        <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 1 }}>CommonDateRangePickers</Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Button with preset date ranges: Today, Yesterday, Last 7 days, Last 1 month, Last 6 months, All Time, and Custom Range dialog with dual calendar.
        </Typography>
        <Chip label='Uses next/router — preview available only in Pages Router pages' size='small' color='warning' variant='outlined' />
      </Box>
    ),
    'custom-option-date-range-pickers': (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Icon icon='mdi:calendar-clock' fontSize={48} color={theme.palette.customColors.Tertiary} style={{ marginBottom: 12 }} />
        <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 1 }}>CustomOptionDateRangePickers</Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Extended date range picker with single-date toggle mode. All preset ranges plus a switch to select individual dates instead of ranges.
        </Typography>
        <Chip label='Uses next/router — preview available only in Pages Router pages' size='small' color='warning' variant='outlined' />
      </Box>
    ),
    'species-illustration-card': (
      <Box sx={{ width: 300 }}>
        <SpeciesIllustrationCard eggDetails={{ default_icon: '/images/branding/Antz_logomark_h_color.svg', default_common_name: 'Golden Eagle', complete_name: 'Aquila chrysaetos' }} theme={theme} />
      </Box>
    ),
    'media-card': (
      <NewMediaCard fileUrl='/images/branding/Antz_logomark_h_color.svg' fileName='animal_photo.jpg' user={{ created_at: '2024-03-01T10:30:00Z', user_profile: { user_full_name: 'Dr. Naseer', user_profile_pic: '' } } as any} width={280} height={200} showTitle />
    ),
  }

  const preview = PREVIEW_MAP[slug]

  if (preview) return <>{preview}</>

  // Fallback for components without a mapped preview
  return (
    <Box sx={{ textAlign: 'center', p: 4 }}>
      <Icon icon='mdi:puzzle-outline' fontSize={40} color={theme.palette.primary.main} style={{ marginBottom: 8 }} />
      <Typography variant='subtitle2' fontWeight={600}>{comp.name}</Typography>
      <Typography variant='caption' color='text.secondary'>Open playground to interact</Typography>
    </Box>
  )
}

function generateUsageCode(comp: NonNullable<ReturnType<typeof getComponentBySlug>>): string {
  // Filter out nested data.* props — they go inside the data object
  const topLevelProps = comp.props.filter(p => !p.name.includes('.'))
  const nestedProps = comp.props.filter(p => p.name.includes('.'))
  const isHookOrUtil = comp.category === 'hook' || comp.category === 'utility'

  if (isHookOrUtil) {
    const params = topLevelProps.filter(p => !p.name.startsWith('returns'))
    const returns = topLevelProps.filter(p => p.name.startsWith('returns'))
    const lines: string[] = []
    if (returns.length > 1) {
      const retNames = returns.map(r => r.name.replace('returns.', ''))
      lines.push(`const { ${retNames.join(', ')} } = ${comp.name}(${params.map(p => p.name).join(', ')})`)
    } else if (returns.length === 1) {
      lines.push(`const ${returns[0].name.replace('returns', 'result')} = ${comp.name}(${params.map(p => p.name).join(', ')})`)
    } else {
      lines.push(`${comp.name}(${params.map(p => p.name).join(', ')})`)
    }
    return lines.join('\n')
  }

  const lines = [`<${comp.name}`]

  // Group nested props by parent (e.g., data.*)
  const nestedGroups: Record<string, typeof nestedProps> = {}
  nestedProps.forEach(p => {
    const parent = p.name.split('.')[0]
    if (!nestedGroups[parent]) nestedGroups[parent] = []
    nestedGroups[parent].push(p)
  })

  // Render object props with nested values
  Object.entries(nestedGroups).forEach(([parent, children]) => {
    lines.push(`  ${parent}={{`)
    children.forEach(p => {
      const key = p.name.split('.').slice(1).join('.')
      const val = getExampleValue(p)
      lines.push(`    ${key}: ${val},`)
    })
    lines.push('  }}')
  })

  // Render top-level props
  topLevelProps.forEach(p => {
    // Skip if already rendered as nested group parent
    if (nestedGroups[p.name]) return

    if (p.type.includes('=>') || p.type.includes('void') || p.type.includes('Promise')) {
      // Callback props
      const handler = p.name === 'onClose' || p.name === 'close' || p.name === 'closeDialog'
        ? '() => setOpen(false)'
        : p.name === 'onChange'
        ? 'handleChange'
        : `handle${p.name.charAt(0).toUpperCase()}${p.name.slice(1)}`
      lines.push(`  ${p.name}={${handler}}`)
    } else if (p.type === 'boolean') {
      if (p.default === 'true') {
        // Only show if you'd set it to false
        lines.push(`  ${p.name}={true}`)
      } else {
        lines.push(`  ${p.name}`)
      }
    } else if (p.type === 'ReactNode') {
      lines.push(`  ${p.name}={<YourComponent />}`)
    } else if (p.type === 'object' || p.type === 'Array' || p.type.startsWith('Array')) {
      lines.push(`  ${p.name}={${p.name}}`)
    } else if (p.type === 'number') {
      lines.push(`  ${p.name}={${p.default || '0'}}`)
    } else {
      // String or enum
      const val = p.default?.replace(/'/g, '') || getExampleString(p)
      lines.push(`  ${p.name}="${val}"`)
    }
  })

  lines.push('/>')
  return lines.join('\n')
}

function getExampleValue(p: ComponentProp): string {
  if (p.default) return `'${p.default.replace(/'/g, '')}'`
  if (p.type.startsWith("'")) return p.type.split('|')[0].trim()
  if (p.type === 'string') return `'${getExampleString(p)}'`
  if (p.type === 'number') return '0'
  if (p.type === 'boolean') return 'false'
  return "'...'"
}

function getExampleString(p: ComponentProp): string {
  const n = p.name.toLowerCase()
  if (n.includes('name') || n.includes('title')) return 'African Lion'
  if (n.includes('description') || n.includes('text')) return 'Sample description text'
  if (n.includes('icon') || n.includes('image') || n.includes('src')) return '/path/to/image.png'
  if (n.includes('id')) return 'AID-001'
  if (n.includes('color')) return 'theme.palette.primary.main'
  if (n.includes('age')) return '5 years'
  if (n.includes('weight')) return '190 kg'
  if (n.includes('label')) return 'Label'
  if (n.includes('date') || n.includes('time')) return '2024-03-15T10:30:00Z'
  if (n.includes('sex') || n.includes('gender')) return 'male'
  if (n.includes('enclosure')) return 'Savanna Hall'
  if (n.includes('section')) return 'South Wing'
  if (n.includes('site')) return 'Main Zoo'
  return '...'
}

const ComponentDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const theme = useTheme()
  const slug = (params?.component ?? '') as string

  const comp = useMemo(() => getComponentBySlug(slug), [slug])

  if (!comp) {
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <Typography variant='h6'>Component not found</Typography>
        <Button onClick={() => router.push('/component-library')} sx={{ mt: 2 }}>
          Back to Library
        </Button>
      </Box>
    )
  }

  const relatedComps = (comp.relatedComponents ?? [])
    .map(slug => COMPONENT_REGISTRY.find(c => c.slug === slug))
    .filter(Boolean)

  const usageCode = generateUsageCode(comp)
  const categoryColor = resolveColorKey(getCategoryColorKey(comp.category), theme)
  const isHookOrUtil = comp.category === 'hook' || comp.category === 'utility'

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 4 }}>
        <Link
          underline='hover'
          color='primary'
          sx={{ cursor: 'pointer' }}
          onClick={() => router.push('/component-library')}
        >
          Component Library
        </Link>
        <Typography color='text.secondary'>{comp.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Left Column */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Component Header */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                backgroundColor: `${categoryColor}1A`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Icon
                icon={isHookOrUtil ? 'mdi:hook' : 'mdi:puzzle-outline'}
                color={categoryColor}
                fontSize={24}
              />
            </Box>
            <Box>
              <Typography variant='h5' fontWeight={600} sx={{ mb: 0.5 }}>
                {comp.name}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.6 }}>
                {comp.description}
              </Typography>
            </Box>
          </Box>

          {/* Meta Badges */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 4, flexWrap: 'wrap' }}>
            <Chip
              icon={<Icon icon='mdi:folder-outline' fontSize={16} />}
              label={comp.path}
              size='small'
              variant='outlined'
              sx={{ borderColor: theme.palette.customColors.SurfaceVariant }}
            />
            <Chip
              icon={<Icon icon='mdi:tag-outline' fontSize={16} />}
              label={getCategoryLabel(comp.category)}
              size='small'
              sx={{ backgroundColor: `${categoryColor}1A`, color: categoryColor }}
            />
            <Chip
              icon={<Icon icon='mdi:tune-vertical' fontSize={16} />}
              label={`${comp.props.length} ${isHookOrUtil ? 'Returns' : 'Props'}`}
              size='small'
              sx={{
                backgroundColor: theme.palette.customColors.antzInfoLight,
                color: theme.palette.secondary.dark
              }}
            />
          </Box>

          {/* Preview Section */}
          {!isHookOrUtil && (
            <Card sx={{ mb: 4, border: `1px solid ${theme.palette.customColors.SurfaceVariant}`, boxShadow: 'none' }}>
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.customColors.SurfaceVariant}`
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Icon icon='mdi:eye-outline' color={theme.palette.primary.main} fontSize={18} />
                  <Typography variant='subtitle2' fontWeight={600}>
                    Preview
                  </Typography>
                </Box>
                <Button
                  size='small'
                  variant='contained'
                  startIcon={<Icon icon='mdi:play' fontSize={16} />}
                  onClick={() => router.push(`/component-library/${slug}/playground`)}
                >
                  Open Playground
                </Button>
              </Box>
              <Box
                sx={{
                  p: 5,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 240,
                  background: `linear-gradient(180deg, ${theme.palette.customColors.displaybgPrimary} 0%, ${theme.palette.customColors.Background} 100%)`
                }}
              >
                <ComponentPreview comp={comp} theme={theme} />
              </Box>
            </Card>
          )}

          {/* Props Table */}
          <Card sx={{ border: `1px solid ${theme.palette.customColors.SurfaceVariant}`, boxShadow: 'none' }}>
            <Box
              sx={{
                px: 3,
                py: 2,
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.customColors.SurfaceVariant}`
              }}
            >
              <Icon icon='mdi:format-list-bulleted' color={theme.palette.primary.main} fontSize={18} />
              <Typography variant='subtitle2' fontWeight={600}>
                {isHookOrUtil ? 'Parameters & Returns' : 'Props'}
              </Typography>
            </Box>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.customColors.tableHeaderBg }}>
                    <TableCell sx={{ fontWeight: 600, width: 180 }}>
                      {isHookOrUtil ? 'Name' : 'Prop Name'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 140 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 80 }}>Required</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 100 }}>Default</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comp.props.map((prop, i) => (
                    <TableRow
                      key={prop.name}
                      sx={{
                        backgroundColor: i % 2 === 1 ? theme.palette.customColors.Surface : 'transparent',
                        '&:hover': { backgroundColor: theme.palette.customColors.OnBackground }
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant='body2'
                          fontWeight={500}
                          color='primary'
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {prop.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' color='text.secondary' sx={{ fontFamily: 'monospace' }}>
                          {prop.type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {prop.required ? (
                          <Chip label='Required' size='small' sx={{ height: 20, fontSize: 10, fontWeight: 600, backgroundColor: theme.palette.error.main, color: theme.palette.primary.contrastText }} />
                        ) : (
                          <Typography variant='caption' color='text.disabled'>Optional</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' color='text.disabled'>
                          {prop.default ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' color='text.secondary'>
                          {prop.description}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>

        {/* Right Sidebar */}
        <Box sx={{ width: 320, flexShrink: 0 }}>
          {/* Usage Example */}
          <Card sx={{ mb: 3, border: `1px solid ${theme.palette.customColors.SurfaceVariant}`, boxShadow: 'none' }}>
            <Box
              sx={{
                px: 3,
                py: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.customColors.SurfaceVariant}`
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Icon icon='mdi:code-tags' color={theme.palette.primary.main} fontSize={18} />
                <Typography variant='subtitle2' fontWeight={600}>
                  Usage Example
                </Typography>
              </Box>
              <Button
                size='small'
                startIcon={<Icon icon='mdi:content-copy' fontSize={14} />}
                onClick={() => navigator.clipboard.writeText(usageCode)}
              >
                Copy
              </Button>
            </Box>
            <Box
              sx={{
                p: 2,
                backgroundColor: theme.palette.customColors.darkBg,
                borderRadius: '0 0 10px 10px',
                overflow: 'auto'
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontFamily: "'Inter', monospace",
                  fontSize: 12,
                  lineHeight: 1.8,
                  color: '#CDD6F4',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {usageCode}
              </pre>
            </Box>
          </Card>

          {/* Related Components */}
          {relatedComps.length > 0 && (
            <Card sx={{ border: `1px solid ${theme.palette.customColors.SurfaceVariant}`, boxShadow: 'none' }}>
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.customColors.SurfaceVariant}`
                }}
              >
                <Icon icon='mdi:link-variant' color={theme.palette.secondary.main} fontSize={18} />
                <Typography variant='subtitle2' fontWeight={600}>
                  Related Components
                </Typography>
              </Box>
              {relatedComps.map(rc => (
                <Box
                  key={rc!.slug}
                  sx={{
                    px: 3,
                    py: 2,
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'center',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                    '&:hover': { backgroundColor: theme.palette.customColors.Surface },
                    '&:last-child': { borderBottom: 'none' }
                  }}
                  onClick={() => router.push(`/component-library/${rc!.slug}`)}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '6px',
                      backgroundColor: `${resolveColorKey(getCategoryColorKey(rc!.category), theme)}1A`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon icon='mdi:puzzle-outline' color={resolveColorKey(getCategoryColorKey(rc!.category), theme)} fontSize={14} />
                  </Box>
                  <Box>
                    <Typography variant='body2' fontWeight={500}>
                      {rc!.name}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {rc!.description.slice(0, 50)}...
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default ComponentDetailPage
