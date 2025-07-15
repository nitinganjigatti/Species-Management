import React from 'react'
import { ListItem, ListItemAvatar, ListItemText, Avatar, Typography, Box } from '@mui/material'
import Utility from 'src/utility'
import Icon from 'src/@core/components/icon'

const SpeciesCardItem = ({ species, children, theme, tempSelectedSpecies, selectionType, speciesview }) => {
  return (
    <ListItem
      key={species.id}
      secondaryAction={
        <Box
          sx={{
            backgroundColor: children ? (species.mapped_to_diet ? '' : '#F2FFF8') : '',
            pl: 3,
            pr: 4,
            py: 4.1,
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {children}
        </Box>
      }
      sx={{
        background: speciesview !== 'details' && species.mapped_to_diet ? '#DAE7DF' : theme.palette.background.paper,
        borderRadius: '8px',
        border: tempSelectedSpecies.includes(species.species_id) ? '1px solid' + theme.palette.primary.main : '',
        mb: 3,
        '& .MuiListItemSecondaryAction-root': {
          right: 0
        }
      }}
    >
      <ListItemAvatar>
        <Avatar
          sx={{
            '& img': {
              objectFit: 'inherit'
            },
            borderRadius:
              species?.default_icon && species.default_icon.includes('.svg')
                ? 'unset'
                : species?.default_icon
                ? '50%'
                : 'unset'
          }}
          src={species.default_icon ? species.default_icon : '/icons/species.svg'}
          alt={species.scientific_name}
        />
      </ListItemAvatar>
      <ListItemText
        primary={
          <>
            {speciesview === 'details' && species.is_primary === '1' ? (
              <Typography
                variant='body2'
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: 400,
                  background: '#37bd6924',
                  width: '24%',
                  pl: '5px',
                  py: '1px',
                  borderRadius: '4px',
                  mb: '2px'
                }}
              >
                Primary Diet
              </Typography>
            ) : (
              ''
            )}
            <Typography
              variant='body2'
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: 400,
                fontStyle: 'italic'
              }}
            >
              {species.common_name ? species.common_name : '-'}
            </Typography>
          </>
        }
        secondary={
          <>
            <Typography
              variant='body1'
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              {species.scientific_name ? species.scientific_name : '-'}
            </Typography>
            {speciesview === 'details' ? (
              <Box sx={{ display: 'flex', alignItems: 'center', pt: 1 }}>
                <Avatar
                  variant='square'
                  alt='Medicine Image'
                  sx={{
                    width: 25,
                    height: 25,
                    mr: 4,
                    borderRadius: '50%',
                    background: theme.palette.customColors.tableHeaderBg,
                    overflow: 'hidden'
                  }}
                >
                  {species?.profile_pic ? (
                    <img
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      src={species?.profile_pic}
                      alt='Profile'
                    />
                  ) : (
                    <Icon icon='mdi:user' />
                  )}
                </Avatar>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 12, fontWeight: 500 }}>
                    {species?.user_details?.created_by}
                  </Typography>
                  <Typography
                    noWrap
                    variant='body2'
                    sx={{ color: theme.palette.customColors.secondaryBg, fontSize: 12 }}
                  >
                    {Utility.convertUTCToLocalDateTime(species?.user_details?.created_at)}
                  </Typography>
                </Box>
              </Box>
            ) : (
              ''
            )}
          </>
        }
        slotProps={{
          secondary: {
            sx: { color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }
          }
        }}
      />
    </ListItem>
  )
}

export default SpeciesCardItem
