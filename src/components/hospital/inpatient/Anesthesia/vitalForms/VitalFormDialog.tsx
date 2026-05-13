'use client'

import React from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useTheme } from '@mui/material/styles'

interface VitalFormDialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
  timeLabel?: string
  onSubmit: () => void
  submitLabel?: string
  cancelLabel?: string
  hideCancel?: boolean
  disableSubmit?: boolean
  maxWidth?: any
  headerSx?: any
  titleTypographySx?: any
  closeButtonSx?: any
  contentSx?: any
  actionsSx?: any
  cancelButtonSx?: any
  submitButtonSx?: any
  paperSx?: any
  renderHeader?: any
}

export default function VitalFormDialog({
  open,
  onClose,
  title,
  children,
  timeLabel,
  onSubmit,
  submitLabel = 'Add Entry',
  cancelLabel = 'Cancel',
  hideCancel = false,
  disableSubmit = false,
  maxWidth = 'xs',
  headerSx,
  titleTypographySx,
  closeButtonSx,
  contentSx,
  actionsSx,
  cancelButtonSx,
  submitButtonSx,
  paperSx,
  renderHeader
}: VitalFormDialogProps) {
  const theme: any = useTheme()

  const defaultHeaderSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '16px 24px',
    backgroundColor: theme.palette.customColors?.bodyBg || theme.palette.background.default
  }

  const defaultTitleSx = {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: '18px',
    letterSpacing: 0,
    color: theme.palette.customColors?.customHeadingTextColor || theme.palette.text.primary
  }

  const defaultCloseButtonSx = {
    border: `1px solid ${theme.palette.customColors?.SurfaceVariant || theme.palette.divider}`,
    color: theme.palette.customColors?.Outline || theme.palette.text.secondary,
    width: 36,
    height: 36
  }

  const timeChipStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '24px',
    backgroundColor: theme.palette.primary.contrastText,
    border: `1px solid ${theme.palette.customColors?.OutlineVariant || theme.palette.divider}`,
    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.secondary,
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '14px',
    letterSpacing: 0
  }

  const defaultContentSx = {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }

  const defaultActionsSx = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px 24px'
  }

  const defaultCancelButtonSx = {
    minWidth: '128px',
    height: '48px',
    borderRadius: '8px',
    borderColor: theme.palette.customColors?.OutlineVariant || theme.palette.divider,
    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: '16px',
    letterSpacing: 0
  }

  const defaultSubmitButtonSx = {
    minWidth: '140px',
    height: '48px',
    borderRadius: '8px',
    backgroundColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark || theme.palette.primary.main
    },
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: '16px',
    letterSpacing: 0
  }

  const headerContent =
    renderHeader !== undefined
      ? typeof renderHeader === 'function'
        ? renderHeader({ onClose, timeLabel })
        : renderHeader
      : null

  return (
    <Dialog
      open={open}
      onClose={(event: any, reason: any) => {
        if (reason === 'backdropClick') return
        onClose()
      }}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          border: `1px solid ${theme.palette.primary.main}`,
          boxShadow: `0px 0px 14px 0px ${theme.palette.customColors?.shadowColor || '#00000040'}`,
          overflow: 'hidden',
          ...paperSx
        }
      }}
    >
      {headerContent ? (
        headerContent
      ) : (
        <DialogTitle sx={{ ...defaultHeaderSx, ...headerSx }}>
          <Typography sx={{ ...defaultTitleSx, ...titleTypographySx }}>{title}</Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {timeLabel ? (
              <Box sx={timeChipStyles}>
                <AccessTimeRoundedIcon sx={{ fontSize: '18px' }} />
                <span>{timeLabel}</span>
              </Box>
            ) : null}

            <IconButton edge='end' onClick={onClose} sx={{ ...defaultCloseButtonSx, ...closeButtonSx }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </DialogTitle>
      )}

      <DialogContent sx={{ ...defaultContentSx, ...contentSx }}>{children}</DialogContent>

      <DialogActions sx={{ ...defaultActionsSx, ...actionsSx }}>
        {!hideCancel ? (
          <Button variant='outlined' onClick={onClose} sx={{ ...defaultCancelButtonSx, ...cancelButtonSx }}>
            {cancelLabel}
          </Button>
        ) : null}
        <Button
          variant='contained'
          onClick={onSubmit}
          disabled={disableSubmit}
          sx={{ ...defaultSubmitButtonSx, ...submitButtonSx }}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
