import React from 'react'
import { Box, Checkbox, IconButton, Radio } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { useTheme } from '@mui/material/styles'

const SelectableSpeciesCard = ({
  species,
  selected,
  borderColor,
  onClick,
  selectionType = 'checkbox'
}) => {
  const theme = useTheme()
  const interactive = selectionType !== 'cross'

  const handleToggle = () => {
    if (!interactive) return
    onClick?.()
  }

  const handleKeyDown = event => {
    if (!interactive) return
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle()
    }
  }

  return (
    <Box
      sx={{
        p: 0,
        borderRadius: '8px',
        border: selected
          ? `1px solid ${borderColor ? borderColor : theme.palette.primary.main}`
          : '1px solid transparent',
        backgroundColor: 'white',
        cursor: interactive ? 'pointer' : 'default'
      }}
      onClick={interactive ? handleToggle : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          padding: 0,
          alignItems: 'stretch'
        }}
      >
        <Box sx={{ flex: 1, px: 4, py: 3 }}>
          <SpeciesCard
            species={{
              common_name: species.common_name,
              scientific_name: species.scientific_name || species.complete_name,
              default_icon: species.default_icon || '/branding/antz/Antz_logomark_h_color.svg'
            }}
          />
        </Box>

        <Box
          sx={{
            px: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.customColors.Surface,
            minHeight: '100%',
            paddingRight: '1rem',
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px'
          }}
        >
          {selectionType === 'checkbox' && (
            <Checkbox
              edge='end'
              checked={selected}
              tabIndex={-1}
              disableRipple
              onClick={event => {
                event.stopPropagation()
              }}
              onChange={() => handleToggle()}
            />
          )}
          {selectionType === 'radio' && (
            <Radio
              edge='end'
              checked={selected}
              tabIndex={-1}
              disableRipple
              onClick={event => {
                event.stopPropagation()
              }}
              onChange={() => handleToggle()}
            />
          )}
          {selectionType === 'cross' && (
            <IconButton
              sx={{ pr: 2 }}
              edge='end'
              onClick={event => {
                event.stopPropagation()
                onClick?.()
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default SelectableSpeciesCard
