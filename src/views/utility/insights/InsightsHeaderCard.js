import React from 'react'
import { Box, Typography, IconButton, Stack, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import AddIcon from '@mui/icons-material/Add'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import Icon from 'src/@core/components/icon'
import { useTranslation } from 'react-i18next'

const HeaderCard = ({
  title,
  subtitle,
  isListingPage,
  onEdit,
  onDelete,
  onAddNew,
  onTimeClick,
  onQrClick,
  hasQrCode,
  addNewTooltip = 'Add new',
  editTooltip = 'Edit'
}) => {
  const theme = useTheme()
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: { sm: 'nowrap', xs: 'wrap' },
        gap: 6
      }}
    >
      <Box>
        {title && (
          <Typography sx={{ color: theme.palette.common.white, fontSize: '1.5rem', fontWeight: '600' }}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography sx={{ mt: 0.5, color: theme.palette.common.white, fontSize: '0.875rem' }}>{subtitle}</Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
        {onTimeClick && (
          <IconButton
            sx={{
              color: theme.palette.common.white,
              transition: 'color 0.2s'
            }}
            size='small'
            onClick={onTimeClick}
          >
            <AccessTimeIcon sx={{ color: theme.palette.common.white }} />
          </IconButton>
        )}

        {onDelete && (
          <IconButton
            sx={{
              color: theme.palette.common.white,
              transition: 'color 0.2s'
            }}
            size='small'
            onClick={onDelete}
          >
            <DeleteOutlineOutlinedIcon sx={{ color: theme.palette.common.white }} />
          </IconButton>
        )}
        {onAddNew && (
          <Tooltip title={addNewTooltip} arrow>
            <Stack direction='row' spacing={2} alignItems='center' sx={{ cursor: 'pointer' }} onClick={onAddNew}>
              <Typography
                sx={{ color: theme.palette.customColors.PrimaryContainer, fontSize: '0.875rem', whiteSpace: 'nowrap' }}
              >
                {t('add_new')}
              </Typography>
              <IconButton
                sx={{
                  border: '1px solid',
                  borderColor: theme.palette.customColors.PrimaryContainer,
                  color: theme.palette.customColors.PrimaryContainer,
                  transition: 'color 0.2s',
                  borderRadius: 0.5,
                  padding: 0
                }}
              >
                <AddIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Stack>
          </Tooltip>
        )}
        {onEdit && (
          <Tooltip title={editTooltip} arrow>
            <IconButton
              sx={{
                color: theme.palette.common.white,
                transition: 'color 0.2s'
              }}
              size='small'
              onClick={onEdit}
            >
              <ModeEditOutlineOutlinedIcon sx={{ color: theme.palette.common.white }} />
            </IconButton>
          </Tooltip>
        )}
        {hasQrCode && onQrClick && (
          <IconButton
            sx={{
              color: theme.palette.common.white,
              transition: 'color 0.2s'
            }}
            size='large'
            onClick={onQrClick}
          >
            <Icon icon='mdi:qrcode' fontSize={32} />
          </IconButton>
        )}
      </Box>
    </Box>
  )
}

export default React.memo(HeaderCard)
