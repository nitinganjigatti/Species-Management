import {
  Avatar,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import React, { useState } from 'react'
import moment from 'moment'

const CommonMediaView = ({ type, image, document, handleDeleteImg, fileViews, permissions, allCompleted }) => {
  const theme = useTheme()
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [error, setError] = useState(false)
  // console.log('allCompleted', allCompleted)

  function extractHoursAndMinutes(date) {
    //9:21 PM
    return moment(date).format('hh:mm A')
  }

  function convertUTCToLocal(date) {
    var stillUtc = moment.utc(date).toDate()
    var local = moment(stillUtc).local(true).format('YYYY-MM-DD HH:mm:ss')

    return local
  }

  const handleConfirmDialog = (e, item) => {
    let attachments = image !== undefined ? image : document !== undefined ? document : []
    e.preventDefault()
    e.stopPropagation()
    setSelectedItem(item)
    setOpenConfirmDialog(true)

    // Check if all statuses start with "completed"

    // const totalAttachments = attachments.flat().length // Merge image & document arrays into one

    // console.log('Total Attachments:', totalAttachments)

    // if (individual && attachments.length === 1) {
    //   setError(true)

    //   return
    // }

    // Check if total rows are equal to total attachments
    if (allCompleted) {
      setError(true)

      return
    }
  }

  const handleDelete = async e => {
    if (selectedItem && openConfirmDialog) {
      await handleDeleteImg(e, selectedItem) // Pass the selected item
      setOpenConfirmDialog(false)
      setSelectedItem(null) // Reset after deletion
    }
  }

  return (
    <>
      <>
        {image?.length > 0 &&
          image?.map(item => (
            <a
              key={item.file}
              href={item.file}
              target='_blank'
              rel='noopener noreferrer'
              style={{ textDecoration: 'none' }}
            >
              <Card
                sx={{
                  p: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  width: '271px',
                  height: '224px'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mt: -2
                  }}
                >
                  <Tooltip title={item?.file_original_name ? item?.file_original_name : '-'}>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: '400',
                        lineHeight: '19.36px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        p: 2
                      }}
                    >
                      {item?.file_original_name}
                    </Typography>
                  </Tooltip>
                  {type !== 'medical' && (
                    <>
                      {(permissions?.allow_full_access || permissions?.allow_upload_reports) && (
                        <IconButton onClick={e => handleConfirmDialog(e, item)}>
                          <Icon icon='material-symbols:close' fontSize={20} color={theme.palette.primary.main} />
                        </IconButton>
                      )}
                    </>
                  )}
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '239px',
                    height: '133px',
                    bgcolor: fileViews?.image?.bg_color,
                    mt: -2
                  }}
                >
                  {item.file ? (
                    <img
                      src={item.file ? item.file : null}
                      alt={item.file_original_name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <img
                      src={fileViews?.image?.image_path}
                      alt={item.file_original_name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  )}
                  {/* <img src='/icons/document_icon.png' alt='Icon' style={{ width: '56px', height: '60px' }} /> */}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, alignItems: 'center' }}>
                    <Avatar src={item?.user_profile?.user_profile_pic} sx={{ width: '24px', height: '24px' }} />

                    <Tooltip title={item?.user_profile?.name || ''}>
                      <Typography
                        sx={{
                          width: 120,
                          fontSize: '16px',
                          fontWeight: '400',
                          lineHeight: '19.36px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item?.user_profile?.name}
                      </Typography>
                    </Tooltip>
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        width: 76,
                        fontSize: '16px',
                        fontWeight: '400',
                        lineHeight: '19.36px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {extractHoursAndMinutes(convertUTCToLocal(item?.user_profile?.created_at))}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </a>
          ))}
        {document?.length > 0 &&
          document?.map(item => (
            <a
              key={item.file}
              href={item.file}
              target='_blank'
              rel='noopener noreferrer'
              style={{ textDecoration: 'none' }}
            >
              <Card
                sx={{
                  p: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  width: '271px',
                  height: '224px'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mt: -2
                  }}
                >
                  <Tooltip title={item?.file_original_name ? item?.file_original_name : '-'}>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: '400',
                        lineHeight: '19.36px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        p: 2
                      }}
                    >
                      {item?.file_original_name}
                    </Typography>
                  </Tooltip>
                  {type !== 'medical' && (
                    <>
                      {(permissions?.allow_full_access || permissions?.allow_upload_reports) && (
                        <IconButton onClick={e => handleConfirmDialog(e, item)}>
                          <Icon icon='material-symbols:close' fontSize={20} color={theme.palette.primary.main} />
                        </IconButton>
                      )}
                    </>
                  )}
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '239px',
                    height: '133px',
                    bgcolor:
                      item?.file_type === 'application/pdf'
                        ? fileViews?.pdf?.bg_color
                        : item?.file_type == 'text/csv'
                        ? fileViews?.xls?.bg_color
                        : item?.file_type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                        ? fileViews?.document?.bg_color
                        : item?.file_type == 'audio/mpeg'
                        ? fileViews?.audio?.bg_color
                        : theme.palette.customColors.antzSecondaryBg,
                    mt: -2
                  }}
                >
                  {/* {console.log('item?.file_original_name :>> ', item?.file_type)} */}
                  <img
                    src={
                      item?.file_type === 'application/pdf'
                        ? fileViews?.pdf?.image_path
                        : item?.file_type == 'text/csv'
                        ? fileViews?.xls?.image_path
                        : item?.file_type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                        ? fileViews?.document?.image_path
                        : item?.file_type == 'audio/mpeg'
                        ? fileViews?.audio?.image_path
                        : '/icons/document_icon.png'
                    }
                    alt='Icon'
                    style={{ width: '56px', height: '60px', objectFit: 'contain' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={item?.user_profile?.user_profile_pic} sx={{ width: '24px', height: '24px' }} />
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: '400',
                        lineHeight: '19.36px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item?.user_profile?.name}
                    </Typography>
                  </Box>
                  <Box>{extractHoursAndMinutes(convertUTCToLocal(item?.user_profile?.created_at))}</Box>
                </Box>
              </Card>
            </a>
          ))}
      </>
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)} fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* <DeleteOutlineIcon sx={{ color: "red" }} /> */}
          <Icon
            icon='material-symbols:delete-outline'
            width='24'
            height='24'
            color={theme.palette.customColors.Error}
          />
          <Typography variant='h6' fontWeight='bold'>
            Delete File!
          </Typography>
        </DialogTitle>
        <DialogContent>
          {error ? (
            <DialogContentText>
              <Typography>
                Either upload the new report or change the test status to pending to delete this report.
              </Typography>
            </DialogContentText>
          ) : (
            <DialogContentText>
              Are you sure you want to delete{' '}
              <Typography component='span' sx={{ color: theme.palette.customColors.Error, fontWeight: 'bold' }}>
                {selectedItem?.file_original_name}
              </Typography>
              &nbsp;?
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenConfirmDialog(false)
              setError(false)
            }}
            variant='outlined'
          >
            CANCEL
          </Button>
          {!error && !allCompleted && (
            <Button onClick={handleDelete} variant='contained' color='error'>
              DELETE
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}

export default CommonMediaView
