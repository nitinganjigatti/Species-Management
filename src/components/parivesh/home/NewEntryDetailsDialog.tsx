import React from 'react'
import {
  Avatar, Box, Dialog, DialogContent, DialogTitle,
  Grid, IconButton, Tooltip, Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import { usePariveshContext } from 'src/context/PariveshContext'
import Utility from 'src/utility'

// ==================== Types ====================

interface Attachment {
  attachment: string
  attachment_name: string
}

interface EntryData {
  possession_type?: string
  species_image?: string
  common_name?: string
  scientific_name?: string
  gender?: string
  animal_count?: number
  where_to_acquisition?: string
  death_animal_id?: string
  parent_registration_id?: string
  where_to_transfer?: string
  death_date?: string
  reason_for_death?: string
  dgft_number?: string
  cites_appendix?: string
  created_by_user?: { user_name?: string }
  transaction_date?: string
  attachments?: Attachment[]
}

interface NewEntryDetailsDialogProps {
  isEditModal: boolean
  setIsEditModal: (open: boolean) => void
  detailData: EntryData | null
}

// ==================== Helpers ====================

const capitalizeFirst = (str?: string | null): string => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const convertCitesAppendix = (appendix?: string): string => {
  switch (appendix) {
    case 'Appendix-1': return 'Appendix I'
    case 'Appendix-2': return 'Appendix II'
    case 'Appendix-3': return 'Appendix III'
    default: return 'NA'
  }
}

const truncateFilename = (filename: string, maxLength = 16): string => {
  if (filename.length <= maxLength) return filename
  const start = filename.slice(0, Math.floor(maxLength / 2))
  const end = filename.slice(-Math.floor(maxLength / 2))
  return `${start}...${end}`
}

// ==================== Component ====================

const NewEntryDetailsDialog: React.FC<NewEntryDetailsDialogProps> = ({ isEditModal, setIsEditModal, detailData }) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const auth = useAuth() as any
  const { selectedParivesh } = usePariveshContext()

  const imgPath = auth?.userData?.settings?.DEFAULT_IMAGE_MASTER

  const getIconByFileType = (fileName?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return { icon: imgPath?.pdf?.image_path, bgColor: imgPath?.pdf?.bg_color }
      case 'xls':
      case 'xlsx': return { icon: imgPath?.xls?.image_path, bgColor: imgPath?.xls?.bg_color }
      case 'doc':
      case 'docx': return { icon: imgPath?.document?.image_path, bgColor: imgPath?.document?.bg_color }
      case 'mp3':
      case 'wav':
      case 'ogg': return { icon: imgPath?.audio?.image_path, bgColor: imgPath?.audio?.bg_color }
      default: return { icon: imgPath?.default?.image_path, bgColor: imgPath?.default?.bg_color }
    }
  }

  const renderIcon = (type?: string) => {
    switch (type) {
      case 'birth': return <Icon icon='material-symbols:celebration-outline' fontSize='44px' />
      case 'death': return <Icon icon='ic:baseline-sentiment-dissatisfied' fontSize='44px' />
      case 'transfer': return <Icon icon='material-symbols:moved-location' fontSize='44px' />
      case 'acquisition': return <Icon icon='material-symbols:volunteer-activism-outline' fontSize='44px' />
      default: return null
    }
  }

  const renderRow = (label: string, value?: string | number | null) => (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid size={{ xs: 4 }}>
        <Typography variant='body1' color='#7A8684'>{label}</Typography>
      </Grid>
      <Grid size={{ xs: 0.3 }}>:</Grid>
      <Grid size={{ xs: 7 }}>
        <Typography variant='body1' color='#1F515B'>{value || 'NA'}</Typography>
      </Grid>
    </Grid>
  )

  return (
    <Dialog open={isEditModal} onClose={() => setIsEditModal(false)} fullWidth maxWidth='sm'>
      <DialogTitle sx={{ backgroundColor: '#FFFFFF' }}>
        <IconButton
          onClick={() => setIsEditModal(false)}
          sx={{ top: 8, right: 8, position: 'absolute', color: 'grey.500' }}
        >
          <Icon icon='mdi:close' />
        </IconButton>
        <Box display='flex' alignItems='center'>
          <Box sx={{ backgroundColor: '#EFF5F2', display: 'flex', alignItems: 'center', p: 3, borderRadius: '8px' }}>
            {renderIcon(detailData?.possession_type)}
          </Box>
          <Typography variant='h5' ml={2} color='#1F515B'>
            {capitalizeFirst(detailData?.possession_type)}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ backgroundColor: '#FFFFFF' }}>
        <Box sx={{ borderRadius: '8px', border: '1px solid #ccc', mb: 2 }}>
          {/* Species header */}
          <Box sx={{ backgroundColor: '#E1F9ED', padding: '16px', borderRadius: '8px 8px 0 0', mb: 2 }}>
            <Grid container alignItems='center'>
              <Grid>
                <Avatar src={detailData?.species_image} variant='circular' sx={{ width: 46, height: 46 }} />
              </Grid>
              <Grid sx={{ ml: 3 }}>
                <Typography variant='h6' color='#44544A'>{capitalizeFirst(detailData?.common_name)}</Typography>
                <Typography variant='body2' sx={{ fontStyle: 'italic', color: '#44544A' }}>
                  ({capitalizeFirst(detailData?.scientific_name)})
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Detail rows */}
          <Box sx={{ pl: 6, pr: 6, pb: 3 }}>
            {renderRow(t('gender'), capitalizeFirst(detailData?.gender))}

            {detailData?.possession_type === 'acquisition' &&
              renderRow(t('parivesh_module.acquired_from'), capitalizeFirst(detailData?.where_to_acquisition))}

            {detailData?.possession_type === 'death' &&
              renderRow(t('parivesh_module.animal_id'), capitalizeFirst(detailData?.death_animal_id))}

            {detailData?.possession_type !== 'death' &&
              renderRow(t('parivesh_module.total_count'), detailData?.animal_count)}

            {detailData?.possession_type === 'birth' &&
              renderRow(t('parivesh_module.parent_id'), detailData?.parent_registration_id)}

            {detailData?.possession_type === 'transfer' && (
              <>
                {renderRow(t('parivesh_module.transfer_from'), capitalizeFirst(selectedParivesh?.organization_name))}
                {renderRow(t('parivesh_module.transfer_to'), detailData?.where_to_transfer)}
              </>
            )}

            {detailData?.possession_type === 'death' && (
              <>
                {renderRow(
                  t('parivesh_module.date_of_death'),
                  detailData?.death_date
                    ? Utility.formatDisplayDate(Utility.convertUTCToLocal(detailData.death_date))
                    : 'NA'
                )}
                {renderRow(t('parivesh_module.reason_for_death'), detailData?.reason_for_death)}
              </>
            )}

            {detailData?.possession_type === 'acquisition' && (
              <>
                {renderRow(t('parivesh_module.dgft_number'), capitalizeFirst(detailData?.dgft_number))}
                {renderRow(t('parivesh_module.cites_category'), convertCitesAppendix(detailData?.cites_appendix))}
              </>
            )}

            {renderRow(t('parivesh_module.created_by'), detailData?.created_by_user?.user_name)}
            {renderRow(
              t('parivesh_module.entry_date'),
              detailData?.transaction_date
                ? `${Utility.formatDisplayDate(Utility.convertUTCToLocal(detailData.transaction_date))} ${Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(detailData.transaction_date))}`
                : '-'
            )}
          </Box>
        </Box>

        {/* Attachments */}
        {(detailData?.attachments?.length ?? 0) > 0 && (
          <Box mt={6}>
            <Typography variant='body1' color='#7A8684'>{t('attachments')}:</Typography>
            <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
              {detailData?.attachments?.map((src, index) => {
                const isImage = /\.(jpeg|jpg|gif|png|svg|JPG)$/.test(src.attachment_name)
                return (
                  <Grid size={{ xs: 12, sm: 'auto' }} key={index}>
                    <Box sx={{
                      position: 'relative', display: 'flex', alignItems: 'center', gap: 1,
                      borderRadius: '8px', height: '60px',
                      bgcolor: isImage ? '#f0f0f0' : getIconByFileType(src.attachment_name)?.bgColor
                    }}>
                      {isImage ? (
                        <img
                          style={{ height: '60px', width: '60px', borderRadius: '20%', objectFit: 'cover', padding: '8px' }}
                          alt={`attachment-${index}`}
                          src={src.attachment}
                        />
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, padding: '4px', paddingRight: '16px' }}>
                          <img src={getIconByFileType(src.attachment_name)?.icon} alt='' style={{ height: '40px', width: '40px' }} />
                          <Tooltip title={src.attachment_name}>
                            <Typography variant='body2' color='textSecondary'>
                              {truncateFilename(src.attachment_name)}
                            </Typography>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                )
              })}
            </Grid>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default NewEntryDetailsDialog
