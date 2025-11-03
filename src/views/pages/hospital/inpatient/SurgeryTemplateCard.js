import React from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

const SurgeryTemplateCard = ({ template, selectedTemplate, onSelect, onEdit, onDelete }) => {
  const theme = useTheme()

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
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onClick={() => onSelect(template)}
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
        <IconButton
          onClick={e => {
            e.stopPropagation()
            onEdit(template)
          }}
          sx={{ height: '30px', width: '30px', p: 0, color: theme.palette.customColors.OnSurfaceVariant }}
        >
          <Icon icon='mdi:pencil' fontSize={20} />
        </IconButton>
        <IconButton
          onClick={e => {
            e.stopPropagation()
            onDelete(template)
          }}
          sx={{ height: '30px', width: '30px', p: 0, color: theme.palette.primary.light }}
        >
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>
    </Box>
  )
}

export default SurgeryTemplateCard
