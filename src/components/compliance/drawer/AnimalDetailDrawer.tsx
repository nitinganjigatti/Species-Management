import React from 'react'
import { Box, Typography, Drawer, IconButton, Grid, Chip, Tooltip } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useTheme } from '@mui/material/styles'
import Utility from 'src/utility'
import type { AnimalDetailDrawerProps } from 'src/types/compliance'

const AnimalDetailDrawer = ({ open, onClose, specie }: AnimalDetailDrawerProps) => {
  const theme = useTheme()

  if (!specie) return null

  return (
    <Drawer open={open} onClose={onClose} anchor='right'>
      <Box
        sx={{
          width: { xs: '100vw', sm: 570 },
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.Background
        }}
      >
        {/* Header */}
        <Box sx={{ px: 4, pt: 3, pb: 2 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>Animal Details</Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ px: 4, flex: 1, overflowY: 'auto', pb: 4 }}>
          {/* Species Info */}
          <Typography
            sx={{
              mb: 3,
              fontWeight: 500,
              fontSize: '1.25rem',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Species
          </Typography>
          <Box
            sx={{
              mb: 3,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              px: 4,
              py: 4,
              backgroundColor: theme.palette.common.white
            }}
          >
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ color: theme.palette.customColors.neutralSecondary, mb: 1 }}>Common Name</Typography>
                {specie?.common_name && <Tooltip title={specie?.common_name} arrow>
                  <Typography
                    sx={{
                      fontWeight: 500,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      wordBreak: 'break-word',
                      maxWidth: '100%'
                    }}
                  >
                    {specie?.common_name || '-'}
                  </Typography>
                </Tooltip>}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ color: theme.palette.customColors.neutralSecondary, mb: 1 }}>
                  Scientific Name
                </Typography>
                <Typography sx={{ fontWeight: 500 }}>{specie.scientific_name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ color: theme.palette.customColors.neutralSecondary, mb: 1 }}>CITES</Typography>
                <Typography sx={{ fontWeight: 500 }}>{specie.appendix || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ color: theme.palette.customColors.neutralSecondary, mb: 1 }}>
                  Total Animals
                </Typography>
                <Typography sx={{ fontWeight: 500 }}>{specie.total_count || '-'}</Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Typography variant='subtitle1' sx={{ mb: 1 }}>
                Gender & Count
              </Typography>
              <Box
                sx={{
                  flex: 2,
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start'
                }}
              >
                {specie.male_count ? (
                  <Chip
                    label={`M - ${specie.male_count}`}
                    size='small'
                    sx={{
                      bgcolor: `${theme.palette.customColors.SecondaryContainer}80`,
                      color: theme.palette.customColors.addPrimary,
                      borderRadius: 0.5
                    }}
                  />
                ) : null}

                {specie.female_count ? (
                  <Chip
                    label={`F - ${specie.female_count}`}
                    size='small'
                    sx={{
                      bgcolor: `${theme.palette.customColors.customDropdownColor}4D`,
                      color: theme.palette.customColors.customDropdownColor,
                      borderRadius: 0.5
                    }}
                  />
                ) : null}

                {specie.undeterminate_count ? (
                  <Chip
                    label={`UD - ${specie.undeterminate_count}`}
                    size='small'
                    sx={{
                      bgcolor: theme.palette.customColors.displaybgSecondary,
                      color: theme.palette.customColors.OnPrimaryContainer,
                      borderRadius: 0.5
                    }}
                  />
                ) : null}
              </Box>
            </Box>
          </Box>

          {/* Animals with Identifier */}
          {specie?.animals?.length ? (
            <Typography
              sx={{
                mb: 3,
                fontWeight: 500,
                fontSize: '1.25rem',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Animals ({specie?.animals?.length})
            </Typography>
          ) : null}

          {specie?.animals?.length ? (
            <Box
              sx={{
                mb: 3,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px',
                px: 4,
                py: 4,
                backgroundColor: theme.palette.common.white,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              {specie?.animals?.map((animal, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '8px',
                    p: 3
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor:
                        animal.gender === 'male'
                          ? `${theme.palette.customColors.SecondaryContainer}80`
                          : animal.gender === 'female'
                          ? `${theme.palette.customColors.customDropdownColor}4D`
                          : theme.palette.customColors.displaybgSecondary,
                      color:
                        animal.gender === 'male'
                          ? theme.palette.customColors.addPrimary
                          : animal.gender === 'female'
                          ? theme.palette.customColors.customDropdownColor
                          : theme.palette.customColors.OnPrimaryContainer,
                      fontWeight: 600,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      flexShrink: 0
                    }}
                  >
                    {animal.gender ? animal.gender[0].toUpperCase() : '-'}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      Species:{' '}
                      {specie?.common_name && (
                        <Tooltip title={specie?.common_name} arrow>
                          <Typography
                            component='span'
                            sx={{
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            {specie?.common_name || '-'}
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                    {animal?.identifier_type && animal?.identifier_value && (
                      <Box sx={{ fontSize: '0.875rem' }}>
                        {Utility.formatIdentifierType(animal.identifier_type)}:{' '}
                        <Typography
                          component='span'
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          {animal.identifier_value || '-'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : null}
        </Box>
      </Box>
    </Drawer>
  )
}

export default AnimalDetailDrawer
