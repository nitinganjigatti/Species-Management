import React, { useEffect, useState, useMemo, useContext } from 'react'
import { Box, Card, CircularProgress, Drawer, IconButton, Typography, useTheme, Grid, Radio } from '@mui/material'
import { styled, alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { getLitterList } from 'src/lib/api/housing'
import Utility from 'src/utility'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import { LoadingButton } from '@mui/lab'
import AnimalCard from 'src/views/utility/AnimalCard'
import { AuthContext } from 'src/context/AuthContext'
import MultiSelectAnimalDrawer, {
  Animal as MultiSelectAnimal
} from 'src/components/housing/animals/lineage/MultiSelectAnimalDrawer'
import { addOffspring } from 'src/lib/api/housing'
import Search from 'src/views/utility/Search'
import debounce from 'lodash/debounce'
import NoDataFound from 'src/views/utility/NoDataFound'
import Toaster from 'src/components/Toaster'
import {
  StyledTypographyProps,
  LitterItem,
  AddOffspringDrawerProps,
  AnimalItem
} from 'src/types/housing/animalsOffspring'

export interface AddOffspringPayload {
  offspring_ids: string[] | string
  mother_id: string | number
  ref_type: 'litter'
  create_new: boolean
  ref_id?: string | number
  father_id?: string | number
}

const options = [
  { label: 'Existing', value: 'existing' },
  { label: 'Create new', value: 'createNew' }
]

const AddOffspringDrawer = ({ open, onClose, onAcceptSuccess, animalId, animalsDetails }: AddOffspringDrawerProps) => {
  const theme = useTheme() as any
  const authData = useContext(AuthContext)

  const zooId = (authData as any)?.userData?.user?.zoos[0]?.zoo_id

  const [selectedOption, setSelectedOption] = useState('createNew')
  const [loading, setLoading] = useState<boolean>(false)
  const [selectedSire, setSelectedSire] = useState<AnimalItem | null>(null)
  const [selectedOffspring, setSelectedOffspring] = useState<AnimalItem[]>([])
  const [animalDrawerOpen, setAnimalDrawerOpen] = useState(false)
  const [litterDrawerOpen, setLitterDrawerOpen] = useState(false)
  const [selectionType, setSelectionType] = useState('')
  const [offspringError, setOffspringError] = useState(false)
  const [litterError, setLitterError] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchLitter, setSearchLitter] = useState('')
  const [selectedLitter, setSelectedLitter] = useState<any>(null)
  const [tempSelectedLitter, setTempSelectedLitter] = useState<any>(null)
  const [recentLitter, setRecentLitter] = useState<any>(null)
  const [isRecentLitterFetching, setIsRecentLitterFetching] = useState(false)
  const [litterList, setLitterList] = useState<any[]>([])
  const [isLitterFetching, setIsLitterFetching] = useState(false)

  // Debounce search input
  const debouncedSearchLitter = useMemo(() => debounce(setSearchLitter, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearchLitter.cancel()
    }
  }, [debouncedSearchLitter])

  const fetchRecentLitter = async () => {
    if (!animalId) return
    setIsRecentLitterFetching(true)
    try {
      const response = await getLitterList({
        animal_id: animalId,
        is_recent: 1
      })
      setRecentLitter(response?.data || null)
    } catch (error: any) {
      console.error('Error fetching recent litter:', error?.message)
    } finally {
      setIsRecentLitterFetching(false)
    }
  }

  const fetchLitterList = async () => {
    if (!animalId) return
    setIsLitterFetching(true)
    try {
      const response = await getLitterList({
        animal_id: animalId,
        is_recent: 0,
        q: searchLitter
      })
      setLitterList(response?.data?.result || [])
    } catch (error: any) {
      console.error('Error fetching litter list:', error?.message)
    } finally {
      setIsLitterFetching(false)
    }
  }

  const handleAddOffspring = async () => {
    let hasError = false

    if (selectedOption === 'existing' && !selectedLitter) {
      setLitterError(true)
      hasError = true
    }

    if (!selectedOffspring.length) {
      setOffspringError(true)
      hasError = true
    }

    if (hasError) return

    setOffspringError(false)
    setLitterError(false)

    setLoading(true)
    try {
      const params: AddOffspringPayload = {
        offspring_ids: JSON.stringify(selectedOffspring.map(a => Number(a.animal_id))),
        mother_id: animalId,
        ref_type: 'litter',
        create_new: selectedOption === 'createNew' ? true : false,
        ...(selectedLitter?.litter_id ? { ref_id: selectedLitter?.litter_id } : {}),
        father_id: selectedSire?.animal_id
      }
      const response = await addOffspring(params)
      if (response?.success) {
        onClose()
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

  const handleSelectLitter = (litter: any) => {
    setTempSelectedLitter(litter)
    setLitterError(false)
  }

  const handleSubmitLitter = () => {
    setSelectedLitter(tempSelectedLitter)
    setLitterDrawerOpen(false)
  }

  const handleOpenLitter = () => {
    setTempSelectedLitter(selectedLitter)
    setLitterDrawerOpen(false)
    setLitterDrawerOpen(true)
  }
  const handleLiterDrawerClose = () => {
    setLitterDrawerOpen(false)
  }

  const handleClose = () => {
    onClose()
    setSelectedOption('createNew')
    setSelectedLitter(null)
    setSearchInput('')
    setSearchLitter('')
    setSelectedOffspring([])
    setSelectedSire(null)
    setTempSelectedLitter(null)
    setOffspringError(false)
    setLitterError(false)
  }

  useEffect(() => {
    if (open && animalId) {
      fetchRecentLitter()
    }
  }, [open, animalId])

  useEffect(() => {
    if (litterDrawerOpen && animalId) {
      fetchLitterList()
    }
  }, [litterDrawerOpen, animalId, searchLitter])

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
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
              Add Offspring
            </Typography>

            <IconButton size='small' onClick={onClose} sx={{ color: theme.palette.text.primary }}>
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
              <Card sx={{ padding: 4, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Icon icon='ph:paw-print' fontSize={24} />
                  <StyledTypography fontWeight={600}>Add Litter Details</StyledTypography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {recentLitter?.litter_id ? (
                    <>
                      <StyledTypography fontSize={'14px'}>Recent Litter Details</StyledTypography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: theme.palette.customColors.lightBg,
                          p: 3,
                          borderRadius: 1,
                          gap: 2
                        }}
                      >
                        <StyledTypography fontSize={'14px'}>{recentLitter?.litter_no}</StyledTypography> |
                        <Icon icon='uil:calender' fontSize={24} />
                        <StyledTypography fontSize={'14px'}>
                          {Utility.convertUtcToLocalReadableDate(recentLitter?.created_at)}
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
                                setSelectedLitter(null)
                                setTempSelectedLitter(null)
                                setLitterError(false)
                              }
                            }}
                            radioPosition='right'
                            selectedBackgroundColor={theme.palette.customColors.OnPrimaryContainer}
                            selectedFontColor={theme.palette.primary.contrastText}
                            selectedBorderColor='none'
                            borderColor='none'
                            backgroundColor={!isSelected ? theme.palette.customColors.Surface : undefined}
                            disabled={item.value === 'existing' && !recentLitter?.litter_id}
                          />
                        </Grid>
                      )
                    })}
                    {selectedOption === 'existing' && (
                      <Grid size={12}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <StyledTypography fontWeight={600}>Litter*</StyledTypography>
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
                            onClick={handleOpenLitter}
                          >
                            {selectedLitter ? (
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
                                    {selectedLitter?.litter_no}
                                  </StyledTypography>{' '}
                                  |
                                  <Icon icon='uil:calender' fontSize={24} />
                                  <StyledTypography fontSize={'14px'}>
                                    {Utility.convertUtcToLocalReadableDate(
                                      selectedLitter?.start_date || selectedLitter?.created_at
                                    )}
                                  </StyledTypography>
                                </Box>
                                <Box
                                  onClick={e => {
                                    e.stopPropagation()
                                    setSelectedLitter(null)
                                    setTempSelectedLitter(null)
                                    setLitterError(false)
                                  }}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    zIndex: 2
                                  }}
                                >
                                  <Icon icon={'carbon:close-outline'} fontSize={24} color={theme.palette.error.main} />
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
                                    Select Litter
                                  </Typography>
                                  <Icon icon={'iconamoon:arrow-down-2-duotone'} />
                                </Box>
                              </>
                            )}
                          </Box>
                          {selectedOption === 'existing' && litterError && (
                            <Typography
                              sx={{
                                fontSize: '14px',
                                color: theme.palette.error.main
                              }}
                            >
                              Please select litter
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    )}
                    {litterDrawerOpen ? (
                      <Drawer
                        anchor='right'
                        open={litterDrawerOpen}
                        ModalProps={{ keepMounted: true }}
                        sx={{ '& .MuiDrawer-paper': { width: ['100%', 562] } }}
                      >
                        <Box
                          className='sidebar-header'
                          sx={{
                            display: 'flex',
                            position: 'sticky',
                            top: 0,
                            flexDirection: 'column',
                            backgroundColor: theme.palette.customColors.OnPrimary,
                            zIndex: 10
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 4 }}>
                            <Typography
                              sx={{
                                fontSize: '1.5rem',
                                fontWeight: 500,
                                color: theme.palette.customColors.OnSurfaceVariant
                              }}
                            >
                              Select Litter
                            </Typography>

                            <IconButton
                              size='small'
                              onClick={handleLiterDrawerClose}
                              sx={{ color: theme.palette.text.primary }}
                            >
                              <Icon icon='mdi:close' fontSize={24} />
                            </IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ px: 4, pb: 4 }}>
                          <Search
                            width={'100%'}
                            placeholder='Search '
                            value={searchInput}
                            onChange={handleSearchLitter}
                            onClear={handleSearchLitterClear}
                            inputStyle={{ py: '12px', px: '12px' }}
                          />
                        </Box>
                        <Box
                          sx={{
                            backgroundColor: theme.palette.background.default,
                            p: 4,
                            flexGrow: 1,
                            pb: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                          }}
                        >
                          {isLitterFetching ? (
                            <Box
                              sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
                            >
                              <CircularProgress />
                            </Box>
                          ) : litterList?.length > 0 ? (
                            litterList?.map((item, index) => {
                              return (
                                <Card
                                  key={item?.litter_id || index}
                                  sx={{
                                    padding: 4,
                                    boxShadow: 0,
                                    border: `2px solid ${theme.palette.customColors.SurfaceVariant}`
                                  }}
                                  onClick={() => handleSelectLitter(item)}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Radio
                                        checked={tempSelectedLitter?.litter_id === item?.litter_id}
                                        onChange={() => handleSelectLitter(item)}
                                        value={item?.litter_id}
                                        name='radio-buttons'
                                      />

                                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Typography
                                          sx={{
                                            fontSize: '16px',
                                            fontWeight: 600,
                                            color: theme.palette.customColors.OnPrimaryContainer
                                          }}
                                        >
                                          Litter {item?.litter_id}
                                        </Typography>
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                          }}
                                        >
                                          <Icon icon='uil:calender' fontSize={24} />
                                          <StyledTypography fontSize={'14px'}>
                                            {Utility.convertUtcToLocalReadableDate(item?.start_date)}
                                          </StyledTypography>
                                        </Box>
                                      </Box>
                                    </Box>
                                    <StyledTypography fontSize={'24px'} fontWeight={600}>
                                      {item?.total_animal_count}
                                    </StyledTypography>
                                  </Box>
                                </Card>
                              )
                            })
                          ) : (
                            <NoDataFound height={200} width={250} />
                          )}
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
                            onClick={handleSubmitLitter}
                            sx={{ flex: 1, py: 4 }}
                            disabled={!tempSelectedLitter?.litter_id}
                          >
                            Select
                          </LoadingButton>
                        </Box>
                      </Drawer>
                    ) : null}
                  </Grid>
                </Box>
              </Card>

              <Card sx={{ padding: 4, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Icon icon='mynaui:male' fontSize={24} />
                  <StyledTypography fontWeight={600}>Select Sire (optional)</StyledTypography>
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
                      Select Animal
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

              <Card sx={{ padding: 4, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Icon icon='ph:paw-print' fontSize={24} />
                  <StyledTypography fontWeight={600}>Offspring*</StyledTypography>
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
                        Select Animal
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
                        Please select offspring
                      </Typography>
                    )}
                  </>
                )}
                {selectedOffspring.length > 0 && (
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
                        px: 4,
                        py: 2,
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
                        Selected - {selectedOffspring.length}
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
                    {selectedOffspring.map((animal, index) => (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 4,
                          borderBottom:
                            index < selectedOffspring.length - 1
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
                    ))}
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
                (selectedOption === 'existing' && (!selectedLitter || !selectedOffspring.length))
              }
            >
              Done
            </LoadingButton>
          </Box>
        </Box>
      </Drawer>
      {animalDrawerOpen && (
        <MultiSelectAnimalDrawer
          open={animalDrawerOpen}
          onClose={() => setAnimalDrawerOpen(false)}
          onSelect={animals => {
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
            selectionType === 'sire'
              ? selectedSire
                ? [selectedSire as unknown as MultiSelectAnimal]
                : []
              : (selectedOffspring as unknown as MultiSelectAnimal[])
          }
          title={selectionType === 'sire' ? 'Select Sire' : 'Select Offspring'}
          btnText='ADD'
          selectionMode={selectionType === 'sire' ? 'single' : 'multi'}
          extraParams={
            selectionType === 'sire'
              ? {
                  zoo_id: zooId,
                  page_no: 1,
                  q: '',
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
                  page_no: 1,
                  q: '',
                  list_type: 'animals',
                  type: animalsDetails?.type,
                  ignore_permission: 1,
                  reproduction_type: animalsDetails?.reproduction_type,
                  tsn_id: animalsDetails?.taxonomy_id,
                  include_dead_animal: 1,
                  use_case: 'add_offspring_mother',
                  relevant_animal_id: selectedSire?.animal_id
                    ? `${animalsDetails?.aid},${selectedSire.animal_id}`
                    : animalsDetails?.aid
                }
          }
        />
      )}
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
