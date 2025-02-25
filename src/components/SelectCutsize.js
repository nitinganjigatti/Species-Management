import React from 'react'
import { Box, FormControl, Select, MenuItem } from '@mui/material'

const SizeSelector = ({ size, cutsizelist, item, ingredient, handleChangeSize, showErrors }) => {
  return (
    <Box sx={{ pl: 5 }}>
      <FormControl fullWidth>
        <Select
          size='small'
          value={size[item.id]?.[ingredient.ingredient_id]?.id || ''}
          onChange={event => handleChangeSize(event, item, ingredient)}
          displayEmpty
          error={!size[item.id]?.[ingredient.ingredient_id]?.id && showErrors}
          sx={{
            height: 51,
            borderRadius: '4px',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#839D8D'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#839D8D'
            },
            '& .MuiOutlinedInput-root': {
              borderRadius: '0px'
            }
          }}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 300
              }
            }
          }}
        >
          <MenuItem value='' disabled>
            Select
          </MenuItem>
          {cutsizelist?.map(unit => (
            <MenuItem key={unit.id} value={unit.id}>
              {unit.cut_size}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export default SizeSelector
