import { Chip, TextField } from '@mui/material'
import { Box } from '@mui/system'

const InputwithMultipleValues = ({ name }) => {
  // const [inputValue, setInputValue] = useState('')
  // const [selectedValues, setSelectedValues] = useState([])

  // const handleInputChange = event => {
  //   setInputValue(event.target.value)
  // }
  // const handleKeyDown = event => {
  //   if (event.key === 'Enter' && inputValue.trim() !== '') {
  //     if (selectedValues.findIndex(item => item?.title === inputValue) == -1) {
  //       setSelectedValues(prevValues => [...prevValues, { title: inputValue }])
  //       setValue('preprationTypes', [...getValues('preprationTypes'), inputValue])
  //     }
  //     setInputValue('')
  //   }
  // }

  // const handleDelete = valueToDelete => {
  //   setSelectedValues(prevValues => prevValues.filter(value => value !== valueToDelete))
  // }
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
      name={name}
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
