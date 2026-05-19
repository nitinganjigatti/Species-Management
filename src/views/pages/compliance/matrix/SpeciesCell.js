import { useState } from 'react'
import { Box, IconButton, Stack, Tooltip, Typography, alpha } from '@mui/material'
import Icon from 'src/@core/components/icon'
import IucnBadge from './IucnBadge'
import CitesBadge from './CitesBadge'
import { ImagePreview, SpeciesSiteTip } from './HoverPopover'
import { useCachedImage } from 'src/hooks/useCachedImage'

const isMeaningful = v => {
  if (!v) return false
  const s = String(v).trim().toLowerCase()
  return s !== '' && s !== 'undetermined' && s !== 'unknown'
}

const Thumb = ({ src, alt, onMouseEnter, onMouseLeave }) =>
  src ? (
    <Box
      component='img'
      src={src}
      alt={alt || ''}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      sx={{
        width: 36,
        height: 36,
        borderRadius: 0.75,
        objectFit: 'cover',
        flexShrink: 0,
        border: 1,
        borderColor: 'customColors.SurfaceVariant',
        bgcolor: 'customColors.Surface',
        cursor: 'zoom-in',
        transition: 'transform 0.12s, border-color 0.12s',
        '&:hover': { transform: 'scale(1.08)', borderColor: 'primary.main' }
      }}
    />
  ) : (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 0.75,
        flexShrink: 0,
        border: 1,
        borderColor: 'customColors.SurfaceVariant',
        bgcolor: 'customColors.Surface',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'customColors.Outline'
      }}
    >
      <Icon icon='mdi:image-outline' fontSize={18} />
    </Box>
  )

const SpeciesCell = ({ row, editingEnabled, onEdit }) => {
  const commonRaw = isMeaningful(row.common_name) ? row.common_name : ''
  const scientificRaw = isMeaningful(row.scientific_name) ? row.scientific_name : ''
  const common = commonRaw || '—'
  const rawSrc = row.species_image || row.thumbnail_url
  const imgSrc = useCachedImage(rawSrc)

  const [imgAnchor, setImgAnchor] = useState(null)
  const [tipAnchor, setTipAnchor] = useState(null)

  return (
    <Stack direction='row' spacing={1.25} alignItems='center' sx={{ minWidth: 0 }}>
      <Thumb
        src={imgSrc}
        alt={commonRaw}
        onMouseEnter={e => setImgAnchor(e.currentTarget)}
        onMouseLeave={() => setImgAnchor(null)}
      />

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction='row' alignItems='center' spacing={0.75} sx={{ flexWrap: 'wrap' }}>
          <Typography
            variant='body2'
            noWrap
            onMouseEnter={e => setTipAnchor(e.currentTarget)}
            onMouseLeave={() => setTipAnchor(null)}
            sx={{
              fontWeight: 600,
              color: 'customColors.OnSurfaceVariant',
              fontSize: 13.5,
              cursor: 'default'
            }}
          >
            {common}
          </Typography>
          <IucnBadge code={row.iucn_status} />
          <CitesBadge code={row.cites_appendix} />
          {row.needs_review && (
            <Tooltip title='Flagged for review'>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.4,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.75,
                  bgcolor: theme => alpha(theme.palette.customColors.BgTeritary, 1),
                  border: '1px solid',
                  borderColor: theme => alpha(theme.palette.customColors.Tertiary, 0.4),
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: 'customColors.TertiaryDark',
                  lineHeight: 1,
                  cursor: 'default'
                }}
              >
                <Icon icon='mdi:flag' fontSize={10} />
                Review
              </Box>
            </Tooltip>
          )}
        </Stack>
        {scientificRaw && (
          <Typography
            variant='caption'
            noWrap
            sx={{
              color: 'customColors.neutralSecondary',
              fontStyle: 'italic',
              fontSize: 11,
              display: 'block',
              mt: 0.25
            }}
          >
            ({scientificRaw})
          </Typography>
        )}
      </Box>

      {onEdit && editingEnabled && (
        <Tooltip title='Edit row'>
          <IconButton
            size='small'
            onClick={e => {
              e.stopPropagation()
              onEdit(row)
            }}
            sx={{ p: 0.5 }}
          >
            <Icon icon='mdi:pencil-outline' fontSize={16} />
          </IconButton>
        </Tooltip>
      )}

      <ImagePreview
        src={imgSrc}
        commonName={commonRaw}
        scientificName={scientificRaw}
        anchorEl={imgAnchor}
      />
      <SpeciesSiteTip
        taxonomyId={row.taxonomy_id || row.compliance_taxonomy_id}
        commonName={commonRaw}
        scientificName={scientificRaw}
        anchorEl={tipAnchor}
      />
    </Stack>
  )
}

export const ComplianceSpeciesCell = ({ row }) => {
  const canonicalCommon = isMeaningful(row.common_name) ? row.common_name : ''
  const canonicalSci = isMeaningful(row.scientific_name) ? row.scientific_name : ''
  const rawCompCommon = isMeaningful(row.compliance_common_name) ? row.compliance_common_name : ''
  const rawCompSci = isMeaningful(row.compliance_scientific_name) ? row.compliance_scientific_name : ''
  const compCommon = rawCompCommon || canonicalCommon
  const compSci = rawCompSci || canonicalSci

  const changed =
    (rawCompCommon && rawCompCommon !== canonicalCommon) ||
    (rawCompSci && rawCompSci !== canonicalSci)

  if (!compCommon && !compSci) {
    return <Box component='span' sx={{ color: 'customColors.Outline' }}>—</Box>
  }

  return (
    <Box
      sx={{
        minWidth: 0,
        ...(changed && {
          mx: -2,
          my: -1.75,
          px: 2,
          py: 1.75,
          bgcolor: 'customColors.OnBackground'
        })
      }}
    >
      <Typography
        variant='body2'
        noWrap
        sx={{
          fontWeight: 600,
          fontSize: 13.5,
          color: changed ? 'primary.dark' : 'customColors.OnSurfaceVariant'
        }}
      >
        {compCommon || '—'}
      </Typography>
      {compSci && (
        <Typography
          variant='caption'
          noWrap
          sx={{
            color: 'customColors.neutralSecondary',
            fontStyle: 'italic',
            fontSize: 11,
            display: 'block',
            mt: 0.25
          }}
        >
          ({compSci})
        </Typography>
      )}
    </Box>
  )
}

export default SpeciesCell
