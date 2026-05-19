import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Autocomplete, Box, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { searchComplianceSpecies } from 'src/lib/api/compliance/matrix'

const CREATE_OPTION_ID = '__create__'

const useDebounce = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const AsyncSpeciesAutocomplete = ({ value, onChange, excludeTaxonomyId }) => {
  const [inputValue, setInputValue] = useState('')
  const debounced = useDebounce(inputValue, 250)

  const { data, isFetching } = useQuery({
    queryKey: ['compliance-species-search', debounced],
    queryFn: () => searchComplianceSpecies({ q: debounced, limit: 10 }),
    enabled: debounced.trim().length >= 2,
    placeholderData: previousData => previousData
  })

  const options = useMemo(() => {
    const items = (data?.data?.items ?? data?.data ?? []).filter(
      item => item.compliance_taxonomy_id !== excludeTaxonomyId
    )

    const mapped = items.map(item => ({
      type: 'existing',
      id: item.compliance_taxonomy_id,
      compliance_species_id: item.compliance_species_id,
      common_name: item.compliance_common_name || item.canonical_common_name || '',
      scientific_name: item.compliance_scientific_name || item.canonical_scientific_name || ''
    }))

    const typed = inputValue.trim()
    if (typed.length >= 2) {
      mapped.push({
        type: 'create',
        id: CREATE_OPTION_ID,
        common_name: typed,
        scientific_name: typed
      })
    }

    return mapped
  }, [data, inputValue, excludeTaxonomyId])

  return (
    <Autocomplete
      value={value}
      onChange={(_, v) => onChange(v)}
      inputValue={inputValue}
      onInputChange={(_, v) => setInputValue(v)}
      options={options}
      loading={isFetching}
      filterOptions={x => x}
      isOptionEqualToValue={(o, v) => o?.id === v?.id}
      getOptionLabel={opt => opt?.common_name || ''}
      renderOption={(props, opt) => {
        if (opt.type === 'create') {
          return (
            <li {...props} key='create'>
              <Stack direction='row' spacing={1} alignItems='center' sx={{ color: 'primary.main' }}>
                <Icon icon='mdi:plus-circle-outline' fontSize={18} />
                <Typography variant='body2' sx={{ fontWeight: 500 }}>
                  Create &quot;{opt.common_name}&quot; as new
                </Typography>
              </Stack>
            </li>
          )
        }
        return (
          <li {...props} key={opt.id}>
            <Box>
              <Typography variant='body2' sx={{ fontWeight: 600 }}>
                {opt.common_name}
              </Typography>
              <Typography variant='caption' sx={{ fontStyle: 'italic', color: 'customColors.neutralSecondary' }}>
                {opt.scientific_name}
              </Typography>
            </Box>
          </li>
        )
      }}
      renderInput={params => (
        <TextField
          {...params}
          size='small'
          placeholder='Search compliance species…'
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <Box sx={{ ml: 0.5, mr: 1, display: 'flex', color: 'customColors.Outline' }}>
                <Icon icon='mdi:magnify' fontSize={18} />
              </Box>
            ),
            endAdornment: (
              <>
                {isFetching ? <CircularProgress size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
      noOptionsText={
        inputValue.trim().length < 2 ? 'Type at least 2 characters…' : 'No species found'
      }
    />
  )
}

export default AsyncSpeciesAutocomplete
