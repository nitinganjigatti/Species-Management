import React from 'react'
import { Box, Checkbox, Typography, Divider, CircularProgress } from '@mui/material'
import Search from 'src/views/utility/Search'
import ImageWithShimmer from '../utility/ImageWithShimmer'
import { useTheme } from '@mui/material/styles'

const FilterContent = ({
  menuName,
  searchQuery,
  onSearch,
  selectedOptions,
  onOptionChange,
  selectAllHandler,
  items,
  isAllSelected,
  enableSelectAll = false,
  searchLoading,
  placeholder = `Search ${menuName.toLowerCase()}...`
}) => {
  const theme = useTheme()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Search
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          placeholder={placeholder}
          onClear={() => onSearch('')}
        />
      </Box>
      {searchLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {enableSelectAll && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={selectedOptions?.length > 0 && !isAllSelected}
                  onChange={selectAllHandler}
                />
                <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.Outline }}>Select All</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
            </>
          )}
          <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
            {items?.map(item => {
              const isSelected = selectedOptions?.includes(item.value)
              const handleToggle = () => onOptionChange(item.value, menuName)

              return (
                <Box
                  key={item.value}
                  onClick={handleToggle}
                  onKeyDown={event => {
                    if (event.target !== event.currentTarget) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleToggle()
                    }
                  }}
                  tabIndex={0}
                  role='button'
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer'
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    onClick={event => {
                      event.stopPropagation()
                    }}
                    onChange={() => handleToggle()}
                    inputProps={{ 'aria-label': `${menuName} option` }}
                  />
                  {item.image && <ImageWithShimmer src={item.image} alt={item.label} />}
                  <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.Outline }}>
                    {item.label}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default FilterContent
