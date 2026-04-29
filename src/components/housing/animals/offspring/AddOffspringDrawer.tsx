import React, { useEffect, useState, useMemo, useContext } from 'react'
import { Box, Card, Chip, Drawer, IconButton, Typography, useTheme, Grid } from '@mui/material'
import { styled, alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { addOffspring, getClutchList, getLitterList, getRecentClutchList } from 'src/lib/api/housing'
import Utility from 'src/utility'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import { LoadingButton } from '@mui/lab'
import AnimalCard from 'src/views/utility/AnimalCard'
import { AuthContext } from 'src/context/AuthContext'
import MultiSelectAnimalDrawer, {
  Animal as MultiSelectAnimal
} from 'src/components/housing/animals/lineage/MultiSelectAnimalDrawer'
import debounce from 'lodash/debounce'
import Toaster from 'src/components/Toaster'
import { useTranslation } from 'react-i18next'
import LitterSelectionDrawer from './LitterSelectionDrawer'
import {
  StyledTypographyProps,
  AddOffspringDrawerProps,
  AddOffspringPayload,
  AnimalItem,
  ClutchItem,
  LitterItem
} from 'src/types/housing/animalsOffspring'
import LineageFilterDrawer, { type LineageFilters, DEFAULT_LINEAGE_FILTERS } from '../lineage/LineageFilterDrawer'

type ReferenceType = 'litter' | 'clutch'
type ReferenceItem = LitterItem | ClutchItem

const AddOffspringDrawer = ({ open, onClose, onAcceptSuccess, animalId, animalsDetails }: AddOffspringDrawerProps) => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const authData = useContext(AuthContext)
  const reproductionType = animalsDetails?.reproduction_type
  const isEggLayingAnimal = reproductionType === 'egg-laying'
  const isMaleAnimal = animalsDetails?.sex === 'male'
  const requiresDamSelection = isEggLayingAnimal && isMaleAnimal
  const referenceType: ReferenceType = isEggLayingAnimal ? 'clutch' : 'litter'

  const options = [
    { label: t('animals_module.existing'), value: 'existing' },
    { label: t('animals_module.create_new'), value: 'createNew' }
  ]

  const zooId = (authData as any)?.userData?.user?.zoos[0]?.zoo_id

  const [selectedOption, setSelectedOption] = useState<string>('createNew')
  const [loading, setLoading] = useState<boolean>(false)
  const [selectedDam, setSelectedDam] = useState<AnimalItem | null>(null)
  const [damError, setDamError] = useState<boolean>(false)
  const [selectedSire, setSelectedSire] = useState<AnimalItem | null>(null)
  const [selectedOffspring, setSelectedOffspring] = useState<AnimalItem[]>([])
  const [showAllSelectedOffspring, setShowAllSelectedOffspring] = useState<boolean>(false)
  const [animalDrawerOpen, setAnimalDrawerOpen] = useState<boolean>(false)
  const [litterDrawerOpen, setLitterDrawerOpen] = useState<boolean>(false)
  const [selectionType, setSelectionType] = useState<string>('')
  const [offspringError, setOffspringError] = useState<boolean>(false)
  const [referenceError, setReferenceError] = useState<boolean>(false)
  const [searchInput, setSearchInput] = useState<string>('')
  const [searchLitter, setSearchLitter] = useState<string>('')
  const [selectedReference, setSelectedReference] = useState<ReferenceItem | null>(null)
  const [tempSelectedReference, setTempSelectedReference] = useState<ReferenceItem | null>(null)
  const [recentReference, setRecentReference] = useState<ReferenceItem | null>(null)
  const [referenceList, setReferenceList] = useState<ReferenceItem[]>([])
  const [isReferenceFetching, setIsReferenceFetching] = useState<boolean>(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(false)
  const [animalFilters, setAnimalFilters] = useState<LineageFilters>(DEFAULT_LINEAGE_FILTERS)
  const [filterCount, setFilterCount] = useState<number>(0)

  const referenceAnimalId = requiresDamSelection ? selectedDam?.animal_id : animalId

  // Debounce search input
  const debouncedSearchLitter = useMemo(() => debounce(setSearchLitter, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearchLitter.cancel()
    }
  }, [debouncedSearchLitter])

  // const fetchRecentReference = async () => {
  //   if (!referenceAnimalId) return
  //   setIsReferenceFetching(true)
  //   try {
  //     if (isEggLayingAnimal) {
  //       const response = await getClutchList({
  //         animal_id: referenceAnimalId,
  //         page_no: 1
  //       })
  //       const result = response?.data?.result as ClutchItem[] | undefined
  //       setRecentReference(result?.[0] || null)
  //     } else {
  //       const response = await getLitterList({
  //         animal_id: referenceAnimalId,
  //         is_recent: 1
  //       })
  //       setRecentReference((response?.data as unknown as LitterItem) || null)
  //     }
  //   } catch (error: any) {
  //     console.error(`Error fetching recent ${referenceType}:`, error?.message)
  //   } finally {
  //     setIsReferenceFetching(false)
  //   }
  // }
  const fetchRecentReference = async () => {
    if (!referenceAnimalId) return
    setIsReferenceFetching(true)
    try {
      if (isEggLayingAnimal) {
        const response = await getRecentClutchList({ mother_id: referenceAnimalId })
        const result = response?.data
        const rawRecentClutch = Array.isArray(result) ? result[0] || null : result ?? null
        const recentClutch = rawRecentClutch
          ? ({
              ...rawRecentClutch,
              clutch_id: rawRecentClutch?.clutch_id || rawRecentClutch?.id,
              start_date: rawRecentClutch?.start_date || rawRecentClutch?.created_at
            } as ClutchItem & { id?: string | number })
          : null

        setRecentReference(response?.success && recentClutch?.clutch_id ? recentClutch : null)
      } else {
        const response = await getLitterList({
          animal_id: referenceAnimalId,
          is_recent: 1
        })
        const recentLitter = response?.data as unknown as LitterItem | null

        setRecentReference(response?.success && recentLitter?.litter_id ? recentLitter : null)
      }
    } catch (error: any) {
      console.error(`Error fetching recent ${referenceType}:`, error?.message)
      setRecentReference(null)
    } finally {
      setIsReferenceFetching(false)
    }
  }

  const fetchReferenceList = async () => {
    if (!referenceAnimalId) return
    setIsReferenceFetching(true)
    try {
      if (isEggLayingAnimal) {
        const response = await getClutchList({
          animal_id: referenceAnimalId,
          page_no: 1
        })
        if (response?.success) {
          const result = response.data?.result as ClutchItem[] | undefined
          const query = searchLitter.trim().toLowerCase()

          setReferenceList(
            query
              ? (result ?? []).filter(
                  item =>
                    item?.clutch_no?.toLowerCase().includes(query) ||
                    item?.clutch_id?.toString().toLowerCase().includes(query)
                )
              : result ?? []
          )
        } else {
          setReferenceList([])
        }
      } else {
        const response = await getLitterList({
          animal_id: referenceAnimalId,
          is_recent: 0,
          q: searchLitter
        })
        setReferenceList((response?.data?.result as unknown as LitterItem[]) || [])
      }
    } catch (error: any) {
      console.error(`Error fetching ${referenceType} list:`, error?.message)
      setReferenceList([])
    } finally {
      setIsReferenceFetching(false)
    }
  }

  const handleAddOffspring = async () => {
    let hasError = false

    if (requiresDamSelection && !selectedDam) {
      setDamError(true)
      hasError = true
    }

    if (selectedOption === 'existing' && !selectedReference) {
      setReferenceError(true)
      hasError = true
    }

    if (!selectedOffspring.length) {
      setOffspringError(true)
      hasError = true
    }

    if (hasError) return

    setDamError(false)
    setOffspringError(false)
    setReferenceError(false)

    setLoading(true)
    try {
      const params: AddOffspringPayload = {
        offspring_ids: JSON.stringify(selectedOffspring.map(a => String(a.animal_id))),
        mother_id: requiresDamSelection ? Number(selectedDam?.animal_id) : animalId,
        ref_type: referenceType,
        create_new: selectedOption === 'createNew' ? true : false,
        ...(selectedReference
          ? {
              ref_id: isEggLayingAnimal
                ? (selectedReference as ClutchItem)?.clutch_id
                : (selectedReference as LitterItem)?.litter_id
            }
          : {}),
        father_id: requiresDamSelection ? animalId : selectedSire?.animal_id
      }
      const response = await addOffspring(params)
      if (response?.success) {
        handleClose()
        onAcceptSuccess()
        Toaster({ type: 'success', message: response?.message || 'Offspring added successfully' })
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to add offspring' })
      }
    } catch (error: any) {
      console.error('Error adding offspring:', error?.message)
    } finally {
      setLoading(false)
    }
  }

  // Handles search input change with debouncing
  const handleSearchLitter = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearchLitter(value)
  }

  // Clears search input and updates filters
  const handleSearchLitterClear = (): void => {
    setSearchInput('')
    setSearchLitter('')
  }

  const handleSelectReference = (reference: ReferenceItem) => {
    setTempSelectedReference(reference)
    setReferenceError(false)
  }

  const handleSubmitReference = () => {
    setSelectedReference(tempSelectedReference)
    setLitterDrawerOpen(false)
  }

  const handleOpenReference = () => {
    setTempSelectedReference(selectedReference)
    setLitterDrawerOpen(false)
    setLitterDrawerOpen(true)
  }
  const handleLiterDrawerClose = () => {
    setLitterDrawerOpen(false)
  }

  const handleClose = () => {
    onClose()
    setSelectedOption('createNew')
    setSelectedDam(null)
    setDamError(false)
    setSelectedReference(null)
    setSearchInput('')
    setSearchLitter('')
    setSelectedOffspring([])
    setShowAllSelectedOffspring(false)
    setSelectedSire(null)
    setTempSelectedReference(null)
    setOffspringError(false)
    setReferenceError(false)
    setAnimalFilters(DEFAULT_LINEAGE_FILTERS)
    setFilterCount(0)
    setFilterDrawerOpen(false)
  }

  // Handle filter apply
  const handleApplyFilters = (filters: LineageFilters) => {
    setAnimalFilters(filters)
  }

  // Build extra params for MultiSelectAnimalDrawer based on selectionType + filters
  const buildExtraParams = (): Record<string, any> => {
    const baseParams: Record<string, any> =
      selectionType === 'dam'
        ? {
            zoo_id: zooId,
            list_type: 'animals',
            type: 'single',
            ignore_permission: 1,
            reproduction_type: animalsDetails?.reproduction_type,
            tsn_id: animalsDetails?.taxonomy_id,
            include_dead_animal: 1,
            gender: 'female',
            use_case: 'add_parent',
            relevant_animal_id: animalsDetails?.aid
          }
        : selectionType === 'sire'
        ? {
            zoo_id: zooId,
            list_type: 'animals',
            type: animalsDetails?.type,
            ignore_permission: 1,
            reproduction_type: animalsDetails?.reproduction_type,
            tsn_id: animalsDetails?.taxonomy_id,
            include_dead_animal: 1,
            gender: 'male',
            use_case: 'add_parent',
            relevant_animal_id: animalsDetails?.aid
          }
        : {
            zoo_id: zooId,
            list_type: 'animals',
            type: animalsDetails?.type,
            ignore_permission: 1,
            reproduction_type: animalsDetails?.reproduction_type,
            tsn_id: animalsDetails?.taxonomy_id,
            include_dead_animal: 1,
            use_case: requiresDamSelection ? 'add_offspring_father' : 'add_offspring_mother',
            relevant_animal_id: requiresDamSelection
              ? selectedDam?.animal_id
                ? `${selectedDam.animal_id},${animalsDetails?.aid}`
                : animalsDetails?.aid
              : selectedSire?.animal_id
              ? `${animalsDetails?.aid},${selectedSire.animal_id}`
              : animalsDetails?.aid
          }

    const { localSelections, statusFilter } = animalFilters

    if (localSelections.Sites.length > 0) {
      baseParams.site_id = localSelections.Sites.map(s => String(s.site_id))
    }
    if (localSelections.Sections.length > 0) {
      baseParams.section_id = localSelections.Sections.map(s => String(s.section_id))
    }
    if (localSelections.Enclosures.length > 0) {
      baseParams.enclosure_id = localSelections.Enclosures.map(e => String(e.enclosure_id))
    }

    if (statusFilter === 'dead') {
      baseParams.include_dead_animal = 1
      baseParams.is_dead = 1
    } else if (statusFilter === 'missing') {
      baseParams.is_missing = 1
    } else if (statusFilter === 'transferred') {
      baseParams.is_transferred = 1
    }

    return baseParams
  }

  // Render active filter chips
  const renderFilterChips = (): React.ReactNode => {
    const chips: React.ReactNode[] = []
    const { localSelections, statusFilter } = animalFilters

    localSelections.Sites.forEach(site => {
      chips.push(
        <Chip
          key={`site-${site.site_id}`}
          label={site.site_name}
          size='small'
          color='primary'
          variant='outlined'
          onDelete={() => {
            setAnimalFilters(prev => ({
              ...prev,
              localSelections: {
                Sites: prev.localSelections.Sites.filter(s => s.site_id !== site.site_id),
                Sections: [],
                Enclosures: []
              }
            }))
            setFilterCount(prev => Math.max(0, prev - 1))
          }}
        />
      )
    })

    localSelections.Sections.forEach(section => {
      chips.push(
        <Chip
          key={`section-${section.section_id}`}
          label={section.section_name}
          size='small'
          color='primary'
          variant='outlined'
          onDelete={() => {
            setAnimalFilters(prev => ({
              ...prev,
              localSelections: {
                ...prev.localSelections,
                Sections: prev.localSelections.Sections.filter(s => s.section_id !== section.section_id),
                Enclosures: []
              }
            }))
            setFilterCount(prev => Math.max(0, prev - 1))
          }}
        />
      )
    })

    localSelections.Enclosures.forEach(enclosure => {
      chips.push(
        <Chip
          key={`enclosure-${enclosure.enclosure_id}`}
          label={enclosure.user_enclosure_name}
          size='small'
          color='primary'
          variant='outlined'
          onDelete={() => {
            setAnimalFilters(prev => ({
              ...prev,
              localSelections: {
                ...prev.localSelections,
                Enclosures: prev.localSelections.Enclosures.filter(e => e.enclosure_id !== enclosure.enclosure_id)
              }
            }))
            setFilterCount(prev => Math.max(0, prev - 1))
          }}
        />
      )
    })

    if (statusFilter && statusFilter !== 'alive') {
      const statusLabel = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
      chips.push(
        <Chip
          key='status'
          label={statusLabel}
          size='small'
          color='primary'
          variant='outlined'
          onDelete={() => {
            setAnimalFilters(prev => ({ ...prev, statusFilter: 'alive' }))
            setFilterCount(prev => Math.max(0, prev - 1))
          }}
        />
      )
    }

    if (chips.length === 0) return null

    return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>{chips}</Box>
  }

  useEffect(() => {
    if (open && referenceAnimalId) {
      fetchRecentReference()
    }
  }, [open, referenceAnimalId, referenceType])

  useEffect(() => {
    if (litterDrawerOpen && referenceAnimalId) {
      fetchReferenceList()
    }
  }, [litterDrawerOpen, referenceAnimalId, searchLitter, referenceType])

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={handleClose}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 560 },
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.customColors?.OnPrimary,
              p: 0,
              height: '100%'
            }
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 4,
              borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              backgroundColor: theme.palette.customColors.OnPrimary,
              flexShrink: 0
            }}
          >
            <Typography
              sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
            >
              {t('animals_module.add_offspring')}
            </Typography>

            <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary }}>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              backgroundColor: theme.palette.background.default
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                p: 4,
                gap: 4
              }}
            >
              {requiresDamSelection && (
                <Card
                  sx={{ padding: 4, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Icon icon='mdi:gender-female' fontSize={24} />
                    <StyledTypography fontWeight={600}>{t('animals_module.select_dam')}</StyledTypography>
                  </Box>
                  {!selectedDam && (
                    <>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                          borderRadius: 1,
                          p: 4,
                          background: theme.palette.customColors.Surface,
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setSelectionType('dam')
                          setAnimalDrawerOpen(true)
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '16px',
                            fontWeight: 400,
                            color: theme.palette.customColors.OnPrimaryContainer
                          }}
                        >
                          {t('animals_module.select_animal')}
                        </Typography>
                        <Icon icon={'simple-line-icons:plus'} color={theme.palette.customColors.addPrimary} />
                      </Box>
                      {damError && (
                        <Typography
                          sx={{
                            mt: 2,
                            fontSize: '14px',
                            color: theme.palette.error.main
                          }}
                        >
                          {t('animals_module.please_select_dam')}
                        </Typography>
                      )}
                    </>
                  )}
                  {selectedDam && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        p: 4
                      }}
                    >
                      <AnimalCard data={selectedDam} size='14px' />
                      <Box
                        onClick={e => {
                          e.stopPropagation()
                          setSelectedDam(null)
                          setSelectedReference(null)
                          setTempSelectedReference(null)
                          setReferenceError(false)
                          setDamError(false)
                          setSelectedOffspring([])
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: theme.palette.error.main,
                          ml: 4,
                          p: 1,
                          borderRadius: '50%',
                          zIndex: 2,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.1)
                          }
                        }}
                      >
                        <Icon icon={'carbon:close-outline'} fontSize={24} />
                      </Box>
                    </Box>
                  )}
                </Card>
              )}

              {(!requiresDamSelection || selectedDam) && (
                <Card
                  sx={{ padding: 4, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <img
                      src={isEggLayingAnimal ? '/icons/clutchEgg.svg' : '/icons/icon_species_diet.png'}
                      style={{ width: '25px', height: '25px' }}
                      alt='clutch'
                    />
                    <StyledTypography fontWeight={600}>
                      {t(isEggLayingAnimal ? 'animals_module.add_clutch_details' : 'animals_module.add_litter_details')}
                    </StyledTypography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {recentReference ? (
                      <>
                        <StyledTypography fontSize={'14px'}>
                          {t(
                            isEggLayingAnimal
                              ? 'animals_module.recent_clutch_details'
                              : 'animals_module.recent_litter_details'
                          )}
                        </StyledTypography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: theme.palette.customColors.cardHeaderBg,
                            p: 3,
                            borderRadius: 1,
                            gap: 2
                          }}
                        >
                          <StyledTypography fontSize={'14px'} fontWeight={500}>
                            {isEggLayingAnimal
                              ? (recentReference as ClutchItem)?.clutch_no
                              : (recentReference as LitterItem)?.litter_no}
                          </StyledTypography>{' '}
                          |
                          <Icon icon='uil:calender' fontSize={24} />
                          <StyledTypography fontSize={'14px'}>
                            {Utility.convertUtcToLocalReadableDate(recentReference?.start_date)}
                          </StyledTypography>
                        </Box>
                      </>
                    ) : null}
                    <Grid container spacing={4}>
                      {options.map((item, index) => {
                        const isSelected = selectedOption === item.value

                        return (
                          <Grid key={index} size={{ xs: 12, sm: 6 }}>
                            <TreatmentTypeRadioButtons
                              label={item.label}
                              isSelected={selectedOption === item.value}
                              onClick={() => {
                                if (selectedOption !== item.value) {
                                  setSelectedOption(item.value)
                                  setSelectedReference(null)
                                  setTempSelectedReference(null)
                                  setReferenceError(false)
                                }
                              }}
                              radioPosition='right'
                              selectedBackgroundColor={theme.palette.customColors.OnPrimaryContainer}
                              selectedFontColor={theme.palette.primary.contrastText}
                              selectedBorderColor='none'
                              borderColor='none'
                              backgroundColor={!isSelected ? theme.palette.customColors.Surface : undefined}
                              disabled={item.value === 'existing' && !recentReference}
                            />
                          </Grid>
                        )
                      })}
                      {selectedOption === 'existing' && (
                        <Grid size={12}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <StyledTypography fontWeight={600}>
                              {t(isEggLayingAnimal ? 'animals_module.clutch' : 'animals_module.litter')}*
                            </StyledTypography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                borderRadius: 1,
                                p: 4,
                                background: theme.palette.customColors.Surface,
                                cursor: 'pointer'
                              }}
                              onClick={handleOpenReference}
                            >
                              {selectedReference ? (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%'
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2
                                    }}
                                  >
                                    <StyledTypography fontSize={'14px'} fontWeight={500}>
                                      {isEggLayingAnimal
                                        ? (selectedReference as ClutchItem)?.clutch_no
                                        : (selectedReference as LitterItem)?.litter_no}
                                    </StyledTypography>{' '}
                                    |
                                    <Icon icon='uil:calender' fontSize={24} />
                                    <StyledTypography fontSize={'14px'}>
                                      {Utility.convertUtcToLocalReadableDate(selectedReference?.start_date)}
                                    </StyledTypography>
                                  </Box>
                                  <Box
                                    onClick={e => {
                                      e.stopPropagation()
                                      setSelectedReference(null)
                                      setTempSelectedReference(null)
                                      setReferenceError(false)
                                    }}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      zIndex: 2
                                    }}
                                  >
                                    <Icon
                                      icon={'carbon:close-outline'}
                                      fontSize={24}
                                      color={theme.palette.error.main}
                                    />
                                  </Box>
                                </Box>
                              ) : (
                                <>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      width: '100%'
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontSize: '16px',
                                        fontWeight: 400,
                                        color: theme.palette.customColors.OnPrimaryContainer
                                      }}
                                    >
                                      {t(
                                        isEggLayingAnimal
                                          ? 'animals_module.select_clutch'
                                          : 'animals_module.select_litter'
                                      )}
                                    </Typography>
                                    <Icon icon={'iconamoon:arrow-down-2-duotone'} />
                                  </Box>
                                </>
                              )}
                            </Box>
                            {selectedOption === 'existing' && referenceError && (
                              <Typography
                                sx={{
                                  fontSize: '14px',
                                  color: theme.palette.error.main
                                }}
                              >
                                {t(
                                  isEggLayingAnimal
                                    ? 'animals_module.please_select_clutch'
                                    : 'animals_module.please_select_litter'
                                )}
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      )}
                      <LitterSelectionDrawer
                        open={litterDrawerOpen}
                        type={referenceType}
                        searchInput={searchInput}
                        isLoading={isReferenceFetching}
                        items={referenceList}
                        selectedItem={tempSelectedReference}
                        onClose={handleLiterDrawerClose}
                        onSearchChange={handleSearchLitter}
                        onSearchClear={handleSearchLitterClear}
                        onSelectItem={handleSelectReference}
                        onSubmit={handleSubmitReference}
                      />
                    </Grid>
                  </Box>
                </Card>
              )}

              {!requiresDamSelection && (
                <Card
                  sx={{ padding: 4, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Icon icon='mynaui:male' fontSize={24} />
                    <StyledTypography fontWeight={600}>{t('animals_module.select_sire_optional')}</StyledTypography>
                  </Box>
                  {!selectedSire && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRadius: 1,
                        p: 4,
                        background: theme.palette.customColors.Surface,
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSelectionType('sire')
                        setAnimalDrawerOpen(true)
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '16px',
                          fontWeight: 400,
                          color: theme.palette.customColors.OnPrimaryContainer
                        }}
                      >
                        {t('animals_module.select_animal')}
                      </Typography>
                      <Icon icon={'simple-line-icons:plus'} color={theme.palette.customColors.addPrimary} />
                    </Box>
                  )}
                  {selectedSire && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        p: 4
                      }}
                    >
                      <AnimalCard data={selectedSire} size='14px' />
                      <Box
                        onClick={e => {
                          e.stopPropagation()
                          setSelectedSire(null)
                          setSelectedOffspring([]) // clear offspring
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: theme.palette.error.main,
                          ml: 4,
                          p: 1,
                          borderRadius: '50%',
                          zIndex: 2,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.1)
                          }
                        }}
                      >
                        <Icon icon={'carbon:close-outline'} fontSize={24} />
                      </Box>
                    </Box>
                  )}
                </Card>
              )}

              <Card sx={{ padding: 4, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Icon icon='ph:paw-print' fontSize={24} />
                  <StyledTypography fontWeight={600}>{t('animals_module.offspring')}*</StyledTypography>
                </Box>
                {!selectedOffspring.length && (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRadius: 1,
                        p: 4,
                        background: theme.palette.customColors.Surface,
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSelectionType('offspring')
                        setAnimalDrawerOpen(true)
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '16px',
                          fontWeight: 400,
                          color: theme.palette.customColors.OnPrimaryContainer
                        }}
                      >
                        {t('animals_module.select_animal')}
                      </Typography>
                      <Icon icon={'simple-line-icons:plus'} color={theme.palette.customColors.addPrimary} />
                    </Box>
                    {offspringError && (
                      <Typography
                        sx={{
                          mt: 2,
                          fontSize: '14px',
                          color: theme.palette.error.main
                        }}
                      >
                        {t('animals_module.please_select_offspring')}
                      </Typography>
                    )}
                  </>
                )}
                {selectedOffspring?.length > 0 && (
                  <Box
                    sx={{
                      borderRadius: '8px',
                      border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: theme.palette.customColors?.displaybgPrimary,
                        p: 4,
                        borderBottom: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Typography
                        sx={{
                          color: theme.palette.customColors?.OnSurfaceVariant,
                          fontWeight: 500,
                          fontSize: '1rem'
                        }}
                      >
                        {t('selected')} - {selectedOffspring?.length}
                      </Typography>
                      <IconButton
                        size='small'
                        onClick={() => {
                          setSelectionType('offspring')
                          setAnimalDrawerOpen(true)
                        }}
                        sx={{ color: theme.palette.customColors.addPrimary, p: 0 }}
                      >
                        <Icon icon='gala:add' fontSize={24} />
                      </IconButton>
                    </Box>
                    {(showAllSelectedOffspring ? selectedOffspring : selectedOffspring.slice(0, 2)).map(
                      (animal, index) => (
                        <Box
                          key={animal?.animal_id || index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 4,
                            borderBottom:
                              index <
                              (showAllSelectedOffspring ? selectedOffspring : selectedOffspring.slice(0, 2)).length - 1
                                ? `1px solid ${theme.palette.customColors?.OutlineVariant}`
                                : 'none'
                          }}
                        >
                          <AnimalCard data={animal} size='14px' />
                          <Box
                            onClick={e => {
                              e.stopPropagation()
                              setSelectedOffspring(prev => prev.filter(a => a.animal_id !== animal.animal_id))
                            }}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: theme.palette.error.main,
                              ml: 4,
                              p: 1,
                              borderRadius: '50%',
                              zIndex: 2,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.error.main, 0.1)
                              }
                            }}
                          >
                            <Icon icon={'carbon:close-outline'} fontSize={24} />
                          </Box>
                        </Box>
                      )
                    )}
                    {selectedOffspring?.length > 2 && (
                      <Box
                        onClick={() => setShowAllSelectedOffspring(prev => !prev)}
                        sx={{
                          bgcolor: alpha(theme.palette.customColors.addPrimary, 0.2),
                          py: 4,
                          cursor: 'pointer'
                        }}
                      >
                        <Typography
                          sx={{
                            color: theme.palette.customColors?.OnPrimaryContainer,
                            fontWeight: 500,
                            fontSize: '1rem',
                            textAlign: 'center'
                          }}
                        >
                          {showAllSelectedOffspring ? t('show_less') : `+ ${selectedOffspring.length - 2} ${t('more')}`}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Card>
            </Box>
          </Box>
          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              boxShadow: `0px -2px 6px ${alpha(theme.palette.customColors.deepDark, 0.1)}`,
              bottom: 0,
              position: 'sticky',
              zIndex: 1
            }}
          >
            <LoadingButton
              variant='contained'
              onClick={handleAddOffspring}
              // loading={submitLoader}
              sx={{ flex: 1, py: 4 }}
              disabled={
                (selectedOption === 'createNew' && !selectedOffspring.length) ||
                (selectedOption === 'existing' && (!selectedReference || !selectedOffspring.length))
              }
            >
              {t('done')}
            </LoadingButton>
          </Box>
        </Box>
      </Drawer>
      {animalDrawerOpen && (
        <MultiSelectAnimalDrawer
          open={animalDrawerOpen}
          onClose={() => setAnimalDrawerOpen(false)}
          showFilterButton={true}
          filterCount={filterCount}
          onFilterClick={() => setFilterDrawerOpen(true)}
          onSelect={animals => {
            if (selectionType === 'dam') {
              setSelectedDam(prev => {
                const newDam = (animals[0] as unknown as AnimalItem) || null
                const hasDamChanged = prev?.animal_id !== newDam?.animal_id

                if (hasDamChanged) {
                  setSelectedReference(null)
                  setTempSelectedReference(null)
                  setReferenceError(false)
                  setSelectedOffspring([])
                }

                setDamError(false)

                return newDam
              })
            }

            if (selectionType === 'sire') {
              const newSire = (animals[0] as unknown as AnimalItem) || null

              setSelectedSire(prev => {
                if (prev?.animal_id !== newSire?.animal_id) {
                  setSelectedOffspring([]) // clear offspring when sire changes
                }
                return newSire
              })
            }

            if (selectionType === 'offspring') {
              setSelectedOffspring(prev => {
                const map = new Map(prev.map(a => [a.animal_id, a]))

                animals.forEach(a => {
                  if (a.animal_id) map.set(a.animal_id, a as unknown as AnimalItem)
                })

                return Array.from(map.values())
              })
            }
          }}
          initialSelectedAnimals={
            selectionType === 'dam'
              ? selectedDam
                ? [selectedDam as unknown as MultiSelectAnimal]
                : []
              : selectionType === 'sire'
              ? selectedSire
                ? [selectedSire as unknown as MultiSelectAnimal]
                : []
              : (selectedOffspring as unknown as MultiSelectAnimal[])
          }
          title={
            selectionType === 'dam'
              ? t('animals_module.select_dam')
              : selectionType === 'sire'
              ? t('animals_module.select_sire')
              : t('animals_module.select_offspring')
          }
          btnText={t('add')}
          selectionMode={selectionType === 'dam' || selectionType === 'sire' ? 'single' : 'multi'}
          extraParams={buildExtraParams()}
          filterChips={renderFilterChips()}
        />
      )}

      {/* Filter Drawer */}
      <LineageFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={animalFilters}
        setFilterCount={setFilterCount}
      />
    </>
  )
}

export default React.memo(AddOffspringDrawer)

const StyledTypography = styled(Typography)<StyledTypographyProps>(({ theme, fontWeight, fontSize, color, sx }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || (theme as any).palette?.customColors?.OnSurfaceVariant || (theme as any).palette?.text?.primary,
  ...(sx as any)
}))
