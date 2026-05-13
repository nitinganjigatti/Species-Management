import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Box, Divider, Drawer, IconButton, Typography, useTheme, CircularProgress } from '@mui/material'
import { styled, alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useRouter } from 'next/navigation'
import AnimalCard from 'src/views/utility/AnimalCard'
import { getNewAnimalListWithFilters } from 'src/lib/api/hospital/inpatient'

import NoDataFound from 'src/views/utility/NoDataFound'
import Search from 'src/views/utility/Search'
import debounce from 'lodash/debounce'
import { useTranslation } from 'react-i18next'
import Utility from 'src/utility'
import { StyledTypographyProps, AnimalItem, LitterItem } from 'src/types/housing/animalsOffspring'
import { useInView } from 'react-intersection-observer'

interface LitterDrawerProps {
  open: boolean
  onClose: () => void
  litterDetails: LitterItem | null
}

const LitterDrawer = ({ open, onClose, litterDetails }: LitterDrawerProps) => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const router = useRouter()

  const [searchInput, setSearchInput] = useState('')
  const [searchLitter, setSearchLitter] = useState('')
  const [isLitterFetching, setIsLitterFetching] = useState<boolean>(false)
  const [litterData, setLitterData] = useState<AnimalItem[] | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const debouncedSearchLitter = useMemo(() => debounce(setSearchLitter, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearchLitter.cancel()
    }
  }, [debouncedSearchLitter])

  const fetchLitterDetails = async (pageNo: number = 1) => {
    if (!litterDetails?.litter_id) return

    if (pageNo === 1) {
      setIsLitterFetching(true)
      setHasMore(true)
    } else {
      setIsFetchingMore(true)
    }

    try {
      const response = await getNewAnimalListWithFilters({
        ignore_permission: 1,
        include_dead_animal: 1,
        litter_id: litterDetails?.litter_id,
        q: searchLitter,
        page_no: pageNo
      })
      if (response?.success) {
        const result = (response.data || []) as AnimalItem[]

        if (pageNo === 1) {
          setLitterData(result)
        } else {
          setLitterData(prev => [...(prev || []), ...result])
        }

        if (result.length < 10) {
          setHasMore(false)
        }
      } else {
        if (pageNo === 1) {
          setLitterData([])
        }
        setHasMore(false)
      }
    } catch (error: any) {
      console.error(error?.message)
      if (pageNo === 1) {
        setLitterData([])
      }
      setHasMore(false)
    } finally {
      setIsLitterFetching(false)
      setIsFetchingMore(false)
    }
  }

  const handleSearchLitter = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearchLitter(value)
  }

  const handleSearchLitterClear = (): void => {
    setSearchInput('')
    setSearchLitter('')
  }

  const handleAnimalClick = (animalId: string) => {
    router.push(`/animals/${animalId}`)
  }

  const handleLoadMore = useCallback(() => {
    if (isLitterFetching || isFetchingMore || !hasMore) return

    const nextPage = page + 1
    setPage(nextPage)
    fetchLitterDetails(nextPage)
  }, [isLitterFetching, isFetchingMore, hasMore, page, searchLitter, litterDetails?.litter_id])

  useEffect(() => {
    if (inView && !isLitterFetching && !isFetchingMore && hasMore && litterData?.length) {
      handleLoadMore()
    }
  }, [inView, isLitterFetching, isFetchingMore, hasMore, litterData?.length, handleLoadMore])

  useEffect(() => {
    setPage(1)
    setLitterData([])
    setHasMore(true)
    fetchLitterDetails(1)
  }, [litterDetails?.litter_id, searchLitter])

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
              backgroundColor: theme.palette.customColors.OnPrimary
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 4,
                backgroundColor: theme.palette.customColors.OnPrimary
              }}
            >
              <Typography
                sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {t('animals_module.litter_details')}
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
                  <StyledTypography fontWeight={500}>{t('animals_module.litter')} {litterDetails?.litter_id}</StyledTypography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <img src='/images/line_start_circle.svg' alt='line-start-circle' />
                      <StyledTypography>
                        {Utility.convertUtcToLocalReadableDate(litterDetails?.start_date)}
                      </StyledTypography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <img src='/images/line_end_square.svg' alt='line-end-square' />
                      <StyledTypography>
                        {Utility.convertUtcToLocalReadableDate(litterDetails?.end_date)}
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
                    {Number(litterDetails?.male_count) > 0 && (
                      <GenderBadge
                        label='M'
                        value={litterDetails?.male_count ?? 0}
                        bgColor={alpha(theme.palette.customColors.SecondaryContainer, 0.8)}
                      />
                    )}

                    {Number(litterDetails?.female_count) > 0 && (
                      <GenderBadge
                        label='F'
                        value={litterDetails?.female_count ?? 0}
                        bgColor={alpha(theme.palette.customColors.customDropdownColor, 0.4)}
                      />
                    )}

                    {Number(litterDetails?.indeterminate_count) > 0 && (
                      <GenderBadge
                        label='ID'
                        value={litterDetails?.indeterminate_count ?? 0}
                        color={theme.palette.customColors.OnPrimaryContainer}
                        bgColor={theme.palette.customColors.displaybgSecondary}
                      />
                    )}

                    {Number(litterDetails?.undetermined_count) > 0 && (
                      <GenderBadge
                        label='UD'
                        value={litterDetails?.undetermined_count ?? 0}
                        color={theme.palette.customColors.Error}
                        bgColor={theme.palette.customColors.SurfaceVariant}
                      />
                    )}
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mx: 4, my: 3 }}>
                    <StyledTypography>
                      {t('animals_module.total')}: <span style={{ fontWeight: 600 }}>{litterDetails?.total_animal_count}</span>
                    </StyledTypography>
                    <StyledTypography>
                      {t('animals_module.dead')}: <span style={{ fontWeight: 600 }}>{litterDetails?.death_count}</span>
                    </StyledTypography>
                    <StyledTypography>
                      {t('animals_module.alive')}: <span style={{ fontWeight: 600 }}>{litterDetails?.alive_count}</span>
                    </StyledTypography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
          <Box sx={{ backgroundColor: theme.palette.background.default, py: 4, px: 4 }}>
            <Box sx={{ backgroundColor: theme.palette.background.paper, borderRadius: 1 }}>
              <Search
                width={'100%'}
                placeholder={t('search') as string}
                value={searchInput}
                onChange={handleSearchLitter}
                onClear={handleSearchLitterClear}
                inputStyle={{ py: '16px', px: '12px' }}
              />
            </Box>
          </Box>
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.background.default,
              flexGrow: 1,
              px: 4
            }}
          >
            {isLitterFetching ? (
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
            ) : litterData?.length === 0 ? (
              <NoDataFound width={250} height={250} />
            ) : (
              <>
                {litterData?.map((item: AnimalItem, index: number) => (
                  <Box
                    key={item?.animal_id || index}
                    sx={{
                      p: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: theme.palette.background.paper,
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
                ))}
                {(hasMore || isFetchingMore) && (
                  <Box
                    ref={loaderRef}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 4
                    }}
                  >
                    {isFetchingMore && <CircularProgress size={24} />}
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default React.memo(LitterDrawer)

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
