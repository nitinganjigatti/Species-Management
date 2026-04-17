import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Chip
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { alpha, useTheme } from '@mui/material/styles'
import type { ExternalAnimal } from 'src/types/housing'

interface ExternalAnimalDetailsDialogProps {
  open: boolean
  onClose: () => void
  animal: ExternalAnimal | null
  parentType?: 'sire' | 'dam' | string
}

interface DetailRowProps {
  label: string
  value?: string | number | null
  isHighlighted?: boolean
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, isHighlighted = false }) => {
  const theme = useTheme()

  if (!value && value !== 0) return null

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
      <Typography
        sx={{
          fontSize: '0.875rem',
          color: theme.palette.text.secondary,
          fontWeight: 400
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.875rem',
          color: isHighlighted ? theme.palette.primary.main : theme.palette.text.primary,
          fontWeight: isHighlighted ? 600 : 500,
          textAlign: 'right',
          maxWidth: '60%',
          wordBreak: 'break-word'
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

const ExternalAnimalDetailsDialog: React.FC<ExternalAnimalDetailsDialogProps> = ({
  open,
  onClose,
  animal,
  parentType
}) => {
  const theme = useTheme() as any
  const { t } = useTranslation()

  if (!animal) return null

  const isAlive = () => {
    if (typeof animal.is_alive === 'number') return animal.is_alive === 1
    if (typeof animal.is_alive === 'string') return animal.is_alive === '1'
    
return true
  }

  const getSexDisplay = () => {
    const sex = animal.sex?.toLowerCase()
    if (sex === 'male') return t('male')
    if (sex === 'female') return t('female')
    if (parentType === 'sire') return t('male')
    if (parentType === 'dam') return t('female')

return animal.sex || t('animals_module.unknown')
  }

  const getIdentifier = () => {
    if (animal.local_identifier) return animal.local_identifier
    if (animal.external_parent_id) return `EXT-${animal.external_parent_id}`
    if (animal.id) return `EXT-${animal.id}`
    
return 'N/A'
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.palette.customColors?.mdAntzNeutral || alpha(theme.palette.grey[500], 0.08),
          py: 2,
          px: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
            {t('animals_module.external_animal_details')}
          </Typography>
          <Chip
            label={t('animals_module.external')}
            size='small'
            sx={{
              backgroundColor: alpha(theme.palette.warning.main, 0.15),
              color: theme.palette.warning.dark,
              fontWeight: 600,
              fontSize: '0.6875rem'
            }}
          />
        </Box>
        <IconButton onClick={onClose} size='small'>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Header Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 3,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Avatar
            sx={{
              width: 64,
              height: 64,
              backgroundColor: alpha(theme.palette.grey[500], 0.1),
              fontSize: '1.5rem',
              fontWeight: 600,
              color: theme.palette.text.secondary
            }}
          >
            {(getSexDisplay() ?? '').charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {!isAlive() && (
                <Chip
                  label={t('animals_module.dead')}
                  size='small'
                  sx={{
                    backgroundColor: alpha(theme.palette.error.main, 0.15),
                    color: theme.palette.error.main,
                    fontWeight: 600,
                    fontSize: '0.625rem',
                    height: 20
                  }}
                />
              )}
            </Box>
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 600,
                color: theme.palette.text.primary
              }}
            >
              {getIdentifier()}
            </Typography>
            {animal.common_name && (
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.text.secondary
                }}
              >
                {animal.common_name}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Details Section */}
        <Box sx={{ px: 3, py: 2 }}>
          <DetailRow label={t('animals_module.id_number')} value={getIdentifier()} isHighlighted />
          <Divider sx={{ my: 0.5 }} />

          <DetailRow label={t('animals_module.sex')} value={getSexDisplay()} />
          <Divider sx={{ my: 0.5 }} />

          <DetailRow label={t('status')} value={isAlive() ? t('animals_module.alive') : t('animals_module.dead')} />
          <Divider sx={{ my: 0.5 }} />

          {animal.organization_name && (
            <>
              <DetailRow label={t('animals_module.institute_organization')} value={animal.organization_name} />
              <Divider sx={{ my: 0.5 }} />
            </>
          )}

          {animal.locality && (
            <>
              <DetailRow label={t('animals_module.locality')} value={animal.locality} />
              <Divider sx={{ my: 0.5 }} />
            </>
          )}

          {animal.breed_name && (
            <>
              <DetailRow label={t('animals_module.breed')} value={animal.breed_name} />
              <Divider sx={{ my: 0.5 }} />
            </>
          )}

          {animal.morph_name && (
            <>
              <DetailRow label={t('animals_module.morph_variant')} value={animal.morph_name} />
              <Divider sx={{ my: 0.5 }} />
            </>
          )}

          {animal.notes && (
            <Box sx={{ mt: 2 }}>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  mb: 1
                }}
              >
                {t('notes')}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.text.primary,
                  backgroundColor: alpha(theme.palette.grey[500], 0.05),
                  p: 2,
                  borderRadius: '8px'
                }}
              >
                {animal.notes}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default React.memo(ExternalAnimalDetailsDialog)
