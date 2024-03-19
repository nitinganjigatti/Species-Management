import React, { Fragment, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { Icon } from '@iconify/react'

// const styleComponent = styled(Box) => {{
//   minHeight: 100,
//     display: 'none',
//     flexWrap: 'wrap',
//     cursor: 'pointer',
//     position: 'relative',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: theme.spacing(4),
//     borderRadius: theme.shape.borderRadius,
//     border: `2px dashed ${theme.palette.mode === 'light' ? 'rgba(93, 89, 98, 0.22)' : 'rgba(247, 244, 254, 0.14)'}`,
// }}

const ImageUploadComponent = ({
  fields,
  getValues,
  prescriptionImage,
  imgBaseUrl,
  removeselectedImage,
  setPrescriptionField
}) => {
  // const base_url = `${process.env.NEXT_PUBLIC_BASE_URL}`
  const MAX_NAME_LENGTH = 15

  const getLastCharacters = (name, length) => {
    if (name.length <= length) {
      return name
    }

    return name.slice(-length)
  }

  const renderFilePreview = file => {
    if (file !== undefined) {
      if (typeof file === 'string') {
        return (
          <img
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: theme => `1px solid ${theme.palette.divider}`,
              borderColor: theme => `rgba(${theme.palette.customColors.main}, 0.25)`
            }}
            alt={file.name}
            src={`${file}`}
          />
        )
      }
      if (file instanceof Blob || file instanceof File) {
        return (
          <img
            style={{
              width: '38px',
              height: '38px',

              borderRadius: '10px',
              border: theme => `1px solid ${theme.palette.divider}`,
              borderColor: theme => `rgba(${theme.palette.customColors.main}, 0.25)`
            }}
            alt={typeof file === 'string' ? file.file.name : file?.name}
            src={URL.createObjectURL(file)}
          />
        )
      } else {
        return <Icon icon='mdi:file-document-outline' />
      }
    }
  }

  return (
    <Box>
      <List>
        {prescriptionImage?.map((image, index) => (
          <>
            <ListItem
              key={image}
              sx={{
                borderRadius: '10px'
              }}
            >
              {console.log('type of image', typeof image)}
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div className='file-preview'>
                  {image && renderFilePreview(typeof image === 'string' ? image : image)}
                </div>
                <div style={{ margin: '10px' }}>
                  <Typography className='file-name'>
                    {getLastCharacters(typeof image === 'string' ? image : image?.name, MAX_NAME_LENGTH)}
                  </Typography>
                </div>
              </div>{' '}
              <IconButton onClick={() => removeselectedImage(index)}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </ListItem>
          </>
        ))}
      </List>
    </Box>
  )
}

export default ImageUploadComponent
