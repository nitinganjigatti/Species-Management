import { Avatar, Box, Card, IconButton, Tooltip, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'

import React from 'react'
import moment from 'moment'

const CommonMediaView = ({ type, image, document, handleDeleteImg, userData }) => {
  console.log('type :>> ', type)
  console.log('item :>> ', image)

  return (
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
              sx={{ p: '16px', display: 'flex', flexDirection: 'column', gap: '8px', width: '271px', height: '224px' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: -2 }}>
                <Tooltip title={item?.file_original_name ? item?.file_original_name : '-'}>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: '400',
                      lineHeight: '19.36px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item?.file_original_name}
                  </Typography>
                </Tooltip>
                <IconButton onClick={e => handleDeleteImg(e, item)}>
                  <Icon icon='material-symbols:close' fontSize={20} color={'#37BD69'} />
                </IconButton>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '239px',
                  height: '133px',
                  bgcolor: '#dff9f7',
                  mt: -2
                }}
              >
                {item.file ? (
                  <img src={item.file} alt={item.file_original_name} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <img
                    src='/images/tablet.png'
                    alt={item.file_original_name}
                    style={{ width: '100%', height: '100%' }}
                  />
                )}
                {/* <img src='/icons/document_icon.png' alt='Icon' style={{ width: '56px', height: '60px' }} /> */}
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
                <Box>{moment(userData?.created_at).format('hh : mm A')}</Box>
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
              sx={{ p: '16px', display: 'flex', flexDirection: 'column', gap: '8px', width: '271px', height: '224px' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: -2 }}>
                <Tooltip title={item?.file_original_name ? item?.file_original_name : '-'}>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: '400',
                      lineHeight: '19.36px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item?.file_original_name}
                  </Typography>
                </Tooltip>
                <IconButton onClick={e => handleDeleteImg(e, item)}>
                  <Icon icon='material-symbols:close' fontSize={20} color={'#37BD69'} />
                </IconButton>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '239px',
                  height: '133px',
                  bgcolor: '#dff9f7',
                  mt: -2
                }}
              >
                <img src='/icons/document_icon.png' alt='Icon' style={{ width: '56px', height: '60px' }} />
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
                <Box>{moment(userData?.created_at).format('hh : mm A')}</Box>
              </Box>
            </Card>
          </a>
        ))}
    </>
  )
}

export default CommonMediaView
