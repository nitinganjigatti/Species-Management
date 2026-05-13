import React, { useState } from 'react'
import type { MouseEvent, SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Drawer,
  IconButton,
  Typography,
  Box,
  Avatar,
  Card,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import moment from 'moment'
import { useTheme } from '@mui/material/styles'
import Utility from 'src/utility'
import { LoadingButton } from '@mui/lab'
import type { AttachmentSheetProps, FileAttachment } from 'src/types/lab'

function AttachmentSheet({
  openAttachmentSheet,
  setOpenAttachmentSheet,
  testDoc,
  testImage,
  fileViews,
  handleDeleteImg,
  permissions,
  image,
  document,
  deleteAttachmentLoader
}: AttachmentSheetProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<FileAttachment | null>(null)
  const [error, setError] = useState(false)

  function extractHoursAndMinutes(date: string) {
    return moment(date)?.format('hh:mm A')
  }

  function convertUTCToLocal(date: string | undefined) {
    const stillUtc = moment?.utc(date)?.toDate()
    const local = moment(stillUtc)?.local(true)?.format('YYYY-MM-DD HH:mm:ss')

    return local
  }

  const handleConfirmDialog = (e: MouseEvent, item: FileAttachment) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedItem(item)
    if (Number(image?.length || 0) + Number(document?.length || 0) === 1) {
      setError(true)
      setOpenConfirmDialog(true)
    } else {
      setOpenConfirmDialog(true)
    }
  }

  const handleDelete = async (e: MouseEvent | SyntheticEvent) => {
    if (selectedItem && openConfirmDialog) {
      await handleDeleteImg(e, selectedItem)
      setOpenConfirmDialog(false)
      setSelectedItem(null)
    }
  }

  return (
    <Drawer
      anchor='right'
      open={openAttachmentSheet}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '610px'] }
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          zIndex: 100,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: 4
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Icon icon='fluent:comment-note-24-regular' width='28' height='28' color='rgba(68, 84, 74, 1)' />
          <Typography variant='h6'>{t('reports')}</Typography>
        </Box>
        <IconButton
          sx={{ position: 'absolute', left: '560px', top: 16, zIndex: 102 }}
          onClick={() => setOpenAttachmentSheet(false)}
        >
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>
      <Box
        sx={{
          pt: 22,
          pb: 6,
          px: 4.5,
          boxSizing: 'border-box',
          display: 'flex',
          flexWrap: 'wrap',
          flexDirection: 'row',
          gap: 4
        }}
      >
        {(testImage?.length ?? 0) > 0 &&
          testImage?.map(item => (
            <Box key={item?.file}>
              <a
                key={item?.file}
                href={item?.file}
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
                    height: '250px'
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
                    <>
                      {(permissions?.allow_full_access || permissions?.allow_upload_reports) && (
                        <IconButton onClick={e => handleConfirmDialog(e, item)}>
                          <Icon icon='material-symbols:close' fontSize={20} color={theme.palette.primary.main} />
                        </IconButton>
                      )}
                    </>
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
                        src={item?.file ? item?.file : undefined}
                        alt={item?.file_original_name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <img
                        src={fileViews?.image?.image_path}
                        alt={item?.file_original_name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: '400',
                        lineHeight: '19.36px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {Utility.convertUTCToLocalDate(convertUTCToLocal(item?.user_profile?.created_at))}
                    </Typography>
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
                </Card>
              </a>
            </Box>
          ))}

        {(testDoc?.length ?? 0) > 0 &&
          testDoc?.map(item => (
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
                  height: '250px'
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
                        whiteSpace: 'nowrap',
                        p: 2
                      }}
                    >
                      {item?.file_original_name}
                    </Typography>
                  </Tooltip>
                  <>
                    {(permissions?.allow_full_access || permissions?.allow_upload_reports) && (
                      <IconButton onClick={e => handleConfirmDialog(e, item)}>
                        <Icon icon='material-symbols:close' fontSize={20} color={theme.palette.primary.main} />
                      </IconButton>
                    )}
                  </>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>{Utility.convertUTCToLocalDate(convertUTCToLocal(item?.user_profile?.created_at))}</Box>
                  <Box>{extractHoursAndMinutes(convertUTCToLocal(item?.user_profile?.created_at))}</Box>
                </Box>
              </Card>
            </a>
          ))}
      </Box>
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)} fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon
            icon='material-symbols:delete-outline'
            width='24'
            height='24'
            color={theme.palette.customColors.Error}
          />
          <Typography
            variant='h6'
            sx={{
              fontWeight: 'bold'
            }}
          >
            {t('lab_module.delete_file')}
          </Typography>
        </DialogTitle>

        {error ? (
          <>
            <DialogContent>
              <DialogContentText>
                <Typography>
                  {t('lab_module.delete_file_error_msg')}
                </Typography>
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                sx={{ backgroundColor: theme.palette.primary.main }}
                onClick={() => {
                  setOpenConfirmDialog(false)
                  setTimeout(() => {
                    setError(false)
                  }, 1000)
                }}
                variant='contained'
              >
                {t('ok')}
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogContent>
              <DialogContentText>
                {t('are_you_sure_delete')}{' '}
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
                {t('cancel')}
              </LoadingButton>
              <LoadingButton loading={deleteAttachmentLoader} onClick={handleDelete} variant='contained' color='error'>
                {t('delete')}
              </LoadingButton>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Drawer>
  )
}

export default AttachmentSheet
