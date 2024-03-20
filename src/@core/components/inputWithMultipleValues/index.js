import { Chip, TextField } from '@mui/material'
import { Box } from '@mui/system'

const InputwithMultipleValues = ({ inputValue, handleInputChange, handleKeyDown, selectedValues, handleDelete }) => {
  return (
    <TextField
      sx={{
        '& .css-qk6udw-MuiInputBase-root-MuiOutlinedInput-root': {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'start'
        },
        '& .css-1h4ufgz-MuiInputBase-input-MuiOutlinedInput-input': {
          pt: selectedValues?.length > 0 ? 1 : 4
        }
      }}
      label='Prepration Types'
      value={inputValue}
      onChange={handleInputChange}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault()
          handleKeyDown(e)
        }
      }}
      InputProps={{
        startAdornment:
          selectedValues?.length > 0 ? (
            <Box sx={{ display: 'inline', mt: selectedValues?.length > 0 && 1.4 }}>
              {selectedValues.map(value => (
                <Chip
                  key={value.title}
                  label={value.title}
                  onDelete={() => handleDelete(value)}
                  color='primary'
                  style={{ margin: '4px' }}
                />
              ))}
            </Box>
          ) : null
      }}
      placeholder='Prepration Types'
    />
  )
}

export default InputwithMultipleValues
