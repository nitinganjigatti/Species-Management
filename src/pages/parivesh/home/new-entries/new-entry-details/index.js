import React from 'react'
import { Box, Grid, Avatar, Typography, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material'
import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'

const NewEntryDetailsDialog = ({ isEditModal, setIsEditModal, detailData }) => {
  const borderColor = '#ccc'
  const backgroundColor = '#E1F9ED'
  const titleBackgroundColor = '#FFFFFF'
  const iconBackgroundColor = '#EFF5F2'
  const labelColor = '#7A8684'
  const valueColor = '#1F515B'

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
          {value || '-'}
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
            {renderDetailRow('Total Count', detailData?.animal_count)}

            {detailData?.possession_type === 'transfer' && (
              <>
                {renderDetailRow('Transfer From', '-')}
                {renderDetailRow('Transfer To', '-')}
              </>
            )}

            {detailData?.possession_type === 'death' && (
              <>
                {renderDetailRow('Date Of Death', detailData?.date_of_death)}
                {renderDetailRow('Reason For Death', detailData?.reason_for_death)}
              </>
            )}

            {renderDetailRow('Created By', detailData?.created_by_user?.user_name)}
            {renderDetailRow(
              'Entry Date',
              detailData?.transaction_date
                ? `${Utility.formatDisplayDate(
                    Utility.convertUTCToLocal(detailData?.transaction_date)
                  )} ${Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(detailData?.transaction_date))}`
                : '16 Jun 2024 10:20 AM'
            )}
          </Box>
        </Box>

        <Box mt={6}>
          <Typography variant='body1' color={labelColor}>
            Attachments:
          </Typography>
          {/* <Box display='flex' mt={1}>
            <Box display='flex' alignItems='center' mr={2}>
              <Icon icon='mdi:file-document-outline' color='#00afd6' />
              <Typography variant='body2' ml={1}>
                report.doc
              </Typography>
            </Box>
            <Box display='flex' alignItems='center'>
              <Icon icon='mdi:file-pdf-box' color='#ff5722' />
              <Typography variant='body2' ml={1}>
                report.pdf
              </Typography>
            </Box>
          </Box> */}
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default NewEntryDetailsDialog
