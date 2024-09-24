import React from 'react'
import { Box, Grid, Avatar, Typography, Dialog, DialogTitle, DialogContent, IconButton, Tooltip } from '@mui/material'
import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'
import { useAuth } from 'src/hooks/useAuth'
import { useTheme } from '@emotion/react'
import { usePariveshContext } from 'src/context/PariveshContext'

const NewEntryDetailsDialog = ({ isEditModal, setIsEditModal, detailData }) => {
  const { selectedParivesh } = usePariveshContext()
  const auth = useAuth()
  const theme = useTheme()
  const borderColor = '#ccc'
  const backgroundColor = '#E1F9ED'
  const titleBackgroundColor = '#FFFFFF'
  const iconBackgroundColor = '#EFF5F2'
  const labelColor = '#7A8684'
  const valueColor = '#1F515B'
  const imgPath = auth?.userData?.settings?.DEFAULT_IMAGE_MASTER

  const renderDetailRow = (label, value) => (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={4}>
        <Typography variant='body1' color={labelColor}>
          {label}
        </Typography>
      </Grid>
      <Grid item xs={0.3}>
        :
      </Grid>
      <Grid item xs={7}>
        <Typography variant='body1' color={valueColor}>
          {value || 'NA'}
        </Typography>
      </Grid>
    </Grid>
  )

  const renderIcon = type => {
    switch (type) {
      case 'birth':
        return <Icon icon='material-symbols:celebration-outline' fontSize='44px' />
      case 'death':
        return <Icon icon='ic:baseline-sentiment-dissatisfied' fontSize='44px' />
      case 'transfer':
        return <Icon icon='material-symbols:moved-location' fontSize='44px' />
      case 'acquisition':
        return <Icon icon='material-symbols:volunteer-activism-outline' fontSize='44px' />
      default:
        return null
    }
  }

  const capitalizeFirstLetter = str => {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const getIconByFileType = fileName => {
    const extension = fileName?.split('.').pop().toLowerCase()
    switch (extension) {
      case 'pdf':
        return { icon: imgPath?.pdf?.image_path, bgColor: imgPath?.pdf?.bg_color }
      case 'xls':
      case 'xlsx':
        return { icon: imgPath?.xls?.image_path, bgColor: imgPath?.xls?.bg_color }
      case 'doc':
      case 'docx':
        return { icon: imgPath?.document?.image_path, bgColor: imgPath?.document?.bg_color }
      case 'mp3':
      case 'wav':
      case 'ogg':
        return { icon: imgPath?.audio?.image_path, bgColor: imgPath?.audio?.bg_color }
      default:
        return { icon: imgPath?.default?.image_path, bgColor: imgPath?.default?.bg_color }
    }
  }
  const truncateFilename = (filename, maxLength = 16) => {
    if (filename.length <= maxLength) return filename
    const start = filename.slice(0, Math.floor(maxLength / 2))
    const end = filename.slice(-Math.floor(maxLength / 2))
    return `${start}...${end}`
  }

  return (
    <Dialog open={isEditModal} onClose={() => setIsEditModal(false)} fullWidth maxWidth='sm'>
      <DialogTitle sx={{ backgroundColor: titleBackgroundColor }}>
        <IconButton
          aria-label='close'
          onClick={() => setIsEditModal(false)}
          sx={{ top: 8, right: 8, position: 'absolute', color: 'grey.500' }}
        >
          <Icon icon='mdi:close' />
        </IconButton>
        <Box display='flex' alignItems='center'>
          <Box
            sx={{
              backgroundColor: iconBackgroundColor,
              display: 'flex',
              alignItems: 'center',
              p: 3,
              borderRadius: '8px'
            }}
          >
            {renderIcon(detailData?.possession_type)}
          </Box>
          <Typography variant='h5' ml={2} color={valueColor}>
            {capitalizeFirstLetter(detailData?.possession_type)}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ backgroundColor: titleBackgroundColor }}>
        <Box
          sx={{
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            mb: 2
          }}
        >
          <Box sx={{ backgroundColor, padding: '16px', borderRadius: '8px 8px 0 0', mb: 2 }}>
            <Grid container alignItems='center'>
              <Grid item>
                <Avatar src={detailData?.species_image} alt='' variant='circular' sx={{ width: 46, height: 46 }} />
              </Grid>
              <Grid item sx={{ ml: 3 }}>
                <Typography variant='h6' color='#44544A'>
                  {capitalizeFirstLetter(detailData?.common_name)}
                </Typography>
                <Typography variant='body2' sx={{ fontStyle: 'italic', color: '#44544A' }}>
                  ({capitalizeFirstLetter(detailData?.scientific_name)})
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ pl: 6, pr: 6, pb: 3 }}>
            {renderDetailRow('Gender', capitalizeFirstLetter(detailData?.gender))}
            {detailData?.possession_type === 'acquisition' &&
              renderDetailRow('Acquired from', capitalizeFirstLetter(detailData?.where_to_acquisition))}

            {detailData?.possession_type === 'death' &&
              renderDetailRow('Animal ID', capitalizeFirstLetter(detailData?.death_animal_id))}

            {detailData?.possession_type !== 'death' && renderDetailRow('Total Count', detailData?.animal_count)}

            {detailData?.possession_type === 'transfer' && (
              <>
                {renderDetailRow('Transfer From', capitalizeFirstLetter(selectedParivesh?.organization_name))}
                {renderDetailRow('Transfer To', detailData?.where_to_transfer)}
              </>
            )}

            {detailData?.possession_type === 'death' && (
              <>
                {renderDetailRow(
                  'Date Of Death',
                  detailData?.death_date
                    ? `${Utility.formatDisplayDate(Utility.convertUTCToLocal(detailData?.death_date))} `
                    : 'NA'
                )}
                {renderDetailRow('Reason For Death', detailData?.reason_for_death)}
              </>
            )}
            {detailData?.possession_type === 'acquisition' && (
              <>
                {renderDetailRow('DGFT Number', capitalizeFirstLetter(detailData?.dgft_number))}
                {renderDetailRow('CITES Category', capitalizeFirstLetter(detailData?.cites_appendix))}
              </>
            )}

            {renderDetailRow('Created By', detailData?.created_by_user?.user_name)}
            {renderDetailRow(
              'Entry Date',
              detailData?.transaction_date
                ? `${Utility.formatDisplayDate(
                    Utility.convertUTCToLocal(detailData?.transaction_date)
                  )} ${Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(detailData?.transaction_date))}`
                : '-'
            )}
          </Box>
        </Box>

        {detailData?.attachments?.length > 0 && (
          <Box mt={6}>
            <Typography variant='body1' color={labelColor}>
              Attachments:
            </Typography>

            <Grid
              container
              direction={{ xs: 'column', sm: 'row' }} // Column for small screens, row for larger screens
              spacing={2}
              sx={{ mt: 2 }}
            >
              {detailData?.attachments?.map((src, index) => {
                const isImage = /\.(jpeg|jpg|gif|png|svg|JPG|svg)$/.test(src?.attachment_name)

                return (
                  <Grid
                    item
                    xs={12}
                    sm='auto'
                    md='auto'
                    lg='auto'
                    key={index}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'row', sm: 'column' }, // Row on small screens, column on larger
                      justifyContent: 'center'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                        boxSizing: 'border-box',
                        width: { xs: '100%', sm: 'auto' },
                        height: '60px',
                        bgcolor: isImage ? '#f0f0f0' : getIconByFileType(src?.attachment_name)?.bgColor
                      }}
                    >
                      {isImage ? (
                        <img
                          style={{
                            height: '60px',
                            width: '60px',
                            borderRadius: '20%',
                            objectFit: 'cover',
                            padding: '8px'
                          }}
                          alt={`Uploaded image ${index + 1}`}
                          src={src?.attachment}
                        />
                      ) : (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            padding: '4px',
                            paddingRight: '16px'
                          }}
                        >
                          <img
                            src={getIconByFileType(src?.attachment)?.icon}
                            alt=''
                            style={{
                              height: '40px',
                              width: '40px'
                            }}
                          />
                          <Tooltip title={src?.attachment_name}>
                            <Typography variant='body2' color='textSecondary'>
                              {truncateFilename(src?.attachment_name)}
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
