'use client'

import React from 'react'
import { Box, Typography, IconButton, Tooltip, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'

interface SurgeryTemplateCardProps {
  template: any
  selectedTemplate?: any
  onSelect: (template: any) => void
  onEdit: (template: any) => void
  onDelete: (template: any) => void
  disabled?: boolean
  isDeleting?: boolean
}

const SurgeryTemplateCard = ({ template, selectedTemplate, onSelect, onEdit, onDelete, disabled = false, isDeleting }: SurgeryTemplateCardProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()

  return (
    <Box
      key={template.id}
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
        backgroundColor:
          selectedTemplate?.id === template.id
            ? theme.palette.customColors.OnBackground
            : theme.palette.primary.contrastText,
        padding: '16px',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto'
      }}
      onClick={() => {
        if (!disabled) {
          onSelect(template)
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {template.title}
        </Typography>
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '1.4',
            '& a': {
              color: theme.palette.primary.main
            }
          }}
          component='div'
          dangerouslySetInnerHTML={{ __html: template.description || '' }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Tooltip title={(t('hospital_module.edit_template') as string)}>
          <IconButton
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation()
              onEdit(template)
            }}
            sx={{ height: '30px', width: '30px', p: 0, color: theme.palette.customColors.OnSurfaceVariant }}
          >
            <Icon icon='mdi:pencil' fontSize={20} />
          </IconButton>
        </Tooltip>

        <Tooltip title={(t('hospital_module.delete_template') as string)}>
          <IconButton
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation()
              if (!disabled) {
                onDelete(template)
              }
            }}
            disabled={disabled}
            sx={{ height: '30px', width: '30px', p: 0, color: theme.palette.primary.light }}
          >
            {isDeleting ? <CircularProgress size={18} /> : <Icon icon='mdi:close' fontSize={20} />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default SurgeryTemplateCard
