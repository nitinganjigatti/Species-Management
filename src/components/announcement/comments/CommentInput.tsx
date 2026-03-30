'use client'

import { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Icon from 'src/@core/components/icon'
import type { CommentInputProps } from 'src/types/announcement'

const CommentInput = ({ onSubmit, isLoading = false, placeholder = 'Add a comment...' }: CommentInputProps) => {
  const [comment, setComment] = useState('')
  const theme = useTheme()

  const primaryColor = theme.palette.primary.main
  const textSecondary = theme.palette.customColors.neutralSecondary
  const backgroundColor = theme.palette.customColors.SurfaceVariant
  const borderColor = theme.palette.customColors.OutlineVariant

  const handleSubmit = () => {
    if (comment.trim() && !isLoading) {
      onSubmit(comment.trim())
      setComment('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 2,
        borderTop: `1px solid ${borderColor}`,
        backgroundColor: theme.palette.background.paper
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={comment}
        onChange={e => setComment(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={isLoading}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '20px',
            backgroundColor: backgroundColor,
            fontSize: '0.875rem',
            '& fieldset': {
              border: 'none'
            },
            '&:hover fieldset': {
              border: 'none'
            },
            '&.Mui-focused fieldset': {
              border: 'none'
            }
          },
          '& .MuiInputBase-input': {
            py: 1.25,
            px: 2
          }
        }}
      />

      <IconButton
        onClick={handleSubmit}
        disabled={!comment.trim() || isLoading}
        sx={{
          backgroundColor: comment.trim() && !isLoading ? primaryColor : 'transparent',
          color: comment.trim() && !isLoading ? theme.palette.customColors.OnPrimary : textSecondary,
          '&:hover': {
            backgroundColor: comment.trim() && !isLoading ? primaryColor : 'transparent'
          },
          '&.Mui-disabled': {
            color: textSecondary
          }
        }}
      >
        {isLoading ? (
          <CircularProgress size={20} sx={{ color: primaryColor }} />
        ) : (
          <Icon icon='mdi:send' fontSize={20} />
        )}
      </IconButton>
    </Box>
  )
}

export default CommentInput
