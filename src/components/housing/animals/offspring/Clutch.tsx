import React, { useState, useEffect } from 'react'
import { Box, Typography, useTheme, Skeleton, Divider } from '@mui/material'
import styled from '@emotion/styled'
import { alpha } from '@mui/material/styles'

import NoDataFound from 'src/views/utility/NoDataFound'
import { StyledTypographyProps, TabProps, ClutchItem } from 'src/types/housing/animalsOffspring'
import ClutchDrawer from './ClutchDrawer'
import { getClutchList } from 'src/lib/api/housing'
import Utility from 'src/utility'

const Clutch: React.FC<TabProps> = props => {
  const theme = useTheme() as any

  const [clutchDrawerOpen, setClutchDrawerOpen] = useState<boolean>(false)
  const [clutch, setClutch] = useState<ClutchItem[]>([])
  const [isClutchFetching, setIsClutchFetching] = useState<boolean>(false)
  const [selectedClutch, setSelectedClutch] = useState<ClutchItem | null>(null)

  const fetchClutch = async () => {
    setIsClutchFetching(true)
    try {
      const response = await getClutchList({
        animal_id: props.animalId,
        page_no: 1
      })
      if (response?.success) {
        const result = response.data?.result as ClutchItem[] | undefined
        setClutch(result ?? [])
      } else {
        setClutch([])
      }
    } catch (error: any) {
      console.error(error?.message)
      setClutch([])
    } finally {
      setIsClutchFetching(false)
    }
  }

  const handleClutchDrawerClose = () => {
    setClutchDrawerOpen(false)
    setSelectedClutch(null)
  }

  useEffect(() => {
    fetchClutch()
  }, [props.animalId])

  if (isClutchFetching) return <ClutchSkeleton />

  if (!clutch || clutch.length === 0) {
    return <NoDataFound />
  }

  return (
    <>
      {clutch?.map((item, index) => {
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              cursor: 'pointer',
              mb: 4
            }}
          >
            <Box
              key={index}
              onClick={() => {
                setSelectedClutch(item)
                setClutchDrawerOpen(true)
              }}
            >
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
                <StyledTypography fontWeight={500}>Clutch {item?.clutch_no}</StyledTypography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img src='/images/line_start_circle.svg' alt='line-start-circle' />
                    <StyledTypography>{Utility.convertUtcToLocalReadableDate(item?.start_date)}</StyledTypography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img src='/images/line_end_square.svg' alt='line-end-square' />
                    <StyledTypography>{Utility.convertUtcToLocalReadableDate(item?.end_date)}</StyledTypography>
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
                  {Number(item?.male_count) > 0 && (
                    <SexBadge
                      label='M'
                      value={item?.male_count}
                      bgColor={alpha(theme.palette.customColors.SecondaryContainer, 0.8)}
                    />
                  )}

                  {Number(item?.female_count) > 0 && (
                    <SexBadge
                      label='F'
                      value={item?.female_count}
                      bgColor={alpha(theme.palette.customColors.customDropdownColor, 0.4)}
                    />
                  )}

                  {Number(item?.indeterminate_count) > 0 && (
                    <SexBadge
                      label='ID'
                      value={item?.indeterminate_count}
                      color={theme.palette.customColors.OnPrimaryContainer}
                      bgColor={theme.palette.customColors.displaybgSecondary}
                    />
                  )}
                  {Number(item?.undetermined_count) > 0 && (
                    <SexBadge
                      label='UD'
                      value={item?.undetermined_count}
                      color={theme.palette.customColors.Error}
                      bgColor={theme.palette.customColors.SurfaceVariant}
                    />
                  )}
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mx: 4, my: 3 }}>
                  <StyledTypography>
                    Total: <span style={{ fontWeight: 600 }}>{item?.total_egg_count || 0}</span>
                  </StyledTypography>
                  <StyledTypography>
                    Discarded: <span style={{ fontWeight: 600 }}>{item?.discarded_count || 0}</span>
                  </StyledTypography>
                  <StyledTypography>
                    Hatched: <span style={{ fontWeight: 600 }}>{item?.hatched_count || 0}</span>
                  </StyledTypography>
                </Box>
              </Box>
            </Box>
          </Box>
        )
      })}
      {clutchDrawerOpen && (
        <ClutchDrawer open={clutchDrawerOpen} onClose={handleClutchDrawerClose} clutchDetails={selectedClutch} />
      )}
    </>
  )
}

export default React.memo(Clutch)

const StyledTypography = styled(Typography)<StyledTypographyProps>(({ theme, fontWeight, fontSize, color, sx }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || (theme as any).palette?.customColors?.OnSurfaceVariant || (theme as any).palette?.text?.primary,
  ...(sx as any)
}))

const SexBadge = ({ label, value, bgColor, color }: any) => (
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

const ClutchSkeleton = () => {
  const theme = useTheme() as any

  return (
    <>
      {[1, 2, 3].map((_, index) => (
        <Box
          key={index}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '8px',
            overflow: 'hidden',
            mb: 3
          }}
        >
          <Box
            sx={{
              p: 4,
              backgroundColor: alpha(theme.palette.customColors.addPrimary, 0.1),
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Skeleton width={120} height={22} />

            <Box sx={{ display: 'flex', gap: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant='circular' width={20} height={20} />
                <Skeleton width={120} height={18} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant='rectangular' width={20} height={20} />
                <Skeleton width={120} height={18} />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ mx: 4, my: 6 }}>
              <Skeleton variant='rounded' width={80} height={32} sx={{ borderRadius: 1 }} />
            </Box>

            <Box sx={{ mx: 4, my: 6 }}>
              <Skeleton variant='rounded' width={80} height={32} sx={{ borderRadius: 1 }} />
            </Box>

            <Box sx={{ mx: 4, my: 6 }}>
              <Skeleton variant='rounded' width={80} height={32} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>

          <Divider />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mx: 4,
              my: 3
            }}
          >
            <Skeleton width={80} height={20} />
            <Skeleton width={80} height={20} />
            <Skeleton width={80} height={20} />
          </Box>
        </Box>
      ))}
    </>
  )
}
