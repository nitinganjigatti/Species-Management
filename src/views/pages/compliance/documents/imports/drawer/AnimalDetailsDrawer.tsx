import React from 'react'
import { Typography, Box, Drawer, IconButton, Paper, Grid, Chip, Avatar, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import Icon from 'src/@core/components/icon'
import useSafeRouter from 'src/hooks/useSafeRouter'
import type { ExportSpecies } from 'src/types/compliance'

interface AnimalDetailsDrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  animalDetails: ExportSpecies
  detailtype?: string
  setanimalCountDrawerOpen?: (open: boolean) => void
  setCurrentSpeciesId?: (id: unknown) => void
  setSelectedSpeciesData?: (data: ExportSpecies) => void
}

const AnimalDetailsDrawer = ({
  open,
  onClose,
  title,
  animalDetails,
  detailtype,
  setanimalCountDrawerOpen,
  setCurrentSpeciesId,
  setSelectedSpeciesData
}: AnimalDetailsDrawerProps) => {
  const theme = useTheme()
  const router = useSafeRouter()
  const { action } = router.query

  const handleClick = () => {
    setanimalCountDrawerOpen?.(true)
    setCurrentSpeciesId?.((animalDetails as any).tsn_id)
    setSelectedSpeciesData?.(animalDetails)
  }

  return (
    <Drawer
      open={open}

      //onClose={onClose}
      anchor='right'
    >
      <Box
        sx={{
          width: 570,
          maxWidth: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.Background
        }}
      >
        {/* Header */}
        <Box sx={{ px: 5, pt: 4, pb: 4 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{title}</Typography>
            </Box>
            {detailtype === 'others' && action !== 'details' ? (
              <Typography
                sx={{
                  color: theme.palette.primary.dark,
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  ml: '30%'
                }}
                onClick={handleClick}
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
            ) : (
              ''
            )}

            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ px: '20px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '18px',
              color: theme.palette.customColors.OnSurfaceVariant,
              mb: 4
            }}
          >
            Species
          </Typography>

          <Paper
            elevation={1}
            sx={{
              borderRadius: '10px',
              padding: 4,
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              boxShadow: 'none'
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography sx={{ color: theme.palette.customColors.secondaryBg, fontWeight: 400, fontSize: '16px' }}>
                  Common Name
                </Typography>
                <Typography
                  fontWeight={500}
                  sx={{ mt: 0.5, color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px' }}
                >
                  {animalDetails?.common_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography sx={{ color: theme.palette.customColors.secondaryBg, fontWeight: 400, fontSize: '16px' }}>
                  Scientific Name
                </Typography>
                <Typography
                  fontWeight={500}
                  sx={{ mt: 0.5, color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px' }}
                >
                  {animalDetails?.scientific_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid sx={{ mt: 3 }} size={{ xs: 6 }}>
                <Typography sx={{ color: theme.palette.customColors.secondaryBg, fontWeight: 400, fontSize: '16px' }}>
                  CITES
                </Typography>
                <Typography
                  fontWeight={500}
                  sx={{ mt: 0.5, color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px' }}
                >
                  {animalDetails?.appendix || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }} sx={{ mt: 3 }}>
                <Typography sx={{ color: theme.palette.customColors.secondaryBg, fontWeight: 400, fontSize: '16px' }}>
                  Animal count
                </Typography>
                <Typography
                  fontWeight={500}
                  sx={{ mt: 0.5, color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px' }}
                >
                  {(animalDetails as any)?.total_count ||
                    (animalDetails?.male_count ?? 0) + (animalDetails?.female_count ?? 0) + (animalDetails?.undeterminate_count ?? 0) ||
                    '-'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
                <Typography sx={{ color: theme.palette.customColors.secondaryBg, fontWeight: 400, fontSize: '16px' }}>
                  Gender & Count
                </Typography>
                <Box display='flex' gap={1} sx={{ mt: 1 }}>
                  <Chip
                    label={`M - ${animalDetails?.male_count || 0}`}
                    size='small'
                    sx={{
                      background: alpha(theme.palette.customColors.SecondaryContainer || '', 0.5),
                      borderRadius: '4px',
                      px: 3,
                      color: theme.palette.customColors.addPrimary,
                      fontSize: '14px',
                      fontWeight: 500,
                      mr: 2
                    }}
                  />
                  <Chip
                    label={`F - ${animalDetails?.female_count || 0}`}
                    size='small'
                    sx={{
                      background: alpha(theme.palette.customColors.customDropdownColor || '', 0.15),
                      borderRadius: '4px',
                      px: 3,
                      color: theme.palette.customColors.customDropdownColor,
                      fontSize: '14px',
                      fontWeight: 500,
                      mr: 2
                    }}
                  />
                  <Chip
                    label={`U - ${animalDetails?.undeterminate_count || 0}`}
                    size='small'
                    sx={{
                      background: theme.palette.customColors.displaybgSecondary,
                      borderRadius: '4px',
                      px: 3,
                      color: theme.palette.customColors.OnPrimaryContainer,
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        <Box sx={{ px: '20px', pb: 2 }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '18px',
              color: theme.palette.customColors.OnSurfaceVariant,
              mb: 4,
              mt: 4
            }}
          >
            Animals with identifier ( {animalDetails?.animals?.length || 0} )
          </Typography>
          <Box
            sx={{
              backgroundColor: theme.palette.customColors.OnPrimary,
              p: 4,
              borderRadius: '8px',
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`
            }}
          >
            {animalDetails?.animals && animalDetails?.animals?.length > 0 ? (
              animalDetails?.animals?.map((animal, index) => (
                <Box
                  key={animal.id as React.Key}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: theme.palette.customColors.OnPrimary,
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '8px',
                    mb: 3
                  }}
                >
                  {/* Gender Avatar */}
                  <Avatar
                    sx={{
                      backgroundColor:
                        animal.gender === 'male'
                          ? alpha(theme.palette.customColors.SecondaryContainer || '', 0.5)
                          : animal.gender === 'female'
                          ? alpha(theme.palette.customColors.customDropdownColor || '', 0.15)
                          : animal.gender === 'unknown'
                          ? theme.palette.customColors.displaybgSecondary
                          : '',
                      color:
                        animal.gender === 'male'
                          ? theme.palette.customColors.addPrimary
                          : animal.gender === 'female'
                          ? theme.palette.customColors.customDropdownColor
                          : animal.gender === 'unknown'
                          ? theme.palette.customColors.OnPrimaryContainer
                          : '',
                      fontWeight: '500',
                      marginRight: '16px',
                      fontSize: '14px',
                      width: 40,
                      height: 40,
                      borderRadius: '4px'

                      //ml: 4
                    }}
                  >
                    {animal.gender === 'male' ? 'M' : animal.gender === 'female' ? 'F' : 'U'}
                  </Avatar>

                  {/* Animal Info */}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: '400',
                        color: theme.palette.customColors.secondaryBg,
                        fontSize: '14px',
                        mb: 0.5
                      }}
                    >
                      Species :{' '}
                      <span
                        style={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontSize: '14px',
                          fontWeight: 500
                        }}
                      >
                        {animalDetails?.common_name || 'N/A'}
                      </span>
                    </Typography>

                    <Typography
                      sx={{ fontWeight: '400', color: theme.palette.customColors.secondaryBg, fontSize: '14px' }}
                    >
                      {animal.identifier_type} :
                      <span
                        style={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontSize: '14px',
                          fontWeight: 500
                        }}
                      >
                        {' '}
                        {animal.identifier_value}
                      </span>
                    </Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography
                sx={{
                  background: theme.palette.customColors.mdAntzNeutral,
                  p: 12,
                  textAlign: 'center',
                  borderRadius: '8px',
                  fontWeight: '500'
                }}
              >
                No Animals to show
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(AnimalDetailsDrawer)
