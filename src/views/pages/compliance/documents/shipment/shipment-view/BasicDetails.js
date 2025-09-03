import React, { useState } from 'react'
import { Box, Typography, TextField, Button, Grid, CircularProgress, CardContent } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import moment from 'moment'
import { useTheme } from '@mui/material/styles'
import { useAuth } from 'src/hooks/useAuth'

const BasicDetails = ({ airwaybillvalue, selectedId, startDate, uploadedFile, loader }) => {
  const theme = useTheme()
  const auth = useAuth()
  const imgPath = auth?.userData?.settings?.DEFAULT_IMAGE_MASTER
  // const rawValue = airwaybillvalue || ''
  // const removeSpaceValue = rawValue.replace(/\s+/g, '') // remove all spaces
  // const formattedValue =
  //   removeSpaceValue.length > 3 ? `${removeSpaceValue.slice(0, 3)} - ${removeSpaceValue.slice(3)}` : removeSpaceValue

  const getFileIcon = () => {
    const fileName = (uploadedFile?.name || uploadedFile?.file_original_name || '').toLowerCase()
    const ext = fileName?.split('.')?.pop()?.toLowerCase()

    if (!ext) return imgPath?.default

    if (['jpeg', 'jpg', 'png', 'svg', 'gif', 'webp'].includes(ext)) {
      return imgPath?.image
    }

    if (['pdf'].includes(ext)) {
      return imgPath?.pdf
    }

    if (['xls', 'xlsx'].includes(ext)) {
      return imgPath?.xls
    }

    if (['doc', 'docx'].includes(ext)) {
      return imgPath?.document
    }

    if (['mp3', 'wav', 'ogg'].includes(ext)) {
      return imgPath?.audio
    }

    return imgPath?.default
  }
  return (
    <>
      {!loader && airwaybillvalue ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1px',
            background: '#EFF5F266',
            borderRadius: '10px',
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            p: 8
          }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 4 }}>
              <Typography fontWeight='400' color={theme.palette.customColors.secondaryBg} fontSize='16px'>
                Shipment ID
              </Typography>
              <Typography color={theme.palette.customColors.OnSurfaceVariant} sx={{ pt: 1 }}>
                {airwaybillvalue}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, md: 4 }}>
              <Typography fontWeight='400' color={theme.palette.customColors.secondaryBg} fontSize='16px'>
                Date Of Issue
              </Typography>

              <Typography color={theme.palette.customColors.OnSurfaceVariant} sx={{ pt: 1 }}>
                {startDate ? moment(startDate).format('DD MMM YYYY') : '-'}
              </Typography>
            </Grid>
          </Grid>

          {/* File Section */}
          {uploadedFile?.file_path && (
            <a
              href={uploadedFile.file_path}
              target='_blank'
              rel='noopener noreferrer'
              style={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '10px',
                  backgroundColor: theme.palette.common.white,
                  minWidth: '280px',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={getFileIcon()?.image_path}
                  alt='PDF Icon'
                  width='18%'
                  style={{
                    marginRight: '8px',
                    background: theme.palette?.customColors?.Tertiary30,
                    borderRadius: '6px',
                    padding: '10px'
                  }}
                />
                <Typography
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '180px',
                    height: '40px',
                    pt: 2
                  }}
                >
                  {uploadedFile?.file_original_name}
                </Typography>
                <IconButton size='small'></IconButton>
              </Box>
            </a>
          )}
        </Box>
      ) : (
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      )}
    </>
  )
}

export default BasicDetails
