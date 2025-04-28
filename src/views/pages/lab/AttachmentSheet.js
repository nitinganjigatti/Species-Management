import React, { useState } from 'react'
import { Drawer, IconButton, Typography, TextField, Button, Box, Avatar, Card, Tooltip } from '@mui/material'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import { LoadingButton } from '@mui/lab'
import { postComment } from 'src/lib/api/lab/getLabRequest'
import Toaster from 'src/components/Toaster'
import moment from 'moment'
import CommonMediaView from 'src/components/lab/CommonMediaView'
function AttachmentSheet({ openAttachmentSheet, setOpenAttachmentSheet, attachmentData, fileViews }) {
  function extractHoursAndMinutes(date) {
    return moment(date).format('hh:mm A')
  }

  function convertUTCToLocal(date) {
    var stillUtc = moment.utc(date).toDate()
    var local = moment(stillUtc).local(true).format('YYYY-MM-DD HH:mm:ss')

    return local
  }

  return (
    <Drawer
      anchor='right'
      open={openAttachmentSheet}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '370px'] }
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
          //   p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Icon icon='fluent:comment-note-24-regular' width='28' height='28' color='rgba(68, 84, 74, 1)' />
          <Typography variant='h6'>Attachments</Typography>
        </Box>
        <IconButton
          sx={{ position: 'absolute', left: '320px', top: 16, zIndex: 102 }}
          onClick={() => setOpenAttachmentSheet(false)}
        >
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>

      <Box sx={{ pt: 22, pb: 6, display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center' }}>
        {attachmentData?.length > 0 &&
          attachmentData?.map(item => (
            <Box key={item.file}>
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
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          p: 2
                        }}
                      >
                        {item?.file_original_name}
                      </Typography>
                    </Tooltip>
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
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            </Box>
          ))}
      </Box>
    </Drawer>
  )
}

export default AttachmentSheet
