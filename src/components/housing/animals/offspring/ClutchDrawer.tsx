import React, { useEffect, useState, useMemo } from 'react'
import { Box, Divider, Drawer, IconButton, Typography, useTheme, CircularProgress, Tabs, Tab } from '@mui/material'
import { styled, alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import useSafeRouter from 'src/hooks/useSafeRouter'
import AnimalCard from 'src/views/utility/AnimalCard'

import { getClutchEggList } from 'src/lib/api/housing'
import NoDataFound from 'src/views/utility/NoDataFound'
import Search from 'src/views/utility/Search'
import debounce from 'lodash/debounce'
import { useTranslation } from 'react-i18next'
import Utility from 'src/utility'
import { StyledTypographyProps, AnimalItem, ClutchItem, ClutchEgg } from 'src/types/housing/animalsOffspring'
import { getNewAnimalListWithFilters } from 'src/lib/api/hospital/inpatient'
import EggCard from './EggCard'

interface ClutchDrawerProps {
  open: boolean
  onClose: () => void
  clutchDetails: ClutchItem | null
}

const ClutchDrawer = ({ open, onClose, clutchDetails }: ClutchDrawerProps) => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const router = useSafeRouter()
  const { id } = router.query as { id: string }

  const [searchInput, setSearchInput] = useState('')
  const [searchClutch, setSearchClutch] = useState('')
  const [activeTab, setActiveTab] = useState('eggs')
  const [isAnimalFetching, setIsAnimalFetching] = useState<boolean>(false)
  const [animalData, setAnimalData] = useState<AnimalItem[] | null>(null)
  const [isEggFetching, setIsEggFetching] = useState<boolean>(false)
  const [eggData, setEggData] = useState<ClutchEgg[] | null>(null)

  const debouncedSearchClutch = useMemo(() => debounce(setSearchClutch, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearchClutch.cancel()
    }
  }, [debouncedSearchClutch])

  const fetchClutchAnimalList = async () => {
    setIsAnimalFetching(true)
    try {
      const response = await getNewAnimalListWithFilters({
        q: searchClutch,
        clutch_id: clutchDetails?.clutch_id,
        ignore_permission: 1,
        include_dead_animal: 1,
        page_no: 1
      })
      if (response?.success) {
        const result = response.data
        setAnimalData(result)
      } else {
        setAnimalData([])
      }
    } catch (error: any) {
      console.error(error?.message)
      setAnimalData([])
    } finally {
      setIsAnimalFetching(false)
    }
  }

  const fetchClutchEggList = async () => {
    setIsEggFetching(true)
    try {
      const response = await getClutchEggList({
        type: 'offspring',
        q: searchClutch,
        parent_id: id,
        is_mother: 1,
        clutch_id: clutchDetails?.clutch_id,
        page_no: 1
      })
      if (response?.success) {
        const result = response?.data?.result
        setEggData(result)
      } else {
        setEggData([])
      }
    } catch (error: any) {
      console.error(error?.message)
      setEggData([])
    } finally {
      setIsEggFetching(false)
    }
  }

  const handleSearchClutch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearchClutch(value)
  }

  const handleSearchClutchClear = (): void => {
    setSearchInput('')
    setSearchClutch('')
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  const handleAnimalClick = (animalId: string) => {
    router.push(`/animals/${animalId}`)
  }

  useEffect(() => {
    if (!clutchDetails?.clutch_id) return

    if (activeTab == 'eggs') {
      fetchClutchEggList()
    } else {
      fetchClutchAnimalList()
    }
  }, [clutchDetails?.clutch_id, searchClutch, activeTab])

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
              backgroundColor: theme.palette.customColors.OnPrimary,
              zIndex: 10
            }}
          >
            <Typography
              sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
            >
              {t('animals_module.clutch_details')}
            </Typography>

            <IconButton size='small' onClick={onClose} sx={{ color: theme.palette.text.primary }}>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              cursor: 'pointer',
              mb: 4,
              mx: 4
            }}
          >
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  p: 4,
                  gap: 1,
                  backgroundColor: alpha(theme.palette.customColors.addPrimary, 0.1),
                  borderRadius: '8px 8px 0 0'
                }}
              >
                <StyledTypography fontWeight={500}>{t('animals_module.litter')} {clutchDetails?.clutch_no}</StyledTypography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img src='/images/line_start_circle.svg' alt='line-start-circle' />
                    <StyledTypography>
                      {Utility.convertUtcToLocalReadableDate(clutchDetails?.start_date)}
                    </StyledTypography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img src='/images/line_end_square.svg' alt='line-end-square' />
                    <StyledTypography>
                      {Utility.convertUtcToLocalReadableDate(clutchDetails?.end_date)}
                    </StyledTypography>
                  </Box>
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mx: 4, my: 6 }}>
                  {Number(clutchDetails?.male_count) > 0 && (
                    <GenderBadge
                      label='M'
                      value={clutchDetails?.male_count ?? 0}
                      bgColor={alpha(theme.palette.customColors.SecondaryContainer, 0.8)}
                    />
                  )}

                  {Number(clutchDetails?.female_count) > 0 && (
                    <GenderBadge
                      label='F'
                      value={clutchDetails?.female_count ?? 0}
                      bgColor={alpha(theme.palette.customColors.customDropdownColor, 0.4)}
                    />
                  )}

                  {Number(clutchDetails?.indeterminate_count) > 0 && (
                    <GenderBadge
                      label='ID'
                      value={clutchDetails?.indeterminate_count ?? 0}
                      color={theme.palette.customColors.OnPrimaryContainer}
                      bgColor={theme.palette.customColors.displaybgSecondary}
                    />
                  )}

                  {Number(clutchDetails?.undetermined_count) > 0 && (
                    <GenderBadge
                      label='UD'
                      value={clutchDetails?.undetermined_count ?? 0}
                      color={theme.palette.customColors.Error}
                      bgColor={theme.palette.customColors.SurfaceVariant}
                    />
                  )}
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mx: 4, my: 3 }}>
                  <StyledTypography>
                    {t('animals_module.total')}: <span style={{ fontWeight: 600 }}>{clutchDetails?.total_egg_count || 0}</span>
                  </StyledTypography>
                  <StyledTypography>
                    {t('animals_module.discarded')}: <span style={{ fontWeight: 600 }}>{clutchDetails?.discarded_count || 0}</span>
                  </StyledTypography>
                  <StyledTypography>
                    {t('animals_module.hatched')}: <span style={{ fontWeight: 600 }}>{clutchDetails?.hatched_count || 0}</span>
                  </StyledTypography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ px: 4 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant='fullWidth'
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                mb: 2,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '14px'
                }
              }}
            >
              <Tab value='eggs' label={t('animals_module.eggs')} />

              <Tab value='animals' label={t('animals')} />
            </Tabs>
          </Box>

          <Box sx={{ backgroundColor: theme.palette.background.default, py: 4, px: 4 }}>
            <Box sx={{ backgroundColor: theme.palette.background.paper, borderRadius: 1 }}>
              <Search
                width={'100%'}
                placeholder={t('search') as string}
                value={searchInput}
                onChange={handleSearchClutch}
                onClear={handleSearchClutchClear}
                inputStyle={{ py: '16px', px: '12px' }}
              />
            </Box>
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
                px: 4
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: theme.palette.background.default,
                  flexGrow: 1
                }}
              >
                {activeTab === 'eggs' ? (
                  isEggFetching ? (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : eggData?.length === 0 || eggData === undefined ? (
                    <NoDataFound width={250} height={250} />
                  ) : (
                    eggData?.map(item => (
                      <EggCard
                        key={item.egg_id}
                        imgURl={item.default_icon}
                        defaultName={item.default_common_name}
                        completeName={item.complete_name}
                        eggCode={item.egg_code}
                        eggCondition={item.egg_condition}
                        egg_status={item.egg_status}
                        egg_state={item.egg_state}
                        batch={item.discard_request_id}
                        date={item.collection_date}
                        status={item.discard_activity_status}
                      />
                    ))
                  )
                ) : isAnimalFetching ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : animalData?.length === 0 ? (
                  <NoDataFound width={250} height={250} />
                ) : (
                  animalData?.map((item: AnimalItem, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        p: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: theme.palette.customColors.OnPrimary,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.action.hover, 0.04)
                        },
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        mb: 2,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleAnimalClick(String(item.animal_id))}
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        <AnimalCard data={item} />
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: theme.palette.customColors.OnSurfaceVariant,
                          ml: 4
                        }}
                      >
                        <Icon icon={'fe:arrow-right'} fontSize={24} />
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default React.memo(ClutchDrawer)

const StyledTypography = styled(Typography)<StyledTypographyProps>(({ theme, fontWeight, fontSize, color, sx }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || (theme as any).palette?.customColors?.OnSurfaceVariant || (theme as any).palette?.text?.primary,
  ...(sx as any)
}))

const GenderBadge = ({
  label,
  value,
  bgColor,
  color
}: {
  label: string
  value: string | number
  bgColor?: string
  color?: string
}) => (
  <Box
    sx={{
      p: '6px 12px',
      borderRadius: 1,
      backgroundColor: bgColor,
      display: 'inline-flex'
    }}
  >
    <StyledTypography fontWeight={500} color={color}>
      {label} - {value}
    </StyledTypography>
  </Box>
)
