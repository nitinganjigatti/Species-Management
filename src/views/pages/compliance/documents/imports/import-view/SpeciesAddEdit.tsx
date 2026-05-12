import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Divider,
  Button,
  alpha,
  useMediaQuery,
  Alert,
  CircularProgress,
  Grid,
  TextField
} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExportPermitDrawer from '../drawer/ExportPermitDrawer'
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import AnimalDetailsDrawer from '../drawer/AnimalDetailsDrawer'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import FileUpload from 'src/views/forms/form-elements/file-uploader/ComplianceFileUploader'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import type { ExportPermit, ExportSpecies } from 'src/types/compliance'

interface DraftData {
  export: ExportPermit[]
  [key: string]: unknown
}

interface SpeciesAddEditProps {
  setexportPermitDrawerOpen: (open: boolean) => void
  exportPermitDrawerOpen: boolean
  exportsTotalCount: number
  scrollContainerRef: React.RefObject<HTMLElement>
  selectedExportData: { export: ExportPermit[]; others?: unknown[] }
  setSelectedExportData: React.Dispatch<React.SetStateAction<{ export: ExportPermit[]; others?: unknown[] }>>
  handleRemoveExportDataAtIndex: (id: unknown) => void
  handleScroll: (e: React.UIEvent<HTMLElement>) => void
  isLoading: boolean
  exportsList: ExportPermit[]
  handleSearch: (val: string) => void
  onSave: () => void
  onCancel: () => void
  draftData: DraftData
  setDraftData: React.Dispatch<React.SetStateAction<DraftData>>
  setanimalDetailsDrawerOpen: (open: boolean) => void
  setAnimalDetails: (data: ExportSpecies) => void
  animalDetailsDrawerOpen: boolean
  animalDetails: ExportSpecies
  setDetailType: (type: string) => void
  detailtype: string
  setanimalCountDrawerOpen?: (open: boolean) => void
  setCurrentSpeciesId?: (id: unknown) => void
  setSelectedSpeciesData?: (data: ExportSpecies) => void
  setSearchValue: (val: string) => void
  loader: boolean
  loading: boolean
  uploadedFile: File | { name?: string; file_original_name?: string } | null
  setUploadedFile: (file: File | { name?: string; file_original_name?: string } | null) => void
  errors: Record<string, string | null | undefined>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string | null | undefined>>>
  airwaybillvalue: string
  setAirwaybillvalue: (val: string) => void
  startDate: string | Date | Dayjs | null
  setStartDate: (date: string | Date | Dayjs | null) => void
}

const SpeciesAddEdit = ({
  setexportPermitDrawerOpen,
  exportPermitDrawerOpen,
  exportsTotalCount,
  scrollContainerRef,
  selectedExportData,
  setSelectedExportData,
  handleRemoveExportDataAtIndex,
  handleScroll,
  isLoading,
  exportsList,
  handleSearch,
  onSave,
  onCancel,
  draftData,
  setDraftData,
  setanimalDetailsDrawerOpen,
  setAnimalDetails,
  animalDetailsDrawerOpen,
  animalDetails,
  setDetailType,
  detailtype,
  setanimalCountDrawerOpen,
  setCurrentSpeciesId,
  setSelectedSpeciesData,
  setSearchValue,
  loader,
  loading,
  uploadedFile,
  setUploadedFile,
  errors,
  setErrors,
  airwaybillvalue,
  setAirwaybillvalue,
  startDate,
  setStartDate
}: SpeciesAddEditProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'))

  const handleAirwaybillChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = event.target.value

    setAirwaybillvalue(inputValue)
    setErrors(prev => ({ ...prev, airwaybillvalue: null }))
  }

  const handleFileUpload = (file: File | null) => {
    setUploadedFile(file)
    setErrors(prev => ({ ...prev, uploadedFile: null }))
  }

  const totalSpeciesCount = selectedExportData.export?.reduce(
    (count, exportItem) => count + (exportItem.species?.length || 0),
    0
  )

  const totalAnimals = selectedExportData.export.reduce((total, exportItem) => {
    const exportTotal = exportItem.species?.reduce((speciesSum, speciesItem) => {
      return (
        speciesSum +
        parseInt(String(speciesItem.male_count || 0)) +
        parseInt(String(speciesItem.female_count || 0)) +
        parseInt(String(speciesItem.undeterminate_count || 0))
      )
    }, 0)

    return total + (exportTotal || 0)
  }, 0)

  const handleAnimalClick = (speciesdata: ExportSpecies, type: string) => {
    setanimalDetailsDrawerOpen(true)
    setAnimalDetails(speciesdata)
    setDetailType(type)
  }

  const handleDateChange = (date: Dayjs | null) => {
    setStartDate(date)
    setErrors(prev => ({ ...prev, startDate: null }))
  }

  return (
    <Box component='form' sx={{ pt: 0 }}>
      <Typography
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          color: theme.palette.customColors.OnSurfaceVariant,
          fontWeight: '500',
          fontSize: '18px',
          pb: '15px'
        }}
      >
        {`1. ${t('compliance_module.import_permit_details')}`}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label={`${t('compliance_module.enter_certificate_id')}*`}
            variant='outlined'
            value={airwaybillvalue}
            onChange={handleAirwaybillChange}
            error={Boolean(errors.airwaybillvalue)}
            helperText={errors.airwaybillvalue}
            inputProps={{
              maxLength: 25,
              style: { borderRadius: 8 }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={`${t('compliance_module.date_of_issue')}*`}
              value={startDate ? dayjs(startDate as string) : null}
              onChange={handleDateChange as any}
              maxDate={dayjs(new Date())}
              views={['year', 'month', 'day']}
              format='Do MMM YYYY'
              slotProps={{
                textField: {
                  error: Boolean(errors.startDate),
                  helperText: errors.startDate,
                  sx: {
                    '& .MuiInputBase-input': { padding: '17px' },
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#44544a82' } },
                    width: '100%',
                    height: '56px'
                  }
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FileUpload
            name={t('compliance_module.awb_airway_bill')}
            onFileUpload={handleFileUpload}
            file={uploadedFile}
          />
          {errors.uploadedFile && (
            <Typography
              sx={{ color: theme.palette.customColors.errorText, fontSize: '12px', fontWeight: '400', mt: 1 }}
            >
              {errors.uploadedFile}
            </Typography>
          )}
        </Grid>
      </Grid>
      <Box sx={{ mt: 6 }}>
        <Typography
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: '500',
            fontSize: '18px',
            pb: '15px'
          }}
        >
          {`2. ${t('compliance_module.export_permit')}`}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Typography
            sx={{
              fontSize: '18px',
              color: theme.palette.customColors.OnSurfaceVariant,
              fontWeight: 500
            }}
          >
            {t('compliance_module.species_count')}: <strong>{totalSpeciesCount > 0 ? totalSpeciesCount : '0'}</strong>
          </Typography>
          <Typography
            sx={{
              fontSize: '18px',
              color: theme.palette.customColors.OnSurfaceVariant,
              fontWeight: 500
            }}
          >
            {t('compliance_module.animal_count')}: <strong>{totalAnimals}</strong>
          </Typography>
        </Box>

        {selectedExportData?.export?.length > 0 || (selectedExportData as any)?.others?.length > 0 ? (
          <>
            {/* Render export data if exists */}
            {selectedExportData?.export?.length > 0 &&
              selectedExportData.export.map((all, index) => {
                const totalAnimals =
                  all.species?.reduce(
                    (sum, species) =>
                      sum +
                      Number(species.male_count || 0) +
                      Number(species.female_count || 0) +
                      Number(species.undeterminate_count || 0),
                    0
                  ) || 0

                return (
                  <Box
                    key={index}
                    sx={{
                      bgcolor: '#E8F4F266',
                      p: 4,
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      borderRadius: '8px',
                      mb: 6
                    }}
                  >
                    <Paper elevation={3} sx={{ p: 0, backgroundColor: 'transparent', boxShadow: 'none' }}>
                      {/* Header */}
                      <Box display='flex' justifyContent='space-between' alignItems='start' mb={3}>
                        <Box>
                          <Typography
                            sx={{
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontWeight: 500,
                              fontSize: '20px'
                            }}
                          >
                            {t('compliance_module.export_id_label')} {all.export_number}
                          </Typography>
                        </Box>

                        <Box display='flex' alignItems='center' gap={1} key={`export-${all.id}`}>
                          <IconButton onClick={() => handleRemoveExportDataAtIndex(all.id)}>
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      </Box>

                      <Box
                        display='flex'
                        alignItems='center'
                        justifyContent='space-between'
                        sx={{
                          borderRadius: '8px',
                          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                          px: 4,
                          pt: 3,
                          pb: 4,
                          backgroundColor: theme.palette.common.white,
                          width: '100%',
                          margin: '0 auto',
                          boxShadow: 'none'
                        }}
                      >
                        {/* Exporter Section */}
                        <Box sx={{ width: '45%' }}>
                          <Typography sx={{ color: theme.palette.customColors.secondaryBg, fontWeight: '400' }}>
                            {t('compliance_module.exporter')}
                          </Typography>
                          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: '500' }}>
                            {all?.exporter_name || 'N/A'}, {all.exporting_country || 'N/A'}
                          </Typography>
                        </Box>

                        {/* Arrow */}
                        <ArrowForwardIcon sx={{ color: '#757575' }} />

                        {/* Importer Section */}
                        <Box sx={{ width: '45%' }}>
                          <Typography sx={{ color: theme.palette.customColors.secondaryBg, fontWeight: '400' }}>
                            {t('compliance_module.importer')}
                          </Typography>
                          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}>
                            {all?.importer_name || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Species Summary */}
                      <Box
                        sx={{
                          borderRadius: '8px',
                          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                          mb: 2,
                          mt: 5
                        }}
                      >
                        <Box
                          display='flex'
                          justifyContent='space-between'
                          alignItems='center'
                          sx={{
                            background: theme.palette.customColors.lightBg,
                            px: 4,
                            py: 2,
                            borderTopLeftRadius: '10px',
                            borderTopRightRadius: '10px'
                          }}
                        >
                          <Typography
                            sx={{
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontSize: '16px',
                              fontWeight: 500
                            }}
                          >
                            {all?.species?.length} {t('species')} • {totalAnimals} {t('animals')}
                          </Typography>
                        </Box>

                        <Divider />

                        {/* Species List */}
                        <Box
                          sx={{
                            background: theme.palette.common.white,
                            pt: 1,
                            borderBottomLeftRadius: '10px',
                            borderBottomRightRadius: '10px'
                          }}
                        >
                          {all?.species?.map((speciesdata, idx) => (
                            <Box
                              key={idx}
                              display='flex'
                              justifyContent='space-between'
                              // py={2}
                              sx={{
                                borderBottom: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
                                px: 4,
                                py: 2,
                                cursor: 'pointer'
                              }}
                              onClick={() => handleAnimalClick(speciesdata, 'export')}
                            >
                              <Box className='export_dtl_list'>
                                <Typography
                                  fontWeight='medium'
                                  sx={{
                                    color: theme.palette.customColors.OnSurfaceVariant,
                                    fontWeight: 500,
                                    fontSize: '16px'
                                  }}
                                >
                                  {speciesdata.common_name || 'N/A'}
                                </Typography>
                                <Typography
                                  fontStyle='italic'
                                  sx={{
                                    color: theme.palette.customColors.OnSurfaceVariant,
                                    fontWeight: 400,
                                    fontSize: '14px'
                                  }}
                                >
                                  {speciesdata.scientific_name || 'N/A'}
                                </Typography>
                              </Box>
                              <Box display='flex' alignItems='center' gap={2} flex={1}>
                                <Typography
                                  sx={{
                                    color: theme.palette.customColors.OnSurfaceVariant,
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    mr: 2
                                  }}
                                >
                                  {t('count')} :{' '}
                                  {Number(speciesdata.male_count) +
                                    Number(speciesdata.female_count) +
                                    Number(speciesdata.undeterminate_count)}
                                </Typography>
                                <Chip
                                  label={`M - ${speciesdata.male_count || 0}`}
                                  size='small'
                                  sx={{
                                    background: alpha(theme.palette.customColors.SecondaryContainer || '', 0.5),
                                    borderRadius: '4px',
                                    px: 2,
                                    color: theme.palette.customColors.addPrimary,
                                    fontSize: '14px',
                                    fontWeight: 500
                                  }}
                                />

                                <Chip
                                  label={`F - ${speciesdata.female_count || 0}`}
                                  size='small'
                                  sx={{
                                    background: alpha(theme.palette.customColors.customDropdownColor || '', 0.15),
                                    borderRadius: '4px',
                                    px: 2,
                                    color: (theme.palette as any).formContent?.tertiary,
                                    fontSize: '14px',
                                    fontWeight: 500
                                  }}
                                />
                                <Chip
                                  label={`U - ${speciesdata.undeterminate_count || 0}`}
                                  size='small'
                                  sx={{
                                    background: theme.palette.customColors.displaybgSecondary,
                                    borderRadius: '4px',
                                    px: 2,
                                    color: theme.palette.primary.light,
                                    fontSize: '14px',
                                    fontWeight: 500
                                  }}
                                />
                              </Box>
                              <Box display='flex' alignItems='center'>
                                <ChevronRightIcon sx={{ fontSize: '30px' }} />
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                )
              })}
          </>
        ) : (
          <Alert severity={errors?.selectedExportData ? 'error' : 'info'} sx={{ my: 4 }}>
            {errors?.selectedExportData ||
              t('compliance_module.at_least_one_species_must_be_selected_to_proceed_with_the_form_submission')}
          </Alert>
        )}

        <Box
          sx={{
            width: '100%',
            backgroundColor: alpha(theme.palette.customColors.displaybgPrimary || '', 0.4),
            p: 8,
            my: 4,
            borderRadius: 2
          }}
        >
          <Button
            variant='outlined'
            onClick={() => setexportPermitDrawerOpen(true)}
            startIcon={<AddIcon />}
            sx={{
              width: !isSmallDevice ? '100%' : '100%',
              py: 2,
              mr: 4,
              fontSize: '1rem',
              fontWeight: 500,
              border: '2px dashed',
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.common.white,
              '&:hover': {
                border: '2px dashed',
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            {t('compliance_module.add_export_permit')}
          </Button>
        </Box>

        <ExportPermitDrawer
          open={exportPermitDrawerOpen}
          onClose={() => {
            setexportPermitDrawerOpen(false), setSearchValue('')
          }}
          handleSearch={handleSearch}
          exportsList={exportsList}
          exportsTotalCount={exportsTotalCount}
          handleScroll={handleScroll}
          scrollContainerRef={scrollContainerRef}
          isLoading={isLoading}
          selectedExportData={selectedExportData}
          setSelectedExportData={
            setSelectedExportData as React.Dispatch<React.SetStateAction<{ export: ExportPermit[] }>>
          }
          title={t('compliance_module.add_export_permit')}
          setDraftData={setDraftData}
          draftData={draftData}
          loader={loader}
          setexportPermitDrawerOpen={setexportPermitDrawerOpen}
          setSearchValue={setSearchValue}
        />

        <AnimalDetailsDrawer
          open={animalDetailsDrawerOpen}
          onClose={() => setanimalDetailsDrawerOpen(false)}
          animalDetails={animalDetails}
          detailtype={detailtype}
          setanimalCountDrawerOpen={setanimalCountDrawerOpen}
          setCurrentSpeciesId={setCurrentSpeciesId}
          setSelectedSpeciesData={setSelectedSpeciesData}
          title={t('compliance_module.animal_details')}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
        <Button variant='outlined' onClick={onCancel}>
          {t('reset')}
        </Button>
        <Button
          variant='contained'
          onClick={onSave}
          disabled={loading}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            minWidth: 120
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {t('save_details')}
            {loading && <CircularProgress size={16} sx={{ color: '#ccc' }} />}
          </span>
        </Button>
      </Box>
    </Box>
  )
}

export default SpeciesAddEdit
