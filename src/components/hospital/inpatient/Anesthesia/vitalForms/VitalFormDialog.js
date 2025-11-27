import React from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography
} from '@mui/material'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useTheme } from '@mui/material/styles'

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
}) {
  const theme = useTheme()

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
      onClose={onClose}
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
        <Button variant='contained' onClick={onSubmit} disabled={disableSubmit} sx={{ ...defaultSubmitButtonSx, ...submitButtonSx }}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

VitalFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  timeLabel: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  hideCancel: PropTypes.bool,
  disableSubmit: PropTypes.bool,
  maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  headerSx: PropTypes.object,
  titleTypographySx: PropTypes.object,
  closeButtonSx: PropTypes.object,
  contentSx: PropTypes.object,
  actionsSx: PropTypes.object,
  cancelButtonSx: PropTypes.object,
  submitButtonSx: PropTypes.object,
  paperSx: PropTypes.object,
  renderHeader: PropTypes.oneOfType([PropTypes.node, PropTypes.func])
}
