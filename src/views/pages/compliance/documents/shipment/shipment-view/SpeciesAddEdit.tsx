import React, { useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Divider,
  Stack,
  Button,
  alpha,
  useMediaQuery,
  Alert,
  CircularProgress
} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExportPermitDrawer from '../drawer/ExportPermitDrawer'
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material'
import useSafeRouter from 'src/hooks/useSafeRouter'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import LinkedShipmentsDrawer from '../drawer/LinkedShipmentsDrawer'
import SpeciesDrawer from 'src/components/compliance/drawer/SpeciesDrawer'
import AddAnimalsDrawer from '../drawer/AddAnimalsDrawer'
import { getExportAnimalList } from 'src/lib/api/compliance/shipment'
import AnimalDetailsDrawer from '../drawer/AnimalDetailsDrawer'
import UploadDocument from 'src/views/forms/form-elements/file-uploader/UploadDocument'
import { Species } from 'src/types/compliance'

interface AnimalItem {
  id?: string | number
  gender?: string
  identifier_type?: string
  identifier_value?: string
  animal_type?: string
  animal_count?: number
  [key: string]: unknown
}

interface SpeciesData {
  id?: string | number
  tsn_id?: string | number
  taxonomy_id?: string | number
  common_name?: string
  scientific_name?: string
  default_icon?: string
  appendix?: string
  shipment_species_id?: string | number
  male_count?: number | string
  female_count?: number | string
  undeterminate_count?: number | string
  total_count?: number
  animals?: AnimalItem[]
  [key: string]: unknown
}

interface SpeciesItem {
  id: string | number
  species: SpeciesData
}

interface ExportItem {
  export_id: string | number
  export_number?: string
  attachment?: unknown
  linked_shipments_count?: number
  shipment_count?: number
  total_species?: number
  species: SpeciesData[]
  shipments?: unknown[]
  [key: string]: unknown
}

interface OtherItem {
  id?: string | number
  species?: SpeciesData
  [key: string]: unknown
}

interface SelectedExportData {
  export: ExportItem[]
  others: OtherItem[]
}

interface DraftData {
  export: unknown[]
  others: unknown[]
}

interface SpeciesAddEditProps {
  handleLinkedshipmentClick: (shipments: unknown[]) => void
  speciesDrawerOpen: boolean
  linkedShipmentsDrawerOpen: boolean
  setLinkedShipmentsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
  linkedShipmentsData?: unknown[]
  setSpeciesDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
  setexportPermitDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
  exportPermitDrawerOpen: boolean
  setSpeciesList: React.Dispatch<React.SetStateAction<SpeciesItem[]>>
  onExportCardSelect: (data: SelectedExportData) => void
  exportsTotalCount: number
  scrollContainerRef: React.RefObject<HTMLDivElement>
  selectedExportData: SelectedExportData
  setSelectedExportData: React.Dispatch<React.SetStateAction<SelectedExportData>>
  handleRemoveExportDataAtIndex: (exportId: string | number) => void
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void
  isLoading: boolean
  exportsList: unknown[]
  handleSearch: (val: string) => void
  onSave: () => void
  onCancel: () => void
  draftData: DraftData
  setDraftData: React.Dispatch<React.SetStateAction<DraftData>>
  handleSpeciesSelect: (selectedSpecies: Species[]) => void
  speciesList: SpeciesItem[]
  animalCountDrawerOpen?: boolean
  addAnimalsDrawerOpen: boolean
  setAddAnimalsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
  setexportAnimalData: React.Dispatch<React.SetStateAction<unknown[]>>
  exportID: string
  setexportID: React.Dispatch<React.SetStateAction<string>>
  setExportNumber: React.Dispatch<React.SetStateAction<string>>
  exportNumber: string
  exportAnimalData: unknown[]
  setanimalDetailsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
  setAnimalDetails: React.Dispatch<React.SetStateAction<AnimalItem[]>>
  animalDetailsDrawerOpen: boolean
  animalDetails: AnimalItem[]
  setDetailType: React.Dispatch<React.SetStateAction<string>>
  detailtype: string
  setanimalCountDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
  setCurrentSpeciesId: React.Dispatch<React.SetStateAction<string | number | null>>
  setSelectedSpeciesData: React.Dispatch<React.SetStateAction<Species & { common_name?: string; scientific_name?: string; default_icon?: string }>>
  setSearchValue: React.Dispatch<React.SetStateAction<string>>
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  shipmentId: string | number
  loading: boolean
  loader?: boolean
}

const SpeciesAddEdit = ({
  handleLinkedshipmentClick,
  speciesDrawerOpen,
  linkedShipmentsDrawerOpen,
  setLinkedShipmentsDrawerOpen,
  linkedShipmentsData,
  setSpeciesDrawerOpen,
  setexportPermitDrawerOpen,
  exportPermitDrawerOpen,
  setSpeciesList,
  onExportCardSelect,
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
  handleSpeciesSelect,
  speciesList,
  animalCountDrawerOpen,
  addAnimalsDrawerOpen,
  setAddAnimalsDrawerOpen,
  setexportAnimalData,
  exportID,
  setexportID,
  setExportNumber,
  exportNumber,
  exportAnimalData,
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
  setLoading,
  shipmentId,
  loading,
  loader
}: SpeciesAddEditProps) => {
  const theme = useTheme()
  const router = useSafeRouter()
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'))

  const handleFileUpload = (exportId: string | number, file: unknown) => {
    setSelectedExportData(prev => {
      const updated = {
        ...prev,
        export: prev.export.map(exporta => ({ ...exporta }))
      }

      const exportIndex = updated.export.findIndex(e => String(e.export_id) === String(exportId))

      if (exportIndex === -1) {
        return prev
      }

      updated.export[exportIndex] = {
        ...updated.export[exportIndex],
        attachment: file
      }

      return updated
    })
  }

  const handleRemoveOtherSpecies = (index: number) => {
    const speciesIdToRemove = selectedExportData.others[index]?.id

    setSelectedExportData(prev => ({
      ...prev,
      others: prev.others.filter((_, i) => i !== index)
    }))

    setDraftData(prev => ({
      ...prev,
      others: prev.others.filter((_, i) => i !== index)
    }))

    setSpeciesList(prev => prev.filter(item => item.id !== speciesIdToRemove))
  }

  const handleClickAnimals = (val: string | number, expNum: string) => {
    setAddAnimalsDrawerOpen(true)
    setexportID(String(val))
    setExportNumber(expNum)
    setDraftData(JSON.parse(JSON.stringify(selectedExportData)))
  }

  const fetchExportAnimalData = async () => {
    try {
      setLoading(true)
      if (exportID) {
        const response = await getExportAnimalList(exportID, shipmentId)

        setLoading(false)
        setexportAnimalData(response.data as unknown as unknown[])
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching species data:', error)
    }
  }

  useEffect(() => {
    if (addAnimalsDrawerOpen) {
      fetchExportAnimalData()
    }
  }, [addAnimalsDrawerOpen])

  const handleAnimalClick = (speciesdata: SpeciesData, type: string) => {
    setanimalDetailsDrawerOpen(true)
    setAnimalDetails(speciesdata as unknown as AnimalItem[])
    setDetailType(type)
  }

  const getCounts = (selectedExportData: SelectedExportData) => {
    const speciesFromExport =
      selectedExportData?.export?.reduce((sum, exp) => {
        return sum + (exp.species?.length || 0)
      }, 0) || 0

    const speciesFromOthers = selectedExportData?.others?.length || 0

    const speciesCount = speciesFromExport + speciesFromOthers

    const animalsFromExport =
      selectedExportData?.export?.reduce((sum, all) => {
        const total = all.species?.reduce(
          (s, sp) =>
            s + Number(sp.male_count || 0) + Number(sp.female_count || 0) + Number(sp.undeterminate_count || 0),
          0
        )

        return sum + (total || 0)
      }, 0) || 0

    const animalsFromOthers =
      selectedExportData?.others?.reduce((sum, item) => {
        const sp = item.species || {}

        return (
          sum +
          Number((sp as SpeciesData)?.male_count || 0) +
          Number((sp as SpeciesData)?.female_count || 0) +
          Number((sp as SpeciesData)?.undeterminate_count || 0)
        )
      }, 0) || 0

    const animalsCount = animalsFromExport + animalsFromOthers

    return { speciesCount, animalsCount }
  }
  const { speciesCount, animalsCount } = getCounts(selectedExportData)

  return (
    <Box sx={{ pt: 0 }}>
      <Box sx={{ mt: 0 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 5 }}>
          <Typography
            sx={{
              fontSize: '18px',
              color: theme.palette.customColors.OnSurfaceVariant,
              fontWeight: 500
            }}
          >
            Species : <strong>{speciesCount > 0 ? speciesCount : '0'}</strong>
          </Typography>
          <Typography
            sx={{
              fontSize: '18px',
              color: theme.palette.customColors.OnSurfaceVariant,
              fontWeight: 500
            }}
          >
            Animals : <strong>{animalsCount > 0 ? animalsCount : '0'}</strong>
          </Typography>
        </Box>

        {selectedExportData?.export?.length > 0 || selectedExportData?.others?.length > 0 ? (
          <>
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
                      <Box display='flex' justifyContent='space-between' alignItems='start' mb={2}>
                        <Box>
                          <Typography
                            sx={{
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontWeight: 500,
                              fontSize: '20px'
                            }}
                          >
                            Export ID : {all.export_number}
                          </Typography>
                          <Typography
                            color={theme.palette.primary.dark}
                            sx={{
                              fontSize: '14px',
                              fontWeight: 500,
                              color:
                                (all.linked_shipments_count ?? all.shipment_count ?? 0) > 0
                                  ? theme.palette.primary.dark
                                  : '#A0A0A0',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor:
                                (all.linked_shipments_count ?? all.shipment_count ?? 0) > 0 ? 'pointer' : 'default'
                            }}
                            onClick={() => {
                              if ((all.linked_shipments_count ?? all.shipment_count ?? 0) > 0) {
                                handleLinkedshipmentClick(all.shipments || [])
                              }
                            }}
                          >
                            {`This export ID is part of ${all.linked_shipments_count ?? all.shipment_count ?? 0} `}
                            {`${
                              (all.linked_shipments_count ?? all.shipment_count ?? 0) === 1 ? 'shipment' : 'shipments'
                            }`}

                            <ChevronRightIcon sx={{ fontSize: '22px' }} />
                          </Typography>
                        </Box>
                        <Box display='flex' alignItems='center' gap={1} key={`export-${all.export_id}`}>
                          <UploadDocument
                            key={`uploader-${all.export_id}`}
                            name='Upload Export Permit'
                            onFileUpload={(file: unknown) => handleFileUpload(all.export_id, file)}
                            file={all.attachment ? all.attachment : null}
                          />
                          <IconButton onClick={() => handleRemoveExportDataAtIndex(all.export_id)}>
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      </Box>

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
                            {all?.species?.length} Species • {totalAnimals} Animals
                          </Typography>

                          <Typography
                            sx={{
                              color: theme.palette.primary.dark,
                              fontSize: '14px',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleClickAnimals(all.export_id, all.export_number || '')}
                          >
                            <Icon
                              style={{
                                fontSize: '18px',
                                cursor: 'pointer',
                                marginRight: '8px',
                                color: theme.palette.primary.dark
                              }}
                              icon='bx:pencil'
                            />
                            Edit Selection
                          </Typography>
                        </Box>

                        <Divider />

                        <Box
                          sx={{
                            background: theme.palette.common.white,
                            pt: 1,
                            borderBottomLeftRadius: '10px',
                            borderBottomRightRadius: '10px'
                          }}
                        >
                          {all.species.map((speciesdata, idx) => (
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
                                  Count :{' '}
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
                                    color: theme.palette.formContent?.tertiary,
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
                                    color: theme.palette.customColors.OnPrimaryContainer,
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

            {selectedExportData?.others?.length > 0 && (
              <Box
                sx={{
                  bgcolor: '#E8F4F266',
                  p: 4,
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: '8px',
                  mb: 6,
                  boxShadow: 'none'
                }}
              >
                <Paper elevation={3} sx={{ p: 0, backgroundColor: 'transparent', boxShadow: 'none' }}>
                  <Box display='flex' justifyContent='space-between' alignItems='start' mb={2}>
                    <Box>
                      <Typography
                        sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500, fontSize: '20px' }}
                      >
                        Other Animals (
                        {selectedExportData.others.reduce((sum, item) => {
                          const s = (item as OtherItem).species || {}

                          return (
                            sum +
                            (parseInt(String((s as SpeciesData).total_count)) ||
                              (parseInt(String((s as SpeciesData).male_count)) || 0) +
                                (parseInt(String((s as SpeciesData).female_count)) || 0) +
                                (parseInt(String((s as SpeciesData).undeterminate_count)) || 0))
                          )
                        }, 0)}{' '}
                        Animals)
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      borderRadius: '8px',
                      mb: 2,
                      mt: 5
                    }}
                  >
                    {selectedExportData.others.map((item, index) => {
                      const species = (item as OtherItem).species

                      const totalAnimals =
                        Number(species?.male_count || 0) +
                        Number(species?.female_count || 0) +
                        Number(species?.undeterminate_count || 0)

                      return (
                        <Box
                          key={index}
                          sx={{
                            background: theme.palette.common.white,
                            pl: 4,

                            // pt: 3,
                            // pb: 4,
                            borderRadius: '8px',
                            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                            mb: 3,
                            cursor: 'pointer'
                          }}
                          onClick={() => species && handleAnimalClick(species, 'others')}
                        >
                          <Box display='flex' justifyContent='space-between'>
                            <Box className='other_dtl_list' sx={{ pt: 3, pb: 4 }}>
                              <Typography
                                fontWeight='medium'
                                sx={{
                                  color: theme.palette.customColors.OnSurfaceVariant,
                                  fontWeight: 500,
                                  fontSize: '16px'
                                }}
                              >
                                {species?.common_name || 'N/A'}
                              </Typography>
                              <Typography
                                fontStyle='italic'
                                sx={{
                                  color: theme.palette.customColors.OnSurfaceVariant,
                                  fontWeight: 400,
                                  fontSize: '14px'
                                }}
                              >
                                {species?.scientific_name || 'N/A'}
                              </Typography>
                            </Box>
                            <Box display='flex' alignItems='center' gap={2} flex={1} sx={{ pt: 3, pb: 4 }}>
                              <Typography
                                sx={{
                                  color: theme.palette.customColors.OnSurfaceVariant,
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  mr: 2
                                }}
                              >
                                Count : {totalAnimals}
                              </Typography>
                              <Chip
                                label={`M - ${species?.male_count || 0}`}
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
                                label={`F - ${species?.female_count || 0}`}
                                size='small'
                                sx={{
                                  background: alpha(theme.palette.customColors.customDropdownColor || '', 0.15),
                                  borderRadius: '4px',
                                  px: 2,
                                  color: theme.palette.formContent?.tertiary,
                                  fontSize: '14px',
                                  fontWeight: 500
                                }}
                              />
                              <Chip
                                label={`U - ${species?.undeterminate_count || 0}`}
                                size='small'
                                sx={{
                                  background: theme.palette.customColors.displaybgSecondary,
                                  borderRadius: '4px',
                                  px: 2,
                                  color: theme.palette.customColors.OnPrimaryContainer,
                                  fontSize: '14px',
                                  fontWeight: 500
                                }}
                              />
                            </Box>

                            <Box display='flex' alignItems='center'>
                              <ChevronRightIcon sx={{ fontSize: '30px', mr: 5 }} />
                            </Box>
                            <Box
                              display='flex'
                              alignItems='center'
                              sx={{
                                background: theme.palette.customColors.mdAntzNeutral,
                                borderTopRightRadius: '8px',
                                borderBottomRightRadius: '8px'
                              }}
                            >
                              <IconButton
                                onClick={e => {
                                  e.stopPropagation()
                                  handleRemoveOtherSpecies(index)
                                }}
                                sx={{
                                  color: theme.palette.customColors.OnPrimaryContainer,
                                  mr: 0,
                                  '&:hover': {
                                    backgroundColor: 'transparent'
                                  }
                                }}
                              >
                                <CloseIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </Paper>
              </Box>
            )}
          </>
        ) : (
          <Alert severity='info' sx={{ my: 4 }}>
            At least one species must be selected.
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
              width: !isSmallDevice ? '49%' : '49%',
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
            Add From Export Permit
          </Button>
          <Button
            variant='outlined'
            onClick={() => setSpeciesDrawerOpen(true)}
            startIcon={<AddIcon />}
            sx={{
              width: !isSmallDevice ? '49%' : '45%',
              py: 2,
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
            Add Animals
          </Button>
        </Box>

        <ExportPermitDrawer
          open={exportPermitDrawerOpen}
          onClose={() => {
            setexportPermitDrawerOpen(false)
            setSearchValue('')
          }}

          //onSelect={handleSpeciesSelect}
          handleSearch={handleSearch}
          exportsList={exportsList as any}
          exportsTotalCount={exportsTotalCount}
          handleScroll={handleScroll}
          scrollContainerRef={scrollContainerRef}
          isLoading={isLoading}
          onExportCardSelect={onExportCardSelect as any}
          selectedExportData={selectedExportData as any}
          setSelectedExportData={setSelectedExportData as any}
          title='Add Export Permit'
          setDraftData={setDraftData as any}
          draftData={draftData as any}
          loader={loader ?? false}
          setexportPermitDrawerOpen={setexportPermitDrawerOpen}
          setSearchValue={setSearchValue}
          shipmentId={shipmentId}
        />

        <AddAnimalsDrawer
          open={addAnimalsDrawerOpen}
          onClose={() => setAddAnimalsDrawerOpen(false)}
          title='Add Animals'
          exportAnimalData={exportAnimalData as unknown as Parameters<typeof AddAnimalsDrawer>[0]['exportAnimalData']}
          exportID={exportID}
          onExportCardSelect={onExportCardSelect as any}
          selectedExportData={selectedExportData as any}
          setSelectedExportData={setSelectedExportData as any}
          exportNumber={exportNumber}
          loading={loading}
          setDraftData={setDraftData as any}
          draftData={draftData as any}
          setexportPermitDrawerOpen={setexportPermitDrawerOpen}
          setSearchValue={setSearchValue}
        />

        <LinkedShipmentsDrawer
          open={linkedShipmentsDrawerOpen}
          onClose={() => setLinkedShipmentsDrawerOpen(false)}
          linkedShipmentsData={(linkedShipmentsData || []) as Parameters<typeof LinkedShipmentsDrawer>[0]['linkedShipmentsData']}
          title='Linked Shipments'
        />
        <AnimalDetailsDrawer
          open={animalDetailsDrawerOpen}
          onClose={() => setanimalDetailsDrawerOpen(false)}
          animalDetails={animalDetails as unknown as Parameters<typeof AnimalDetailsDrawer>[0]['animalDetails']}
          detailtype={detailtype}
          setanimalCountDrawerOpen={setanimalCountDrawerOpen}
          setCurrentSpeciesId={setCurrentSpeciesId}
          setSelectedSpeciesData={setSelectedSpeciesData as Parameters<typeof AnimalDetailsDrawer>[0]['setSelectedSpeciesData']}
          title='Animal Details'
        />
        <SpeciesDrawer
          open={speciesDrawerOpen}
          onClose={() => setSpeciesDrawerOpen(false)}
          onSelect={handleSpeciesSelect}
          selectedSpecies={speciesList.map(item => item.species) as any}
          title='Select Species'
          data={{
            queryKey: 'export-permit-species',
            id: 'species-list',
            params: {}
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
        <Button variant='outlined' onClick={onCancel}>
          Reset
        </Button>
        <Button
          variant='contained'
          onClick={onSave}
          disabled={
            loading ||
            ((!selectedExportData?.export || selectedExportData.export.length === 0) &&
              (!selectedExportData?.others || selectedExportData.others.length === 0))
          }
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            minWidth: 120
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Save Details
            {loading && <CircularProgress size={16} sx={{ color: '#ccc' }} />}
          </span>
        </Button>
      </Box>
    </Box>
  )
}

export default SpeciesAddEdit
