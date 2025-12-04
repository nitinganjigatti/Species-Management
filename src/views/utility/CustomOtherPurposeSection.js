// src/components/CustomOtherPurposeSection.jsx
import React, { useState } from 'react'
import { Box, TextField, Button, Typography, IconButton, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

export default function CustomOtherPurposeSection({
  title = 'Add New Other Purpose',
  addedLabel = 'Other Purposes Added',
  value = [],
  onChange,
  placeholder = 'Enter new purpose',
  sx = {},
  commonTextFieldSx = {}
}) {
  const theme = useTheme()
  const [newItem, setNewItem] = useState('')

  // Add item
  const handleAdd = () => {
    const trimmed = newItem.trim()
    if (!trimmed) return
    onChange([...value, trimmed])
    setNewItem('')
  }

  // Remove item
  const handleRemove = item => {
    onChange(value.filter(v => v !== item))
  }

  // TextField style
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px',
      color: theme.palette.customColors.OnSurfaceVariant
    },
    '& .MuiInputBase-input': {
      color: theme.palette.customColors.OnSurfaceVariant
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.customColors.OnSurfaceVariant
    }
  }

  return (
    <>
      {/* Render existing custom items if any */}
      {value.length > 0 && (
        <Box>
          <Typography
            sx={{
              fontSize: '14px',
              mb: 2,
              color: theme.palette.customColors.OnSurfaceVariant,
              fontWeight: 600
            }}
          >
            {addedLabel}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {value.map(p => (
              <Box
                key={p}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 3,
                  py: 2,
                  borderRadius: '8px',
                  backgroundColor: alpha(theme.palette.customColors.PrimaryContainer, 0.2),
                  color: theme.palette.getContrastText(theme.palette.success.main),
                  fontSize: '14px',
                  border: `1px solid ${theme.palette.primary.main}`
                }}
              >
                <span style={{ whiteSpace: 'nowrap' }}>{p}</span>
                <IconButton size='small' onClick={() => handleRemove(p)} sx={{ color: theme.palette.text.Outline }}>
                  <Icon icon='mdi:close' fontSize={22} />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Add new item section */}
      <Box
        mt={5}
        sx={{
          background: theme.palette.customColors.mdAntzNeutral,
          borderRadius: '8px',
          padding: '16px',
          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          width: { xs: '100%', sm: '60%' },
          ...sx
        }}
      >
        <Typography
          fontWeight={600}
          mb={2}
          sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}
        >
          {title}
        </Typography>

        <Box display='flex' gap={2}>
          <TextField
            fullWidth
            placeholder={placeholder}
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            sx={{
              background: theme.palette.common.white,
              ...textFieldSx,
              ...commonTextFieldSx
            }}
          />
          <Button
            variant='contained'
            color='secondary'
            disabled={!newItem.trim()}
            onClick={handleAdd}
            sx={{
              minWidth: 120,
              background: theme.palette.primary.main,
              boxShadow: 'none',
              borderRadius: '4px'
            }}
          >
            ADD
          </Button>
        </Box>
      </Box>
    </>
  )
}
