import React, { useState } from 'react'
import {
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
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'
import FallbackImage from 'src/views/utility/FallbackImage'

const CommonMediaView = ({
  type,
  image,
  document,
  handleDeleteImg,
  fileViews,
  permissions,
  deleteAttachmentLoader
}) => {
  const theme = useTheme()
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [error, setError] = useState(false)

  const handleConfirmDialog = (e, item) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedItem(item)
    if (Number(image?.length || 0) + Number(document?.length || 0) == 1) {
      setError(true)
      setOpenConfirmDialog(true)
    } else {
      setOpenConfirmDialog(true)
    }
  }

  const handleDelete = async e => {
    if (selectedItem && openConfirmDialog) {
      await handleDeleteImg(e, selectedItem) // Pass the selected item
      setOpenConfirmDialog(false)
      setSelectedItem(null) // Reset after deletion
    }
  }

  const closeConfirmDialoge = () => {
    setOpenConfirmDialog(false)
    setTimeout(() => {
      setError(false)
    }, 1000)
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
                  height: '244px'
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
                        whiteSpace: 'nowrap',
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
                    <FallbackImage
                      src={item.file ? item.file : null}
                      alt={item.file_original_name}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <FallbackImage
                      src={fileViews?.image?.image_path}
                      alt={item.file_original_name}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, alignItems: 'center' }}>
                    <FallbackAvatar src={item?.user_profile?.user_profile_pic} sx={{ width: '24px', height: '24px' }} />

                    <Tooltip title={item?.user_profile?.name || ''}>
                      <Typography
                        sx={{
                          width: '212px',
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
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: '400',
                      lineHeight: '19.36px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {Utility.convertUTCToLocalDate(item?.user_profile?.created_at)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: '400',
                      lineHeight: '19.36px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(item?.user_profile?.created_at))}
                  </Typography>
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
                  height: '244px'
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
                        whiteSpace: 'nowrap',
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
                    {/* <Avatar src={item?.user_profile?.user_profile_pic} sx={{ width: '24px', height: '24px' }} /> */}
                    <FallbackAvatar src={item?.user_profile?.user_profile_pic} sx={{ borderRadius: '50%', width: '24px', height: '24px' }} />
                    <Typography
                      sx={{
                        width: '212px',
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
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: '400',
                      lineHeight: '19.36px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {Utility.convertUTCToLocalDate(item?.user_profile?.created_at)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: '400',
                      lineHeight: '19.36px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(item?.user_profile?.created_at))}
                  </Typography>
                </Box>
              </Card>
            </a>
          ))}
      </>
      <Dialog open={openConfirmDialog} onClose={() => closeConfirmDialoge()} fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon
            icon='material-symbols:delete-outline'
            width='24'
            height='24'
            color={theme.palette.customColors.Error}
          />
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: 'bold'
            }}
          >
            Delete File!
          </Typography>
        </DialogTitle>

        {error ? (
          <>
            <DialogContent>
              <DialogContentText>
                <Typography>
                  Either upload the new report or change the test status to pending to delete this report.
                </Typography>
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                sx={{ backgroundColor: theme.palette.primary.main }}
                onClick={() => closeConfirmDialoge()}
                variant='contained'
              >
                OK
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete{' '}
                <Typography component='span' sx={{ color: theme.palette.customColors.Error, fontWeight: 'bold' }}>
                  {selectedItem?.file_original_name}
                </Typography>
                &nbsp;?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <LoadingButton
                disabled={deleteAttachmentLoader}
                onClick={() => {
                  setOpenConfirmDialog(false)
                  setError(false)
                }}
                variant='outlined'
              >
                CANCEL
              </LoadingButton>
              <LoadingButton loading={deleteAttachmentLoader} onClick={handleDelete} variant='contained' color='error'>
                DELETE
              </LoadingButton>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  )
}

export default CommonMediaView
