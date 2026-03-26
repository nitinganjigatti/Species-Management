import React from 'react'
import { Box, FormControl, Select, MenuItem, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const SizeSelector = ({ size, cutsizelist, item, ingredient, handleChangeSize, showErrors }) => {
  const theme = useTheme()
  return (
    <Box sx={{ pl: 5, width: 162 }}>
      <FormControl fullWidth>
        <Select
          size='small'
          value={
            size[item.id]?.[
              ingredient.preparation_type_id
                ? `${ingredient.ingredient_id}-${ingredient.preparation_type_id}`
                : ingredient.ingredient_id
            ]?.id || ''
          }
          onChange={event => handleChangeSize(event, item, ingredient)}
          displayEmpty
          error={
            !size[item.id]?.[
              ingredient.preparation_type_id
                ? `${ingredient.ingredient_id}-${ingredient.preparation_type_id}`
                : ingredient.ingredient_id
            ]?.id && showErrors
          }
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
            },
            '&.Mui-focused .MuiSelect-select': {
              color: theme.palette.primary.main
            }
          }}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 300
              }
            }
          }}
          renderValue={selected => {
            const selectedUnit = cutsizelist?.find(unit => unit.id === selected)
            return (
              <Tooltip title={selectedUnit?.cut_size || ''}>
                <span
                  style={{
                    display: 'block',
                    maxWidth: 162,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {selectedUnit ? selectedUnit.cut_size : 'Select'}
                </span>
              </Tooltip>
            )
          }}
        >
          <MenuItem value='' disabled>
            Select
          </MenuItem>
          {cutsizelist?.map(unit => (
            <MenuItem
              key={unit.id}
              value={unit.id}
              sx={{
                display: 'block',
                maxWidth: 150,
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  height: '2px'
                },
                '&::-webkit-scrollbar-thumb': {
                  borderRadius: '1px'
                }
              }}
            >
              {unit.cut_size}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export default SizeSelector
