import React, { useState } from 'react'
import { Box, Typography, Avatar, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const AnimalIdentifiers = ({ selectedExportData }) => {
  // Sample data for multiple cards
  const theme = useTheme()
  const animals =
    selectedExportData?.export?.flatMap(exportItem =>
      exportItem.species?.flatMap(species =>
        species.animals?.map(animal => ({
          gender: animal.gender || '',
          species: species.common_name || '-',
          microchip: animal.identifier_type || 'N/A',
          microchipValue: animal.identifier_value || '-'
        }))
      )
    ) || []

  return (
    <>
      <Box>
        <Typography
          fontWeight={500}
          sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '18px', mb: 3, mt: 4 }}
        >
          Animals ({animals?.length})
        </Typography>
        {animals?.length > 0 ? (
          animals.map((animal, index) => (
            <Box
              key={animal.id}
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
                      ? alpha(theme.palette.customColors.SecondaryContainer, 0.5)
                      : animal.gender === 'female'
                      ? alpha(theme.palette.customColors.customDropdownColor, 0.15)
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
                {animal.gender === 'male'
                  ? 'M'
                  : animal.gender === 'female'
                  ? 'F'
                  : animal.gender === 'unknown'
                  ? 'U'
                  : ''}
              </Avatar>

              {/* Animal Info */}
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  sx={{ fontWeight: '400', color: theme.palette.customColors.secondaryBg, fontSize: '14px', mb: 0.5 }}
                >
                  Species :{' '}
                  <span
                    style={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px', fontWeight: 500 }}
                  >
                    {animal.species}
                  </span>
                </Typography>

                <Typography sx={{ fontWeight: '400', color: theme.palette.customColors.secondaryBg, fontSize: '14px' }}>
                  {animal.microchip} :
                  <span
                    style={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px', fontWeight: 500 }}
                  >
                    {' '}
                    {animal.microchipValue}
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
            No Animal's to show
          </Typography>
        )}
      </Box>
    </>
  )
}

export default AnimalIdentifiers
