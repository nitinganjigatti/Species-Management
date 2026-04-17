import React, { useState, useCallback, FC, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Avatar, CircularProgress, useTheme, IconButton, Theme } from '@mui/material'
import { Autocomplete, TextField, AutocompleteInputChangeReason } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { debounce, DebouncedFunc } from 'lodash'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { useAuth } from 'src/hooks/useAuth'

interface SelectedUser {
  user_id: number | string
  user_name: string
  user_profile_pic?: string
  role_name?: string
}

interface UserMultiSelectProps {
  selectedUsers?: SelectedUser[]
  onChange: (users: SelectedUser[]) => void
  label?: string
  disabled?: boolean
}

interface UserListResponse {
  data?: Array<{
    user_id: number | string
    user_name: string
    user_profile_pic?: string
    role_name?: string
  }>
}

interface AuthData {
  userData?: {
    user?: {
      zoos?: Array<{
        zoo_id?: number | string
      }>
    }
  }
}

const UserMultiSelect: FC<UserMultiSelectProps> = ({
  selectedUsers = [],
  onChange,
  label,
  disabled = false
}) => {
  const { t } = useTranslation()
  const resolvedLabel = label || t('necropsy_module.search_and_select_users')
  const theme = useTheme<Theme>()
  const [options, setOptions] = useState<SelectedUser[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>('')

  const auth = useAuth() as unknown as AuthData
  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id

  const fetchUsers: DebouncedFunc<(query: string) => Promise<void>> = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setOptions([])

        return
      }

      if (!zooId) return

      try {
        setLoading(true)
        const res: UserListResponse = await getUserList({ zoo_id: zooId, q: query })

        const users: SelectedUser[] =
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
    [selectedUsers, zooId]
  )

  const handleSelect = (_event: React.SyntheticEvent, value: SelectedUser[]): void => {
    if (value && value.length > selectedUsers.length) {
      const newUser = value[value.length - 1]
      onChange([...selectedUsers, newUser])
    }
    setInputValue('')
    setOptions([])
  }

  const handleRemove = (userId: number | string): void => {
    onChange(selectedUsers.filter(u => u.user_id !== userId))
  }

  return (
    <Box>
      <Autocomplete<SelectedUser, true>
        multiple
        disabled={disabled}
        options={options}
        value={selectedUsers}
        loading={loading}
        inputValue={inputValue}
        onInputChange={(_e: React.SyntheticEvent, value: string, reason: AutocompleteInputChangeReason) => {
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
        getOptionLabel={(option: SelectedUser) => option.user_name || ''}
        isOptionEqualToValue={(option: SelectedUser, value: SelectedUser) => option.user_id === value.user_id}
        filterSelectedOptions
        noOptionsText={inputValue.length < 2 ? t('necropsy_module.type_at_least_2_characters') : t('necropsy_module.no_users_found')}
        renderTags={() => null}
        renderOption={(props, option: SelectedUser) => (
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
            label={resolvedLabel}
            placeholder={t('necropsy_module.search_and_select')}
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
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.text.secondary }}>
            {t('necropsy_module.selected_count', { count: selectedUsers.length })}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {selectedUsers.map((user: SelectedUser) => (
              <Box
                key={user.user_id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: '50px',
                  py: 0.5,
                  pl: 0.5,
                  pr: 1.5
                }}
              >
                <Avatar src={user.user_profile_pic} sx={{ width: 28, height: 28, fontSize: '12px' }}>
                  {user.user_name?.charAt(0)}
                </Avatar>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 500, lineHeight: 1.3 }}>{user.user_name}</Typography>
                  {user.role_name && (
                    <Typography sx={{ fontSize: '10px', color: 'text.secondary', lineHeight: 1.2 }}>
                      {user.role_name}
                    </Typography>
                  )}
                </Box>
                {!disabled && (
                  <IconButton
                    size='small'
                    onClick={() => handleRemove(user.user_id)}
                    sx={{ p: 0, color: theme.palette.grey[400] }}
                  >
                    <Icon icon='mdi:close-circle' fontSize={16} />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default memo(UserMultiSelect)
