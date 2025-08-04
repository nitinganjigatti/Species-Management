import React, { useState } from 'react'
import { Box, Typography, Avatar } from '@mui/material'

const AnimalIdentifiers = ({ selectedExportData }) => {

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
        <Typography fontWeight={500} sx={{ color: '#44544A', fontSize: '18px', mb: 3, mt: 4 }}>
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
                backgroundColor: '#FFFFFF',
                border: '1px solid #C3CEC7',
                borderRadius: '8px',
                mb: 3
              }}
            >
              {/* Gender Avatar */}
              <Avatar
                sx={{
                  backgroundColor:
                    animal.gender === 'male'
                      ? '#AFEFEB80'
                      : animal.gender === 'female'
                      ? '#FA614026'
                      : animal.gender === 'unknown'
                      ? '#DDEBE9'
                      : '',
                  color:
                    animal.gender === 'male'
                      ? '#00AFD6'
                      : animal.gender === 'female'
                      ? '#FA6140'
                      : animal.gender === 'unknown'
                      ? '#1F515B'
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

              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ fontWeight: '400', color: '#7A8684', fontSize: '14px', mb: 0.5 }}>
                  Species :{' '}
                  <span style={{ color: '#44544A', fontSize: '14px', fontWeight: 500 }}>{animal.species}</span>
                </Typography>

                <Typography sx={{ fontWeight: '400', color: '#7A8684', fontSize: '14px' }}>
                  {animal.microchip} :
                  <span style={{ color: '#44544A', fontSize: '14px', fontWeight: 500 }}> {animal.microchipValue}</span>
                </Typography>
              </Box>
            </Box>
          ))
        ) : (
          <Typography
            sx={{ background: '#0000000D', p: 12, textAlign: 'center', borderRadius: '8px', fontWeight: '500' }}
          >
            No Animal's to show
          </Typography>
        )}
      </Box>
    </>
  )
}

export default AnimalIdentifiers
