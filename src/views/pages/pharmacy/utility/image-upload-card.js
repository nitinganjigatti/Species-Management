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
  prescriptionField,
  imgBaseUrl,
  removeselectedImage,
  setPrescriptionField
}) => {
  console.log('Get??????', getValues('presc'))
  debugger

  const base_url = `${process.env.NEXT_PUBLIC_BASE_URL}`

  useEffect(() => {
    debugger
    if (fields.length > 0) {
      setPrescriptionField([...prescriptionField, fields])
    }
  }, [fields])

  {
    console.log('Prescription Images???', prescriptionField)
  }

  const renderFilePreview = file => {
    debugger
    if (file !== undefined) {
      if (typeof file === 'string') {
        return (
          <img
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid rgba(93, 89, 98, 0.14)'
            }}
            alt={file.name}
            src={`${base_url}${imgBaseUrl}${file}`}
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
              border: '1px solid rgba(93, 89, 98, 0.14)'
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
      {/* <CardContent> */}
      {/* <DropzoneWrapper className='dropzone'></DropzoneWrapper> */}

      <List>
        {prescriptionField?.map((image, index) => (
          <>
            <ListItem
              sx={{
                borderRadius: '10px'
              }}
              key={image?.file?.name}
            >
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div className='file-preview'>
                  {image && renderFilePreview(typeof image === 'string' ? image : image.file)}
                </div>
                <div style={{ margin: '10px' }}>
                  <Typography className='file-name'>{typeof image === 'string' ? image : image?.file?.name}</Typography>
                </div>
              </div>{' '}
              {console.log('image>>>>>>', image)}
              <IconButton onClick={() => removeselectedImage(index)}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </ListItem>
          </>
        ))}
      </List>
      {/* <ImageUploadComponent fields={fields} /> */}
      {/* </CardContent> */}
    </Box>
  )
}

export default ImageUploadComponent
