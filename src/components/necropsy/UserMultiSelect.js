import React, { useState, useCallback } from 'react'
import { Box, Typography, Chip, Avatar, CircularProgress, useTheme } from '@mui/material'
import { Autocomplete, TextField } from '@mui/material'
import { debounce } from 'lodash'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { useAuth } from 'src/hooks/useAuth'

const UserMultiSelect = ({ selectedUsers = [], onChange, label = 'Search & Select Users', disabled = false }) => {
  const theme = useTheme()
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const auth = useAuth()
  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id

  const fetchUsers = useCallback(
    debounce(async query => {
      if (!query || query.length < 2) {
        setOptions([])

        return
      }

      if (!zooId) return

      try {
        setLoading(true)
        const res = await getUserList({ zoo_id: zooId, q: query })

        const users =
          res?.data?.map(item => ({
            user_id: item.user_id,
            user_name: item.user_name,
            user_profile_pic: item.user_profile_pic || '',
            role_name: item.role_name || ''
          })) || []

        const selectedIds = selectedUsers.map(u => u.user_id)
        setOptions(users.filter(u => !selectedIds.includes(u.user_id)))
      } catch (error) {
        console.error('Error fetching users:', error)
        setOptions([])
      } finally {
        setLoading(false)
      }
    }, 500),
    [selectedUsers]
  )

  const handleSelect = (event, value) => {
    if (value && value.length > selectedUsers.length) {
      const newUser = value[value.length - 1]
      onChange([...selectedUsers, newUser])
    }
    setInputValue('')
    setOptions([])
  }

  const handleRemove = userId => {
    onChange(selectedUsers.filter(u => u.user_id !== userId))
  }

  return (
    <Box>
      <Autocomplete
        multiple
        disabled={disabled}
        options={options}
        value={selectedUsers}
        loading={loading}
        inputValue={inputValue}
        onInputChange={(e, value, reason) => {
          if (reason === 'input') {
            setInputValue(value)
            fetchUsers(value)
          }
          if (reason === 'clear') {
            setInputValue('')
            setOptions([])
          }
        }}
        onChange={handleSelect}
        getOptionLabel={option => option.user_name || ''}
        isOptionEqualToValue={(option, value) => option.user_id === value.user_id}
        filterSelectedOptions
        noOptionsText={inputValue.length < 2 ? 'Type at least 2 characters to search' : 'No users found'}
        renderTags={() => null}
        renderOption={(props, option) => (
          <li {...props} key={option.user_id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar src={option.user_profile_pic} sx={{ width: 32, height: 32 }}>
                {option.user_name?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>
                  {option.user_name}
                </Typography>
                {option.role_name && (
                  <Typography variant='caption' color='text.secondary'>
                    {option.role_name}
                  </Typography>
                )}
              </Box>
            </Box>
          </li>
        )}
        renderInput={params => (
          <TextField
            {...params}
            label={label}
            placeholder='Search & Select'
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color='inherit' size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }
            }}
          />
        )}
      />
      {selectedUsers.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          {selectedUsers.map(user => (
            <Chip
              key={user.user_id}
              avatar={<Avatar src={user.user_profile_pic}>{user.user_name?.charAt(0)}</Avatar>}
              label={user.user_name}
              onDelete={disabled ? undefined : () => handleRemove(user.user_id)}
              variant='outlined'
              sx={{
                borderColor: theme.palette.divider,
                '& .MuiChip-label': {
                  fontWeight: 500,
                  fontSize: '13px'
                }
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

export default React.memo(UserMultiSelect)
